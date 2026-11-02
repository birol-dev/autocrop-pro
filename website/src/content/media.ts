/**
 * Every picture on the marketing site. All are CC0 photographs, cropped to the
 * ratios below. To swap one, drop a file in website/public/media with the same
 * aspect ratio and change its path here.
 */
export const MEDIA = {
  /** 2400x1000, the "clean frame": the hero's app window, the steps and the tolerance demo. */
  coast: { src: "/media/coast.jpg", ratio: "12 / 5", alt: "Orange limestone headland above moored boats on teal water" },
  /** The hero's landscape. Its calm sky is what the headline sits on. */
  lake: { src: "/media/lake.jpg", ratio: "4 / 3", alt: "Snow-covered mountain reflected in a still lake at dusk" },
  road: { src: "/media/road.jpg", ratio: "16 / 9", alt: "Empty desert highway under a deep blue sky" },
  fields: { src: "/media/fields.jpg", ratio: "4 / 3", alt: "Farmhouse ringed by cypress trees above misty golden hills at sunrise" },
  orchard: { src: "/media/orchard.jpg", ratio: "3 / 4", alt: "Pink apple blossom on a branch in an orchard" },
  rooftops: { src: "/media/rooftops.jpg", ratio: "3 / 4", alt: "Orange tiled rooftops of an old town seen from above" },
  harbor: { src: "/media/harbor.jpg", ratio: "3 / 4", alt: "Pale blue wooden fishing boat moored in a harbour" },
} as const;
