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
async fn detect_crop_areas(file_path: String) -> Result<CropArea, String> {
    let path = Path::new(&file_path);
    let ext = path
        .extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default();

    if matches!(ext.as_str(), "mp4" | "mov" | "avi" | "mkv") {
        // Exploit FFmpeg to identify video crop boundaries automatically
        let output = std::process::Command::new("ffmpeg")
            .args([
                "-i",
                &file_path,
                "-vframes",
                "24",
                "-vf",
                "cropdetect",
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

        let mut min_x = width;
        let mut min_y = height;
        let mut max_x = 0;
        let mut max_y = 0;

        for (x, y, pixel) in img.enumerate_pixels() {
            // Using extremely simplistic visual thresholding for 'black'
            if pixel[0] > 10 || pixel[1] > 10 || pixel[2] > 10 {
                min_x = min_x.min(x);
                max_x = max_x.max(x);
                min_y = min_y.min(y);
                max_y = max_y.max(y);
            }
        }

        if min_x > max_x {
            // Failsafe for entirely pure black images
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

        let out_path = output_dir.join(format!("{}_cropped.{}", filename, out_ext));

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
                    }
                }
                Err(e) => {
                    err_msg = Some(format!("FFmpeg execution failed: {}", e));
                }
            }
        } else {
            // Process static image arrays
            match image::open(&item.path) {
                Ok(mut img) => {
                    let max_w = img.width().saturating_sub(crop.x);
                    let max_h = img.height().saturating_sub(crop.y);
                    let final_w = if max_w == 0 { img.width() } else { crop.w.min(max_w) };
                    let final_h = if max_h == 0 { img.height() } else { crop.h.min(max_h) };

                    if final_w > 0 && final_h > 0 {
                        // Perform the crop on the dynamically loaded image
                        let cropped = image::imageops::crop(&mut img, crop.x, crop.y, final_w, final_h).to_image();
                        
                        // We must wrap the ImageBuffer back into a DynamicImage to leverage easy format conversions
                        let dynamic_cropped = image::DynamicImage::ImageRgba8(cropped);

                        // If the target format is JPEG, we MUST drop the Alpha channel (Rgba8 -> Rgb8)
                        let save_result = if out_ext == "jpg" || out_ext == "jpeg" {
                            dynamic_cropped.into_rgb8().save(&out_path)
                        } else {
                            dynamic_cropped.save(&out_path)
                        };

                        if let Err(e) = save_result {
                            err_msg = Some(format!("Failed to save cropped image: {}", e));
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
