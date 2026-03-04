use image::GenericImageView;
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{mpsc, OnceLock};
use tauri::{Emitter, Window};

// ── Shared Types ────────────────────────────────────────────────────────────

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

// ── Helpers ─────────────────────────────────────────────────────────────────

/// Cached regex for FFmpeg cropdetect output parsing.
fn crop_regex() -> &'static regex::Regex {
    static RE: OnceLock<regex::Regex> = OnceLock::new();
    RE.get_or_init(|| regex::Regex::new(r"crop=(\d+):(\d+):(\d+):(\d+)").unwrap())
}

const VIDEO_EXTENSIONS: &[&str] = &["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"];

fn get_extension(path: &Path) -> String {
    path.extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default()
}

fn is_video(ext: &str) -> bool {
    VIDEO_EXTENSIONS.contains(&ext)
}

// ── Crop Detection ──────────────────────────────────────────────────────────

/// Detect crop boundaries for a video file using FFmpeg's cropdetect filter.
fn detect_video_crop(file_path: &str, tolerance: f32) -> Result<CropArea, String> {
    // FFmpeg cropdetect limit: 0.0 = very strict (only pure black), 1.0 = very loose
    // Our "tolerance" slider: 0 = detect nothing as border, 100 = aggressively detect borders
    // So tolerance maps directly: limit = tolerance / 100
    let limit = (tolerance / 100.0).clamp(0.0, 1.0);
    let crop_filter = format!("cropdetect=limit={:.4}:round=2:reset=1", limit);

    let output = std::process::Command::new("ffmpeg")
        .args([
            "-i", file_path,
            "-vframes", "30",
            "-vf", &crop_filter,
            "-f", "null",
            "-",
        ])
        .output()
        .map_err(|e| format!("FFmpeg not found or failed to start: {}", e))?;

    let stderr = String::from_utf8_lossy(&output.stderr);
    let re = crop_regex();

    // Collect all detected crops and pick the most common (mode) for robustness
    let mut best_crop = CropArea { w: 0, h: 0, x: 0, y: 0 };
    for cap in re.captures_iter(&stderr) {
        best_crop.w = cap[1].parse().unwrap_or(0);
        best_crop.h = cap[2].parse().unwrap_or(0);
        best_crop.x = cap[3].parse().unwrap_or(0);
        best_crop.y = cap[4].parse().unwrap_or(0);
    }

    Ok(best_crop)
}

/// Detect crop boundaries for an image using histogram-based edge detection.
fn detect_image_crop(file_path: &str, tolerance: f32) -> Result<CropArea, String> {
    let img = image::open(file_path)
        .map_err(|e| format!("Failed to open image: {}", e))?
        .to_rgb8();
    let (width, height) = img.dimensions();

    if width == 0 || height == 0 {
        return Ok(CropArea { w: width, h: height, x: 0, y: 0 });
    }

    // Tolerance: 0 = nothing is border, 100 = aggressively detect dark pixels as border
    // threshold: pixels where ALL channels <= threshold are considered "border"
    let threshold = ((tolerance / 100.0) * 255.0).clamp(0.0, 254.0) as u8;

    // Build per-row and per-column histograms of "content" pixel counts
    let mut row_counts = vec![0u32; height as usize];
    let mut col_counts = vec![0u32; width as usize];

    for (x, y, pixel) in img.enumerate_pixels() {
        // A pixel is "content" if ANY channel exceeds the threshold
        let is_content = pixel[0] > threshold || pixel[1] > threshold || pixel[2] > threshold;
        if is_content {
            row_counts[y as usize] += 1;
            col_counts[x as usize] += 1;
        }
    }

    // Noise suppression: a row/column must have at least 1% content pixels to count
    let col_noise_floor = (height as f32 * 0.01).max(1.0) as u32;
    let row_noise_floor = (width as f32 * 0.01).max(1.0) as u32;

    // Sweep inward from edges to find content boundaries
    let mut min_x: u32 = 0;
    let mut max_x: u32 = width.saturating_sub(1);
    let mut min_y: u32 = 0;
    let mut max_y: u32 = height.saturating_sub(1);

    while min_x < max_x && col_counts[min_x as usize] < col_noise_floor {
        min_x += 1;
    }
    while max_x > min_x && col_counts[max_x as usize] < col_noise_floor {
        max_x -= 1;
    }
    while min_y < max_y && row_counts[min_y as usize] < row_noise_floor {
        min_y += 1;
    }
    while max_y > min_y && row_counts[max_y as usize] < row_noise_floor {
        max_y -= 1;
    }

    // If everything was stripped, return original dimensions
    if min_x >= max_x || min_y >= max_y {
        return Ok(CropArea { w: width, h: height, x: 0, y: 0 });
    }

    Ok(CropArea {
        w: max_x - min_x + 1,
        h: max_y - min_y + 1,
        x: min_x,
        y: min_y,
    })
}

// ── Tauri Commands ──────────────────────────────────────────────────────────

#[tauri::command]
async fn detect_crop_areas(file_path: String, tolerance: f32) -> Result<CropArea, String> {
    let ext = get_extension(Path::new(&file_path));

    if is_video(&ext) {
        detect_video_crop(&file_path, tolerance)
    } else {
        detect_image_crop(&file_path, tolerance)
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
    let completed_count = AtomicUsize::new(0);
    let (error_tx, error_rx) = mpsc::channel();

    items.into_par_iter().for_each_with(error_tx, |tx, item| {
        let path = Path::new(&item.path);
        let ext = get_extension(path);
        let filename = path
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("output");

        // Resolve output extension, preventing cross-type format mismatches
        let requested_ext = if options.output_format == "Same as source" || options.output_format.is_empty() {
            ext.clone()
        } else {
            options.output_format.to_lowercase()
        };

        let safe_ext = if is_video(&ext) {
            // Video input: only allow video output formats
            if is_video(&requested_ext) { requested_ext } else { ext.clone() }
        } else {
            // Image input: only allow image output formats
            if is_video(&requested_ext) { "png".to_string() } else { requested_ext }
        };

        let out_path = output_dir.join(format!("{}_cropped.{}", filename, safe_ext));

        // Apply optional padding, clamped to prevent overflow
        let mut crop = item.crop.clone();
        if options.padding {
            let pad: u32 = 10;
            crop.x = crop.x.saturating_sub(pad);
            crop.y = crop.y.saturating_sub(pad);
            crop.w = crop.w.saturating_add(pad * 2);
            crop.h = crop.h.saturating_add(pad * 2);
        }

        let err_msg = if is_video(&ext) {
            process_single_video(&item.path, &crop, &out_path)
        } else {
            process_single_image(&item.path, &crop, &safe_ext, &out_path)
        };

        // Delete original only on success
        if err_msg.is_none() && options.delete_original {
            let _ = std::fs::remove_file(&item.path);
        }

        // Report progress to frontend
        let done = completed_count.fetch_add(1, Ordering::SeqCst) + 1;
        let message = match &err_msg {
            Some(err) => {
                let _ = tx.send(err.clone());
                format!("Error: {} — {}", filename, err)
            }
            None => format!("Processed {}", filename),
        };

        let _ = window.emit("crop-progress", ProgressEvent {
            current: done,
            total,
            message,
        });
    });

    let errors: Vec<String> = error_rx.into_iter().collect();
    if !errors.is_empty() {
        return Err(format!(
            "{}/{} files had errors:\n{}",
            errors.len(),
            total,
            errors.join("\n")
        ));
    }

    Ok(())
}

/// Process a single video file through FFmpeg crop filter.
fn process_single_video(
    input_path: &str,
    crop: &CropArea,
    out_path: &Path,
) -> Option<String> {
    let crop_str = format!("crop={}:{}:{}:{}", crop.w, crop.h, crop.x, crop.y);

    match std::process::Command::new("ffmpeg")
        .args([
            "-y", "-i", input_path,
            "-vf", &crop_str,
            "-c:a", "copy",
            out_path.to_str().unwrap_or(""),
        ])
        .output()
    {
        Ok(output) if output.status.success() => None,
        Ok(output) => {
            let _ = std::fs::remove_file(out_path);
            Some(format!("FFmpeg error: {}", String::from_utf8_lossy(&output.stderr).lines().last().unwrap_or("unknown")))
        }
        Err(e) => {
            let _ = std::fs::remove_file(out_path);
            Some(format!("FFmpeg not found: {}", e))
        }
    }
}

/// Process a single image file: crop and save with format-aware color handling.
fn process_single_image(
    input_path: &str,
    crop: &CropArea,
    target_ext: &str,
    out_path: &Path,
) -> Option<String> {
    let img = match image::open(input_path) {
        Ok(img) => img,
        Err(e) => return Some(format!("Cannot open image: {}", e)),
    };

    let (img_w, img_h) = img.dimensions();

    // Clamp crop coordinates to valid bounds
    let safe_x = crop.x.min(img_w.saturating_sub(1));
    let safe_y = crop.y.min(img_h.saturating_sub(1));
    let max_w = img_w.saturating_sub(safe_x);
    let max_h = img_h.saturating_sub(safe_y);
    let final_w = if crop.w == 0 { max_w } else { crop.w.min(max_w) };
    let final_h = if crop.h == 0 { max_h } else { crop.h.min(max_h) };

    if final_w == 0 || final_h == 0 {
        return Some(format!("Invalid crop bounds: {}x{}", final_w, final_h));
    }

    let cropped = img.crop_imm(safe_x, safe_y, final_w, final_h);

    // JPEG does not support alpha — convert to RGB8 before saving
    let save_result = if target_ext == "jpg" || target_ext == "jpeg" {
        cropped.to_rgb8().save(out_path)
    } else {
        cropped.save(out_path)
    };

    match save_result {
        Ok(_) => None,
        Err(e) => {
            let _ = std::fs::remove_file(out_path);
            Some(format!("Save failed: {}", e))
        }
    }
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

// ── App Entry ───────────────────────────────────────────────────────────────

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
