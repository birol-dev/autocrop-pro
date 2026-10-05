/** The 3-step workflow, shared by the page and the HowTo JSON-LD. */
export const STEPS = [
  {
    name: "Drop your files",
    body: "Drag a folder of JPG, PNG, WEBP, MP4, MOV, MKV, or any supported format onto the app. Hundreds at once.",
    text: "Drag a folder of JPG, PNG, WEBP, MP4, MOV, MKV, or other supported formats onto the app. Process hundreds at once.",
  },
  {
    name: "Preview & tune",
    body: "Click any file to see the crop overlay. Adjust tolerance until borders snap perfectly — without touching pixel math.",
    text: "Click any file to see the crop overlay. Adjust the tolerance slider until borders snap perfectly without manual pixel math.",
  },
  {
    name: "Batch export",
    body: "Hit process. Cropped files land in Documents/AutoCrop_Output/. Originals stay untouched.",
    text: "Click process. Cropped files save to Documents/AutoCrop_Output/. Originals stay untouched unless you enable delete originals.",
  },
] as const;
