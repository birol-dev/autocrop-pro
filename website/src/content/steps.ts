/** The 3-step workflow, shared by the page and the HowTo JSON-LD. */
export const STEPS = [
  {
    name: "Drop your folder",
    body: "Photos, videos, or both.",
    text: "Drag a folder of photos and videos onto the app. Hundreds of files can go in at once.",
  },
  {
    name: "Check the crop",
    body: "The bars are found for you.",
    text: "AutoCrop Pro detects the black bars and shows the crop on each file. Adjust the tolerance slider if one looks off.",
  },
  {
    name: "Get clean files",
    body: "Your originals stay untouched.",
    text: "Click process. Cropped files save to a new folder and your originals stay untouched.",
  },
] as const;
