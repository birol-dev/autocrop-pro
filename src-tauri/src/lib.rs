use std::path::Path;
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use rayon::prelude::*;

#[derive(Serialize, Deserialize, Clone)]
pub struct CropArea {
    w: u32,
    h: u32,
    x: u32,
    y: u32,
}

#[derive(Deserialize)]
pub struct ProcessOptions {
    pub tolerance: i32,
    pub output_format: String,
    pub padding: bool,
    pub delete_original: bool,
}

#[derive(Deserialize)]
pub struct ProcessItem {
    pub path: String,
    pub crop: CropArea,
}

#[derive(Serialize, Clone)]
pub struct ProgressEvent {
    pub current: usize,
    pub total: usize,
    pub message: String,
}

#[tauri::command]
async fn detect_crop_areas(file_path: String) -> Result<CropArea, String> {
    let path = Path::new(&file_path);
    let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
    
    if ext == "mp4" || ext == "mov" || ext == "avi" || ext == "mkv" {
        // Run FFmpeg
        let output = std::process::Command::new("ffmpeg")
            .args(["-i", &file_path, "-vframes", "24", "-vf", "cropdetect", "-f", "null", "-"])
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
        // Image processing
        let img = image::open(&file_path).map_err(|e| e.to_string())?.to_rgb8();
        let (width, height) = img.dimensions();
        
        let mut min_x = width;
        let mut min_y = height;
        let mut max_x = 0;
        let mut max_y = 0;
        
        for (x, y, pixel) in img.enumerate_pixels() {
            // simple threshold for black
            if pixel[0] > 10 || pixel[1] > 10 || pixel[2] > 10 {
                if x < min_x { min_x = x; }
                if x > max_x { max_x = x; }
                if y < min_y { min_y = y; }
                if y > max_y { max_y = y; }
            }
        }
        
        if min_x > max_x {
            // all black image
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
    window: tauri::Window,
    items: Vec<ProcessItem>,
    options: ProcessOptions
) -> Result<(), String> {
    let output_dir = dirs::document_dir()
        .ok_or("Could not find Documents folder")?
        .join("AutoCrop_Output");
        
    std::fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;
    
    let total = items.len();
    let current_completed = std::sync::atomic::AtomicUsize::new(0);
    
    // Process items in parallel over Rayon threadpool
    items.into_par_iter().for_each(|item| {
        let path = Path::new(&item.path);
        let ext = path.extension().and_then(|s| s.to_str()).unwrap_or("").to_lowercase();
        let filename = path.file_stem().and_then(|s| s.to_str()).unwrap_or("output");
        
        let out_ext = if options.output_format == "Same as source" || options.output_format.is_empty() {
            ext.clone()
        } else {
            options.output_format.to_lowercase()
        };
        
        let out_path = output_dir.join(format!("{}_cropped.{}", filename, out_ext));
        
        // Add padding if requested (simplified logic: expand crop area slightly)
        let mut crop = item.crop.clone();
        if options.padding {
            let pad_val = 10;
            crop.x = crop.x.saturating_sub(pad_val);
            crop.y = crop.y.saturating_sub(pad_val);
            crop.w += pad_val * 2;
            crop.h += pad_val * 2;
        }
        
        let crop_str = format!("{}:{}:{}:{}", crop.w, crop.h, crop.x, crop.y);
        
        if ext == "mp4" || ext == "mov" || ext == "avi" || ext == "mkv" {
            let _ = std::process::Command::new("ffmpeg")
                .args(["-y", "-i", &item.path, "-vf", &format!("crop={}", crop_str), "-c:a", "copy", out_path.to_str().unwrap_or("")])
                .output();
        } else {
            if let Ok(mut img) = image::open(&item.path) {
                // Ensure dimensions don't exceed image bounds due to padding
                let max_w = img.width().saturating_sub(crop.x);
                let max_h = img.height().saturating_sub(crop.y);
                let final_w = crop.w.min(max_w);
                let final_h = crop.h.min(max_h);
                
                let cropped = image::imageops::crop(&mut img, crop.x, crop.y, final_w, final_h).to_image();
                let _ = cropped.save(out_path);
            }
        }
        
        if options.delete_original {
            let _ = std::fs::remove_file(&item.path);
        }
        
        let completed = current_completed.fetch_add(1, std::sync::atomic::Ordering::SeqCst) + 1;
        let _ = window.emit("crop-progress", ProgressEvent {
            current: completed,
            total,
            message: format!("Processed {}", filename),
        });
    });
    
    Ok(())
}

#[tauri::command]
fn open_output_folder() -> Result<(), String> {
    let output_dir = dirs::document_dir()
        .ok_or("Could not find Documents folder")?
        .join("AutoCrop_Output");
        
    std::fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;

    #[cfg(target_os = "windows")]
    std::process::Command::new("explorer")
        .arg(&output_dir)
        .spawn()
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
