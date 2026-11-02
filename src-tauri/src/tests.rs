//! Runs the real crop code against real files. Video tests need FFmpeg on PATH and skip without it.

use super::*;
use image::{ImageBuffer, Rgb, Rgba};
use std::process::Command;

static NEXT_DIR: AtomicUsize = AtomicUsize::new(0);

/// A fresh folder for one test, removed again on drop.
struct TempDir(PathBuf);

impl TempDir {
    fn new() -> Self {
        let id = NEXT_DIR.fetch_add(1, Ordering::SeqCst);
        let dir = std::env::temp_dir().join(format!("autocrop test {} {}", std::process::id(), id));
        std::fs::create_dir_all(&dir).unwrap();
        TempDir(dir)
    }

    fn path(&self, name: &str) -> PathBuf {
        let path = self.0.join(name);
        std::fs::create_dir_all(path.parent().unwrap()).unwrap();
        path
    }

    fn string(&self, name: &str) -> String {
        self.path(name).to_string_lossy().into_owned()
    }
}

impl Drop for TempDir {
    fn drop(&mut self) {
        let _ = std::fs::remove_dir_all(&self.0);
    }
}

fn options(output_format: &str, padding: bool, delete_original: bool) -> ProcessOptions {
    ProcessOptions {
        tolerance: 20,
        output_format: output_format.to_string(),
        padding,
        delete_original,
    }
}

/// 200×100 frame, white between y = 20 and y = 80, black above and below.
fn letterboxed() -> ImageBuffer<Rgb<u8>, Vec<u8>> {
    ImageBuffer::from_fn(200, 100, |_, y| {
        if (20..80).contains(&y) { Rgb([255, 255, 255]) } else { Rgb([0, 0, 0]) }
    })
}

const LETTERBOX_CROP: CropArea = CropArea { w: 200, h: 60, x: 0, y: 20 };

fn has_ffmpeg() -> bool {
    let found = Command::new("ffmpeg").arg("-version").output().is_ok();
    if !found {
        eprintln!("skipping: FFmpeg is not on PATH");
    }
    found
}

/// A video with a two second black intro, then 640×270 of picture in a 640×360 frame.
fn black_intro_video(path: &Path) {
    let status = Command::new("ffmpeg")
        .args(["-hide_banner", "-loglevel", "error", "-y"])
        .args(["-f", "lavfi", "-i", "color=black:s=640x360:d=2:r=30"])
        .args(["-f", "lavfi", "-i", "testsrc2=s=640x270:d=3:r=30"])
        .args(["-filter_complex", "[1:v]pad=640:360:0:45:black[v1];[0:v][v1]concat=n=2:v=1[o]"])
        .args(["-map", "[o]", "-c:v", "libx264", "-pix_fmt", "yuv420p"])
        .arg(path)
        .status()
        .unwrap();
    assert!(status.success());
}

fn video_size(path: &Path) -> (u32, u32) {
    let output = Command::new("ffmpeg").arg("-hide_banner").arg("-i").arg(path).output().unwrap();
    let stderr = String::from_utf8_lossy(&output.stderr).into_owned();
    let re = regex::Regex::new(r"Video:.*?\b(\d{2,})x(\d{2,})\b").unwrap();
    let cap = re.captures(&stderr).unwrap_or_else(|| panic!("no video stream in: {stderr}"));
    (cap[1].parse().unwrap(), cap[2].parse().unwrap())
}

// ── Padding ─────────────────────────────────────────────────────────────────

#[test]
fn padding_grows_every_side() {
    let crop = CropArea { w: 60, h: 60, x: 20, y: 20 };
    assert_eq!(apply_padding(&crop, 10), CropArea { w: 80, h: 80, x: 10, y: 10 });
}

#[test]
fn padding_near_the_edge_stays_symmetric() {
    let crop = CropArea { w: 40, h: 40, x: 5, y: 3 };
    assert_eq!(apply_padding(&crop, 10), CropArea { w: 55, h: 53, x: 0, y: 0 });
}

#[test]
fn padding_leaves_a_failed_detection_alone() {
    let none = CropArea { w: 0, h: 0, x: 0, y: 0 };
    assert_eq!(apply_padding(&none, 10), none);
}

#[test]
fn padded_failed_detection_exports_the_whole_image() {
    let dir = TempDir::new();
    letterboxed().save(dir.path("a.png")).unwrap();
    let item = ProcessItem { path: dir.string("a.png"), crop: CropArea { w: 0, h: 0, x: 0, y: 0 } };
    let out = process_item(&item, &options("png", true, false), &dir.0).unwrap();
    assert_eq!(image::open(out).unwrap().dimensions(), (200, 100));
}

// ── Output names ────────────────────────────────────────────────────────────

#[test]
fn output_format_rules() {
    assert_eq!(resolve_output_ext("png", "Same as source"), "png");
    assert_eq!(resolve_output_ext("png", "webp"), "webp");
    assert_eq!(resolve_output_ext("mp4", "png"), "mp4");
    assert_eq!(resolve_output_ext("png", "mp4"), "png");
    assert_eq!(resolve_output_ext("gif", "Same as source"), "png");
    assert_eq!(resolve_output_ext("gif", "jpg"), "jpg");
}

#[test]
fn parallel_workers_never_share_an_output_name() {
    let dir = TempDir::new();
    let paths: Vec<PathBuf> = (0..32)
        .into_par_iter()
        .map(|_| reserve_output_path(&dir.0, "same", "png").unwrap())
        .collect();
    let unique: std::collections::HashSet<_> = paths.iter().collect();
    assert_eq!(unique.len(), 32);
}

#[test]
fn same_named_files_from_two_folders_both_survive_delete_original() {
    let dir = TempDir::new();
    letterboxed().save(dir.path("one/photo.png")).unwrap();
    let tall: ImageBuffer<Rgb<u8>, Vec<u8>> = ImageBuffer::from_pixel(50, 80, Rgb([255, 255, 255]));
    tall.save(dir.path("two/photo.png")).unwrap();

    let opts = options("Same as source", false, true);
    let out_dir = dir.path("out");
    std::fs::create_dir_all(&out_dir).unwrap();
    let items = [
        ProcessItem { path: dir.string("one/photo.png"), crop: CropArea { w: 0, h: 0, x: 0, y: 0 } },
        ProcessItem { path: dir.string("two/photo.png"), crop: CropArea { w: 0, h: 0, x: 0, y: 0 } },
    ];
    let mut sizes: Vec<(u32, u32)> = items
        .par_iter()
        .map(|item| image::open(process_item(item, &opts, &out_dir).unwrap()).unwrap().dimensions())
        .collect();
    sizes.sort();
    assert_eq!(sizes, vec![(50, 80), (200, 100)]);
}

#[test]
fn failure_keeps_the_original_and_leaves_no_output() {
    let dir = TempDir::new();
    let source = dir.path("broken.png");
    std::fs::write(&source, b"not an image").unwrap();
    let out_dir = dir.path("out");
    std::fs::create_dir_all(&out_dir).unwrap();

    let item = ProcessItem { path: source.to_string_lossy().into_owned(), crop: LETTERBOX_CROP };
    assert!(process_item(&item, &options("Same as source", false, true), &out_dir).is_err());

    assert!(source.exists());
    assert_eq!(std::fs::read_dir(&out_dir).unwrap().count(), 0);
}

// ── Folders ─────────────────────────────────────────────────────────────────

#[test]
fn folders_expand_to_the_media_inside() {
    let dir = TempDir::new();
    for name in ["top.png", "notes.txt", "deep/er/clip.MP4", "deep/still.jpg", "deep/.DS_Store"] {
        std::fs::write(dir.path(name), b"x").unwrap();
    }

    let found = collect_media_files(&[dir.0.to_string_lossy().into_owned()]);
    let names: Vec<_> = found
        .iter()
        .map(|p| Path::new(p).file_name().unwrap().to_str().unwrap())
        .collect();
    assert_eq!(names, vec!["clip.MP4", "still.jpg", "top.png"]);
}

#[test]
fn plain_files_pass_through_and_missing_paths_are_ignored() {
    let dir = TempDir::new();
    std::fs::write(dir.path("a.webp"), b"x").unwrap();
    let found = collect_media_files(&[dir.string("a.webp"), dir.string("gone.png"), dir.string("b.txt")]);
    assert_eq!(found, vec![dir.string("a.webp")]);
}

// ── Images ──────────────────────────────────────────────────────────────────

#[test]
fn detects_letterbox_bars() {
    let dir = TempDir::new();
    letterboxed().save(dir.path("a.png")).unwrap();
    assert_eq!(detect_image_crop(&dir.string("a.png"), 20.0).unwrap(), LETTERBOX_CROP);
}

#[test]
fn crops_to_the_detected_box_in_every_output_format() {
    let dir = TempDir::new();
    letterboxed().save(dir.path("a.png")).unwrap();
    for format in ["png", "jpg", "webp", "bmp", "tiff"] {
        let item = ProcessItem { path: dir.string("a.png"), crop: LETTERBOX_CROP };
        let out = process_item(&item, &options(format, false, false), &dir.0).unwrap();
        assert_eq!(get_extension(&out), format);
        assert_eq!(image::open(out).unwrap().dimensions(), (200, 60), "{format}");
    }
}

#[test]
fn sixteen_bit_images_save_to_eight_bit_formats() {
    let dir = TempDir::new();
    let deep: ImageBuffer<Rgba<u16>, Vec<u16>> = ImageBuffer::from_pixel(32, 32, Rgba([65535, 0, 0, 65535]));
    deep.save(dir.path("deep.png")).unwrap();
    for format in ["webp", "jpg", "png"] {
        let item = ProcessItem { path: dir.string("deep.png"), crop: CropArea { w: 16, h: 16, x: 0, y: 0 } };
        let out = process_item(&item, &options(format, false, false), &dir.0).unwrap();
        assert_eq!(image::open(out).unwrap().dimensions(), (16, 16), "{format}");
    }
}

#[test]
fn a_misnamed_file_still_decodes() {
    let dir = TempDir::new();
    letterboxed().save_with_format(dir.path("actually-png.jpg"), image::ImageFormat::Png).unwrap();
    assert_eq!(detect_image_crop(&dir.string("actually-png.jpg"), 20.0).unwrap(), LETTERBOX_CROP);
}

#[test]
fn exif_rotated_photos_come_out_upright() {
    let dir = TempDir::new();
    let mut jpeg = Vec::new();
    letterboxed()
        .write_to(&mut std::io::Cursor::new(&mut jpeg), image::ImageFormat::Jpeg)
        .unwrap();

    // APP1 segment holding one tag: Orientation = 6 (rotate 90° clockwise).
    let tiff: &[u8] = &[
        b'I', b'I', 42, 0, 8, 0, 0, 0, // header
        1, 0, // one entry
        0x12, 0x01, 3, 0, 1, 0, 0, 0, 6, 0, 0, 0, // tag 0x0112, SHORT, count 1, value 6
        0, 0, 0, 0, // no next IFD
    ];
    let mut app1 = b"Exif\0\0".to_vec();
    app1.extend_from_slice(tiff);
    let len = (app1.len() + 2) as u16;
    let mut tagged = vec![jpeg[0], jpeg[1], 0xFF, 0xE1];
    tagged.extend_from_slice(&len.to_be_bytes());
    tagged.extend_from_slice(&app1);
    tagged.extend_from_slice(&jpeg[2..]);
    std::fs::write(dir.path("phone.jpg"), tagged).unwrap();

    // The bars were above and below; once upright they sit left and right.
    let crop = detect_image_crop(&dir.string("phone.jpg"), 20.0).unwrap();
    assert!((58..=62).contains(&crop.w) && crop.h == 200, "{crop:?}");

    let (w, h) = (crop.w, crop.h);
    let item = ProcessItem { path: dir.string("phone.jpg"), crop };
    let out = process_item(&item, &options("png", false, false), &dir.0).unwrap();
    assert_eq!(image::open(out).unwrap().dimensions(), (w, h));
}

// ── Video ───────────────────────────────────────────────────────────────────

#[test]
fn cropdetect_ignores_black_frames_and_keeps_the_widest_picture() {
    let stderr = "\
        [Parsed_cropdetect_1] crop=-638:-358:640:360\n\
        [Parsed_cropdetect_1] crop=640:270:0:44\n\
        [Parsed_cropdetect_1] crop=600:200:20:80\n\
        [Parsed_cropdetect_1] crop=-638:-358:640:360\n";
    assert_eq!(crop_from_cropdetect(stderr), Some(CropArea { w: 640, h: 270, x: 0, y: 44 }));
    assert_eq!(crop_from_cropdetect("crop=-638:-358:640:360"), None);
}

#[test]
fn black_intro_does_not_hide_the_bars() {
    if !has_ffmpeg() {
        return;
    }
    let dir = TempDir::new();
    let source = dir.path("with intro.mp4");
    black_intro_video(&source);

    let crop = detect_video_crop(&source.to_string_lossy(), 20.0).unwrap();
    assert_eq!((crop.w, crop.x), (640, 0));
    assert!((268..=272).contains(&crop.h), "height {}", crop.h);
    assert!((44..=46).contains(&crop.y), "y {}", crop.y);

    let item = ProcessItem { path: source.to_string_lossy().into_owned(), crop };
    let out = process_item(&item, &options("Same as source", false, false), &dir.0).unwrap();
    let (w, h) = video_size(&out);
    assert_eq!(w, 640);
    assert!((268..=272).contains(&h), "height {h}");
}

#[test]
fn padded_video_crop_stays_inside_the_frame() {
    if !has_ffmpeg() {
        return;
    }
    let dir = TempDir::new();
    let source = dir.path("clip.mp4");
    black_intro_video(&source);

    let item = ProcessItem {
        path: source.to_string_lossy().into_owned(),
        crop: CropArea { w: 640, h: 270, x: 0, y: 44 },
    };
    let out = process_item(&item, &options("Same as source", true, false), &dir.0).unwrap();
    assert_eq!(video_size(&out), (640, 290));
}

#[test]
fn unreadable_video_is_an_error_not_a_silent_full_frame() {
    if !has_ffmpeg() {
        return;
    }
    let dir = TempDir::new();
    std::fs::write(dir.path("fake.mp4"), b"not a video").unwrap();
    assert!(detect_video_crop(&dir.string("fake.mp4"), 20.0).is_err());
}
