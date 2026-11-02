use image::{DynamicImage, GenericImageView, ImageDecoder, ImageReader};
use rayon::prelude::*;
use serde::{Deserialize, Serialize};
use std::fs::OpenOptions;
use std::io::ErrorKind;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::{mpsc, OnceLock};
use tauri::{Emitter, Manager, Window};

// ── Shared Types ────────────────────────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq)]
pub struct CropArea {
    pub w: u32,
    pub h: u32,
    pub x: u32,
    pub y: u32,
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
    pub path: String,
    /// Why this file failed, or None if it was written.
    pub error: Option<String>,
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/// Cached regex for FFmpeg cropdetect output parsing.
fn crop_regex() -> &'static regex::Regex {
    static RE: OnceLock<regex::Regex> = OnceLock::new();
    RE.get_or_init(|| regex::Regex::new(r"crop=(\d+):(\d+):(\d+):(\d+)").unwrap())
}

const VIDEO_EXTENSIONS: &[&str] = &["mp4", "mov", "avi", "mkv", "webm", "flv", "wmv"];
const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "bmp", "tiff", "tif", "gif"];

pub fn get_extension(path: &Path) -> String {
    path.extension()
        .and_then(|s| s.to_str())
        .map(|s| s.to_lowercase())
        .unwrap_or_default()
}

pub fn is_video(ext: &str) -> bool {
    VIDEO_EXTENSIONS.contains(&ext)
}

pub fn is_image(ext: &str) -> bool {
    IMAGE_EXTENSIONS.contains(&ext)
}

pub fn round_even(val: u32) -> u32 {
    val - (val % 2)
}

/// Grows a crop by `pad` on every side; the far edge is measured from the original
/// box so clamping at x/y = 0 doesn't shift the extra pixels to the other side.
/// A zero-sized crop means "no detection, keep the whole frame" and stays that way.
pub fn apply_padding(crop: &CropArea, pad: u32) -> CropArea {
    if crop.w == 0 || crop.h == 0 {
        return crop.clone();
    }
    let x = crop.x.saturating_sub(pad);
    let y = crop.y.saturating_sub(pad);
    CropArea {
        w: crop.x + crop.w + pad - x,
        h: crop.y + crop.h + pad - y,
        x,
        y,
    }
}

/// Picks the output extension, preventing cross-type format mismatches.
pub fn resolve_output_ext(ext: &str, output_format: &str) -> String {
    let requested = if output_format == "Same as source" || output_format.is_empty() {
        ext.to_string()
    } else {
        output_format.to_lowercase()
    };

    if is_video(ext) {
        // Video input: only allow video output formats
        if is_video(&requested) { requested } else { ext.to_string() }
    } else if is_video(&requested) || requested == "gif" {
        // Only the first GIF frame is decoded, so don't pass it off as an animation.
        "png".to_string()
    } else {
        requested
    }
}

/// Claims a free output name by creating the file, so two workers can never pick the same one.
pub fn reserve_output_path(dir: &Path, stem: &str, ext: &str) -> std::io::Result<PathBuf> {
    let mut attempt = 0;
    loop {
        let name = if attempt == 0 {
            format!("{stem}_cropped.{ext}")
        } else {
            format!("{stem}_cropped ({attempt}).{ext}")
        };
        let path = dir.join(name);
        match OpenOptions::new().write(true).create_new(true).open(&path) {
            Ok(_) => return Ok(path),
            Err(e) if e.kind() == ErrorKind::AlreadyExists => attempt += 1,
            Err(e) => return Err(e),
        }
    }
}

/// Media files in `paths`, walking into folders. Everything else is left out.
pub fn collect_media_files(paths: &[String]) -> Vec<String> {
    fn visit(path: &Path, found: &mut Vec<String>) {
        // symlink_metadata: a linked folder is not followed, so a link loop can't recurse forever.
        let Ok(meta) = std::fs::symlink_metadata(path) else { return };
        if meta.is_dir() {
            let Ok(entries) = std::fs::read_dir(path) else { return };
            let mut children: Vec<PathBuf> = entries.flatten().map(|e| e.path()).collect();
            children.sort();
            for child in children {
                visit(&child, found);
            }
        } else {
            let ext = get_extension(path);
            if is_video(&ext) || is_image(&ext) {
                found.push(path.to_string_lossy().into_owned());
            }
        }
    }

    let mut found = Vec::new();
    for path in paths {
        visit(Path::new(path), &mut found);
    }
    found
}

/// FFmpeg with no console window: the release build is a GUI app, so Windows would flash one per call.
fn ffmpeg_command() -> std::process::Command {
    let mut cmd = std::process::Command::new("ffmpeg");
    cmd.args(["-hide_banner", "-nostdin"]);
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        cmd.creation_flags(CREATE_NO_WINDOW);
    }
    cmd
}

/// Decodes an image upright: applies EXIF orientation and trusts the file's contents over its extension.
fn load_image(path: &str) -> Result<DynamicImage, String> {
    let mut decoder = ImageReader::open(path)
        .map_err(|e| e.to_string())?
        .with_guessed_format()
        .map_err(|e| e.to_string())?
        .into_decoder()
        .map_err(|e| e.to_string())?;
    let orientation = decoder.orientation().map_err(|e| e.to_string())?;
    let mut img = DynamicImage::from_decoder(decoder).map_err(|e| e.to_string())?;
    img.apply_orientation(orientation);
    Ok(img)
}

/// Converts to a pixel layout the target encoder accepts.
fn encodable(img: DynamicImage, target_ext: &str) -> DynamicImage {
    match target_ext {
        // The only encoders here that take more than 8 bits per channel.
        "png" | "tif" | "tiff" => img,
        // JPEG does not support alpha
        "jpg" | "jpeg" => DynamicImage::ImageRgb8(img.to_rgb8()),
        _ if img.color().has_alpha() => DynamicImage::ImageRgba8(img.to_rgba8()),
        _ => DynamicImage::ImageRgb8(img.to_rgb8()),
    }
}

// ── Crop Detection ──────────────────────────────────────────────────────────

/// Smallest box holding the picture of every sampled frame, so a dark scene can't cut into a
/// brighter one. Black frames report negative sizes, which the regex skips on purpose.
pub fn crop_from_cropdetect(stderr: &str) -> Option<CropArea> {
    let mut bounds: Option<(u32, u32, u32, u32)> = None;
    for cap in crop_regex().captures_iter(stderr) {
        let w: u32 = cap[1].parse().unwrap_or(0);
        let h: u32 = cap[2].parse().unwrap_or(0);
        let x: u32 = cap[3].parse().unwrap_or(0);
        let y: u32 = cap[4].parse().unwrap_or(0);
        if w == 0 || h == 0 {
            continue;
        }
        let (left, top, right, bottom) = bounds.unwrap_or((x, y, x + w, y + h));
        bounds = Some((left.min(x), top.min(y), right.max(x + w), bottom.max(y + h)));
    }
    bounds.map(|(left, top, right, bottom)| CropArea {
        w: right - left,
        h: bottom - top,
        x: left,
        y: top,
    })
}

/// Detect crop boundaries for a video file using FFmpeg's cropdetect filter.
pub fn detect_video_crop(file_path: &str, tolerance: f32) -> Result<CropArea, String> {
    // FFmpeg cropdetect limit: 0.0 = very strict (only pure black), 1.0 = very loose
    // Our "tolerance" slider: 0 = detect nothing as border, 100 = aggressively detect borders
    // So tolerance maps directly: limit = tolerance / 100
    let limit = (tolerance / 100.0).clamp(0.0, 1.0);
    // Two samples a second over the first 20 seconds: consecutive frames would all land
    // inside a black or fading intro and find nothing.
    let crop_filter = format!("fps=2,cropdetect=limit={:.4}:round=2:reset=1:skip=0", limit);

    let output = ffmpeg_command()
        .args([
            "-i", file_path,
            "-frames:v", "40",
            "-vf", &crop_filter,
            "-an", "-sn",
            "-f", "null",
            "-",
        ])
        .output()
        .map_err(|e| format!("FFmpeg not found or failed to start: {}", e))?;

    let stderr = String::from_utf8_lossy(&output.stderr);

    match crop_from_cropdetect(&stderr) {
        Some(crop) => Ok(crop),
        None if output.status.success() => Ok(CropArea { w: 0, h: 0, x: 0, y: 0 }),
        None => Err(format!("FFmpeg error: {}", stderr.lines().last().unwrap_or("unknown"))),
    }
}

/// Detect crop boundaries for an image using histogram-based edge detection.
pub fn detect_image_crop(file_path: &str, tolerance: f32) -> Result<CropArea, String> {

    let img = load_image(file_path)
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
    tauri::async_runtime::spawn_blocking(move || {
        let ext = get_extension(Path::new(&file_path));
        if is_video(&ext) {
            detect_video_crop(&file_path, tolerance)
        } else {
            detect_image_crop(&file_path, tolerance)
        }
    })
    .await
    .map_err(|e| format!("Detection task failed: {e}"))?
}

#[tauri::command]
async fn process_files(
    app: tauri::AppHandle,
    window: Window,
    items: Vec<ProcessItem>,
    options: ProcessOptions,
) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || process_files_inner(app, window, items, options))
        .await
        .map_err(|e| format!("Processing task failed: {e}"))?
}

#[tauri::command]
async fn expand_paths(paths: Vec<String>) -> Result<Vec<String>, String> {
    tauri::async_runtime::spawn_blocking(move || collect_media_files(&paths))
        .await
        .map_err(|e| format!("Folder scan failed: {e}"))
}

fn process_files_inner(
    app: tauri::AppHandle,
    window: Window,
    items: Vec<ProcessItem>,
    options: ProcessOptions,
) -> Result<(), String> {
    let output_dir = get_output_dir(&app);
    std::fs::create_dir_all(&output_dir).map_err(|e| e.to_string())?;

    let total = items.len();
    let completed_count = AtomicUsize::new(0);
    let (error_tx, error_rx) = mpsc::channel();

    items.into_par_iter().for_each_with(error_tx, |tx, item| {
        let filename = Path::new(&item.path)
            .file_stem()
            .and_then(|s| s.to_str())
            .unwrap_or("output");

        let result = process_item(&item, &options, &output_dir);

        // Report progress to frontend
        let done = completed_count.fetch_add(1, Ordering::SeqCst) + 1;
        let message = match &result {
            Err(err) => {
                let _ = tx.send(format!("{}: {}", filename, err));
                format!("Error: {} — {}", filename, err)
            }
            Ok(_) => format!("Processed {}", filename),
        };

        let _ = window.emit("crop-progress", ProgressEvent {
            current: done,
            total,
            message,
            path: item.path.clone(),
            error: result.err(),
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

/// Crops one file into `output_dir` and returns the path it wrote.
/// The source is only deleted once a non-empty output exists.
pub fn process_item(
    item: &ProcessItem,
    options: &ProcessOptions,
    output_dir: &Path,
) -> Result<PathBuf, String> {
    let path = Path::new(&item.path);
    let ext = get_extension(path);
    let stem = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("output");
    let out_ext = resolve_output_ext(&ext, &options.output_format);
    let out_path = reserve_output_path(output_dir, stem, &out_ext)
        .map_err(|e| format!("Cannot create output file: {}", e))?;

    // Frame clamps happen in process_single_*
    let crop = if options.padding {
        apply_padding(&item.crop, 10)
    } else {
        item.crop.clone()
    };

    let err_msg = if is_video(&ext) {
        process_single_video(&item.path, &crop, &out_path)
    } else {
        process_single_image(&item.path, &crop, &out_ext, &out_path)
    };

    let failure = err_msg.or_else(|| match std::fs::metadata(&out_path) {
        Ok(meta) if meta.len() > 0 => None,
        _ => Some("Output file is empty".to_string()),
    });
    if let Some(err) = failure {
        let _ = std::fs::remove_file(&out_path);
        return Err(err);
    }

    if options.delete_original {
        let _ = std::fs::remove_file(path);
    }
    Ok(out_path)
}

/// Process a single video file through FFmpeg crop filter.
fn process_single_video(
    input_path: &str,
    crop: &CropArea,
    out_path: &Path,
) -> Option<String> {
    let mut cmd = ffmpeg_command();
    cmd.arg("-y").arg("-i").arg(input_path);

    let crop_str;
    if crop.w > 0 && crop.h > 0 {
        // Even x/y/w/h for YUV420 codecs; skip tiny/degenerate crops.
        let x = round_even(crop.x);
        let y = round_even(crop.y);
        let w = round_even(crop.w);
        let h = round_even(crop.h);
        if w >= 2 && h >= 2 {
            // Clamp against input frame so padding cannot request out-of-bounds crops.
            // Commas inside expressions must be escaped for the filtergraph parser.
            crop_str = format!(
                "crop=max(2\\,min({w}\\,iw-min({x}\\,iw-2))):max(2\\,min({h}\\,ih-min({y}\\,ih-2))):min({x}\\,iw-2):min({y}\\,ih-2)"
            );
            cmd.args(["-vf", &crop_str]);
        }
    }

    cmd.args(["-c:a", "copy"]).arg(out_path);

    match cmd.output() {
        Ok(output) if output.status.success() => None,
        Ok(output) => Some(format!("FFmpeg error: {}", String::from_utf8_lossy(&output.stderr).lines().last().unwrap_or("unknown"))),
        Err(e) => Some(format!("FFmpeg not found: {}", e)),
    }
}

/// Process a single image file with cropping and format conversion.
pub fn process_single_image(
    input_path: &str,
    crop: &CropArea,
    target_ext: &str,
    out_path: &Path,
) -> Option<String> {

    let img = match load_image(input_path) {
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

    match encodable(cropped, target_ext).save(out_path) {
        Ok(_) => None,
        Err(e) => Some(format!("Save failed: {}", e)),
    }
}

// ── Config / Save Location ──────────────────────────────────────────────────

fn config_file_path(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map(|p| p.join("config.json"))
        .map_err(|e| e.to_string())
}

fn get_output_dir(app: &tauri::AppHandle) -> PathBuf {
    if let Ok(cfg_path) = config_file_path(app) {
        if cfg_path.exists() {
            if let Ok(raw) = std::fs::read_to_string(&cfg_path) {
                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&raw) {
                    if let Some(s) = val["save_location"].as_str() {
                        let p = PathBuf::from(s);
                        if !s.is_empty() {
                            return p;
                        }
                    }
                }
            }
        }
    }
    dirs::document_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("AutoCrop_Output")
}

#[tauri::command]
fn get_save_location(app: tauri::AppHandle) -> String {
    get_output_dir(&app).to_string_lossy().to_string()
}

#[tauri::command]
fn set_save_location(app: tauri::AppHandle, path: String) -> Result<(), String> {
    let cfg = config_file_path(&app)?;
    if let Some(parent) = cfg.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let json = serde_json::json!({ "save_location": path });
    std::fs::write(&cfg, json.to_string()).map_err(|e| e.to_string())
}

/// Opens the file explorer with the given file selected (Windows: `explorer /select,<path>`).
#[tauri::command]
fn reveal_in_explorer(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        // xdg-open doesn't support /select, so open the parent directory
        if let Some(parent) = Path::new(&path).parent() {
            std::process::Command::new("xdg-open")
                .arg(parent)
                .spawn()
                .map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}

// ── Output File Listing ─────────────────────────────────────────────────────

#[derive(Serialize, Clone, Debug)]
pub struct OutputFile {
    pub name: String,
    pub path: String,
    pub file_type: String,
    pub modified_at: u64, // Unix timestamp seconds, for newest-first sorting
}

#[tauri::command]
fn list_output_files(app: tauri::AppHandle) -> Result<Vec<OutputFile>, String> {
    let output_dir = get_output_dir(&app);

    if !output_dir.exists() {
        return Ok(vec![]);
    }

    let mut files = Vec::new();
    let entries = std::fs::read_dir(&output_dir).map_err(|e| e.to_string())?;

    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }

        let ext = get_extension(&path);
        let file_type = if is_video(&ext) {
            "video".to_string()
        } else if is_image(&ext) {
            "image".to_string()
        } else {
            continue;
        };

        let name = path
            .file_name()
            .and_then(|n| n.to_str())
            .unwrap_or("unknown")
            .to_string();

        // Read modification time for newest-first sorting
        let modified_at = path
            .metadata()
            .ok()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);

        files.push(OutputFile {
            name,
            path: path.to_string_lossy().to_string(),
            file_type,
            modified_at,
        });
    }

    // Sort newest first
    files.sort_by(|a, b| b.modified_at.cmp(&a.modified_at));
    Ok(files)
}

#[tauri::command]
fn open_output_folder(app: tauri::AppHandle) -> Result<(), String> {
    let output_dir = get_output_dir(&app);
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
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            detect_crop_areas,
            process_files,
            expand_paths,
            open_output_folder,
            list_output_files,
            get_save_location,
            set_save_location,
            reveal_in_explorer
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

#[cfg(test)]
mod tests;
