import { XIcon } from "@phosphor-icons/react";
import MediaThumb from "@app/components/MediaThumb";

import { Pill } from "../../components/Section";
import type { Item } from "../types";
import { formatBytes } from "../utils";
import StatusBadge from "./StatusBadge";
import classes from "./QueueGrid.module.css";

type Props = {
  items: Item[];
  disabled: boolean;
  onPreview: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

function summarize(items: Item[]): string {
  const videos = items.filter((f) => f.type === "video").length;
  const images = items.length - videos;
  const parts: string[] = [];
  if (images) parts.push(`${images} ${images === 1 ? "image" : "images"}`);
  if (videos) parts.push(`${videos} ${videos === 1 ? "video" : "videos"}`);
  return `${parts.join(" · ")} ready to process`;
}

export default function QueueGrid({ items, disabled, onPreview, onRemove, onClear }: Props) {
  return (
    <div className={classes.wrap}>
      <div className={classes.head}>
        <p className={classes.summary}>{summarize(items)}</p>
        <Pill variant="plain" onClick={onClear} disabled={disabled}>
          Clear all
        </Pill>
      </div>

      <ul className={classes.grid}>
        {items.map((f) => {
          const ext = f.name.split(".").pop()?.toUpperCase();
          const thumbSrc = f.thumbnailUrl ?? f.previewUrl;
          return (
            <li key={f.id} className={classes.item}>
              <article
                className={classes.card}
                role="button"
                tabIndex={0}
                aria-label={`Preview ${f.name}`}
                onClick={() => onPreview(f.id)}
                onKeyDown={(e) => {
                  if (e.target !== e.currentTarget) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onPreview(f.id);
                  }
                }}
              >
                <div className={classes.thumb}>
                  <MediaThumb src={thumbSrc} type={f.thumbnailUrl ? "image" : f.type} name={f.name} lazy>
                    <div className={classes.status}>
                      <StatusBadge status={f.status} />
                    </div>
                    <button
                      type="button"
                      className={classes.remove}
                      disabled={disabled}
                      aria-label={`Remove ${f.name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemove(f.id);
                      }}
                    >
                      <XIcon size={14} weight="bold" />
                    </button>
                  </MediaThumb>
                </div>

                <div className={classes.meta}>
                  <p className={classes.name} title={f.name}>
                    {f.name}
                  </p>
                  <p className={classes.details}>
                    {f.type === "video" ? "Video" : "Image"}
                    {ext ? ` · ${ext}` : ""} · {formatBytes(f.file.size)}
                  </p>
                  {f.error && (
                    <p className={classes.error} role="alert">
                      {f.error}
                    </p>
                  )}
                  {(f.risky || f.oversized) && !f.error && (
                    <p className={classes.warn}>
                      {f.risky && (
                        <span title="This format may not decode in the browser. The Windows app handles it.">
                          May need Windows app
                        </span>
                      )}
                      {f.risky && f.oversized && " · "}
                      {f.oversized && <span>Over 80 MB</span>}
                    </p>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
