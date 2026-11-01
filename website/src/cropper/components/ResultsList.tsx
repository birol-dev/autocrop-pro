import { DownloadSimpleIcon, FilmStripIcon, ImageSquareIcon } from "@phosphor-icons/react";

import { Pill } from "../../components/Section";
import { displayedCrop } from "../useCropper";
import type { Item, Options } from "../types";
import { formatBytes } from "../utils";
import classes from "./ResultsList.module.css";

type Props = {
  items: Item[];
  options: Options;
  onDownload: (id: string) => void;
  onDownloadAll: () => void;
  onGoToQueue: () => void;
};

export default function ResultsList({ items, options, onDownload, onDownloadAll, onGoToQueue }: Props) {
  const ready = items.filter((f) => f.resultBlob && f.resultName);

  if (!ready.length) {
    return (
      <div className={classes.empty}>
        {/* A small stack of cropped frames: what this tab fills up with. */}
        <svg className={classes.picture} viewBox="0 0 120 84" aria-hidden="true">
          <rect x="24" y="4" width="72" height="30" rx="6" className={classes.frameBack} />
          <rect x="12" y="20" width="96" height="40" rx="7" className={classes.frameMid} />
          <rect x="0" y="40" width="120" height="44" rx="8" className={classes.frameFront} />
        </svg>
        <h2 className={classes.emptyTitle}>No cropped files yet</h2>
        <p className={classes.emptyBody}>Process the files in your queue and they will be here, ready to download.</p>
        <Pill onClick={onGoToQueue}>Go to queue</Pill>
      </div>
    );
  }

  return (
    <div className={classes.list}>
      <div className={classes.head}>
        <p className={classes.hint}>Processed files stay in this tab until you download them.</p>
        <Pill onClick={onDownloadAll} icon={<DownloadSimpleIcon size={16} />}>
          {ready.length === 1 ? "Download" : `Download all (${ready.length}) as zip`}
        </Pill>
      </div>

      <ul className={classes.rows}>
        {ready.map((f) => {
          const Icon = f.type === "video" ? FilmStripIcon : ImageSquareIcon;
          const crop = displayedCrop(f, options) ?? f.crop;
          const dims = crop ? `${crop.w} × ${crop.h}` : null;
          return (
            <li key={f.id} className={classes.row}>
              <Icon size={18} className={classes.icon} aria-hidden="true" />
              <div className={classes.file}>
                <p className={classes.name} title={f.resultName ?? undefined}>
                  {f.resultName}
                </p>
                <p className={classes.meta}>
                  {dims ? `${dims} · ` : ""}
                  {formatBytes((f.resultBlob as Blob).size)}
                </p>
              </div>
              <Pill variant="soft" onClick={() => onDownload(f.id)} aria-label={`Download ${f.resultName}`}>
                Download
              </Pill>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
