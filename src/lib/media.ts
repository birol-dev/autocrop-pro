export const VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv", ".wmv"];
export const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tiff", ".tif", ".gif"];

export function classifyFile(path: string): "video" | "image" | null {
    const lower = path.toLowerCase();
    if (VIDEO_EXTENSIONS.some(ext => lower.endsWith(ext))) return "video";
    if (IMAGE_EXTENSIONS.some(ext => lower.endsWith(ext))) return "image";
    return null;
}
