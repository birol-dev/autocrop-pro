use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::mpsc;
use tauri::{Emitter, Window};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct CropArea {
    w: u32,
    h: u32,
    x: u32,
    y: u32,
}

#[derive(Deserialize, Debug)]
pub struct ProcessOptions {
    pub tolerance: i32,
    pub output_format: String,
    pub padding: bool,
    pub delete_original: bool,
}

#[derive(Deserialize, Debug)]
pub struct ProcessItem {
    pub path: String,
    pub crop: CropArea,
}

#[derive(Serialize, Clone, Debug)]
pub struct ProgressEvent {
    pub current: usize,
    pub total: usize,
    pub message: String,
}

#[tauri::command]
async fn detect_crop_areas(file_path: String, tolerance: f32) -> Result<CropArea, String> {
    let path = Path::new(&file_path);
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default();

    if matches!(ext.as_str(), "mp4" | "mov" | "avi" | "mkv") {
        // Exploit FFmpeg to identify video crop boundaries automatically
        let limit = tolerance / 100.0;
        let crop_filter = format!("cropdetect=limit={}:round=2", limit);
        let output = std::process::Command::new("ffmpeg")
            .args([
                "-i",
                &file_path,
                "-vframes",
                "24",
                "-vf",
                &crop_filter,
                "-f",
                "null",
                "-",
            ])
            .output()
            .map_err(|e| format!("FFmpeg failed: {}", e))?;

        let stderr = String::from_utf8_lossy(&output.stderr);
        let re = regex::Regex::new(r"crop=(\d+):(\d+):(\d+):(\d+)").unwrap();

        let mut best_crop = CropArea { w: 0, h: 0, x: 0, y: 0 };
        for cap in re.captures_iter(&stderr) {
            best_crop.w = cap[1].parse().unwrap_or(0);
            best_crop.h = cap[2].parse().unwrap_or(0);
            best_crop.x = cap[3].parse().unwrap_or(0);
            best_crop.y = cap[4].parse().unwrap_or(0);
        }

        Ok(best_crop)
    } else {
        // Image Processing: identify black border thresholds
        let img = image::open(&file_path)
            .map_err(|e| e.to_string())?
            .to_rgb8();
        let (width, height) = img.dimensions();

        let mut row_counts = vec![0; height as usize];
        let mut col_counts = vec![0; width as usize];

        let threshold = ((tolerance / 100.0) * 255.0) as u8;

        for (x, y, pixel) in img.enumerate_pixels() {
            // A pixel is 'content' if it is brighter than our tolerance threshold
            // Using >= ensures a 100% tolerance (255 threshold) still targets pure white pixels
            if pixel[0] >= threshold || pixel[1] >= threshold || pixel[2] >= threshold {
                row_counts[y as usize] += 1;
                col_counts[x as usize] += 1;
            }
        }

        // Noise threshold: A row/col must have at least 0.5% content pixels to be kept
        let noise_limit_x = (width as f32 * 0.005).max(1.0) as u32;
        let noise_limit_y = (height as f32 * 0.005).max(1.0) as u32;

        let mut min_x = 0;
        let mut max_x = width.saturating_sub(1);
        let mut min_y = 0;
        let mut max_y = height.saturating_sub(1);

        while min_x < max_x && col_counts[min_x as usize] < noise_limit_y {
            min_x += 1;
        }
        while max_x > min_x && col_counts[max_x as usize] < noise_limit_y {
            max_x -= 1;
        }

        while min_y < max_y && row_counts[min_y as usize] < noise_limit_x {
            min_y += 1;
        }
        while max_y > min_y && row_counts[max_y as usize] < noise_limit_x {
            max_y -= 1;
        }

        if min_x >= max_x || min_y >= max_y {
            // Failsafe if the image was entirely stripped
            return Ok(CropArea { w: width, h: height, x: 0, y: 0 });
        }

        Ok(CropArea {
            w: max_x - min_x + 1,
            h: max_y - min_y + 1,
            x: min_x,
            y: min_y,
        })
    }
}

#[tauri::command]
async fn process_files(
    window: Window,
    items: Vec<ProcessItem>,
    options: ProcessOptions,
) -> Result<(), String> {
    let output_dir = dirs::document_dir()
        .ok_or("Could not find system Documents folder")?
        .join("AutoCrop_Output");

    std::fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;

    let total = items.len();
    let current_completed = AtomicUsize::new(0);

    // Multithreaded execution across tasks using Rayon
    let (tx, rx) = mpsc::channel();

    items.into_par_iter().for_each_with(tx, |tx, item| {
        let path = Path::new(&item.path);
        let ext = path
            .extension()
            .and_then(|s| s.to_str())
            .map(|s| s.to_lowercase())
            .unwrap_or_default();
            
        let filename = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("output");

        let out_ext = if options.output_format == "Same as source" || options.output_format.is_empty() {
            ext.clone()
        } else {
            options.output_format.to_lowercase()
        };

        let is_video = matches!(ext.as_str(), "mp4" | "mov" | "avi" | "mkv");
        let safe_out_ext = if is_video {
            if matches!(out_ext.as_str(), "mp4" | "mov" | "avi" | "mkv") { out_ext } else { ext.clone() }
        } else {
            if matches!(out_ext.as_str(), "mp4" | "mov" | "avi" | "mkv") { "png".to_string() } else { out_ext }
        };

        let out_path = output_dir.join(format!("{}_cropped.{}", filename, safe_out_ext));

        // Inject intentional buffer margins around crops
        let mut crop = item.crop.clone();
        if options.padding {
            let pad_val = 10;
            crop.x = crop.x.saturating_sub(pad_val);
            crop.y = crop.y.saturating_sub(pad_val);
            crop.w += pad_val * 2;
            crop.h += pad_val * 2;
        }

        let crop_str = format!("{}:{}:{}:{}", crop.w, crop.h, crop.x, crop.y);
        let mut err_msg = None;

        if matches!(ext.as_str(), "mp4" | "mov" | "avi" | "mkv") {
            // Apply FFmpeg video dimension filters directly
            match std::process::Command::new("ffmpeg")
                .args([
                    "-y",
                    "-i",
                    &item.path,
                    "-vf",
                    &format!("crop={}", crop_str),
                    "-c:a",
                    "copy",
                    out_path.to_str().unwrap_or(""),
                ])
                .output()
            {
                Ok(output) => {
                    if !output.status.success() {
                        err_msg = Some(format!("FFmpeg failed: {}", String::from_utf8_lossy(&output.stderr)));
                        let _ = std::fs::remove_file(&out_path);
                    }
                }
                Err(e) => {
                    err_msg = Some(format!("FFmpeg execution failed: {}", e));
                    let _ = std::fs::remove_file(&out_path);
                }
            }
        } else {
            // Process static image arrays
            match image::open(&item.path) {
                Ok(mut img) => {
                    let safe_x = crop.x.min(img.width().saturating_sub(1));
                    let safe_y = crop.y.min(img.height().saturating_sub(1));
                    let max_w = img.width().saturating_sub(safe_x);
                    let max_h = img.height().saturating_sub(safe_y);
                    let final_w = if crop.w == 0 { max_w } else { crop.w.min(max_w) };
                    let final_h = if crop.h == 0 { max_h } else { crop.h.min(max_h) };

                    if final_w > 0 && final_h > 0 {
                        // Perform the crop on the dynamically loaded image
                        let cropped = image::imageops::crop(&mut img, safe_x, safe_y, final_w, final_h).to_image();
                        
                        // We must wrap the ImageBuffer back into a DynamicImage to leverage easy format conversions
                        let dynamic_cropped = image::DynamicImage::ImageRgba8(cropped);

                        // If the target format is JPEG, we MUST drop the Alpha channel (Rgba8 -> Rgb8)
                        let save_result = if safe_out_ext == "jpg" || safe_out_ext == "jpeg" {
                            dynamic_cropped.into_rgb8().save(&out_path)
                        } else {
                            dynamic_cropped.save(&out_path)
                        };

                        if let Err(e) = save_result {
                            err_msg = Some(format!("Failed to save cropped image: {}", e));
                            let _ = std::fs::remove_file(&out_path);
                        }
                    } else {
                        err_msg = Some(format!("Invalid computed crop bounds: {}x{}", final_w, final_h));
                    }
                }
                Err(e) => {
                    err_msg = Some(format!("Failed to open original image {}: {}", &item.path, e));
                }
            }
        }

        if err_msg.is_none() && options.delete_original {
            let _ = std::fs::remove_file(&item.path);
        }

        // Standardize event reporting back to frontend regardless of individual file success
        let completed = current_completed.fetch_add(1, Ordering::SeqCst) + 1;
        let event_message = match &err_msg {
            Some(err) => {
                let _ = tx.send(err.clone());
                format!("Error processing {}: {}", filename, err)
            },
            None => format!("Processed {}", filename),
        };

        let _ = window.emit(
            "crop-progress",
            ProgressEvent {
                current: completed,
                total,
                message: event_message,
            },
        );
    });

    let errors: Vec<String> = rx.into_iter().collect();
    if !errors.is_empty() {
        return Err(format!("Errors occurred during processing:\n{}", errors.join("\n")));
    }

    Ok(())
}

#[tauri::command]
fn open_output_folder() -> Result<(), String> {
    let output_dir = dirs::document_dir()
        .ok_or("Could not find system Documents folder")?
        .join("AutoCrop_Output");

    std::fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .arg(&output_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "macos")]
    std::process::Command::new("open")
        .arg(&output_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    #[cfg(target_os = "linux")]
    std::process::Command::new("xdg-open")
        .arg(&output_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            detect_crop_areas,
            process_files,
            open_output_folder
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
