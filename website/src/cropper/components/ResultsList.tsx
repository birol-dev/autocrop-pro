import { Title } from "@mantine/core";
import { DownloadSimpleIcon, FilmStripIcon, ImageSquareIcon } from "@phosphor-icons/react";

import { Fade, Pill } from "../../components/Section";
import type { Item } from "../types";
import { formatBytes } from "../utils";
import classes from "./ResultsList.module.css";

type Props = {
  items: Item[];
  onDownload: (id: string) => void;
  onDownloadAll: () => void;
  onGoToQueue: () => void;
};

export default function ResultsList({ items, onDownload, onDownloadAll, onGoToQueue }: Props) {
  const ready = items.filter((f) => f.resultBlob && f.resultName);

  if (!ready.length) {
    return (
      <div className={classes.empty}>
        <Title order={2} className={classes.emptyTitle}>
          Nothing yet. <Fade>Cropped files land here.</Fade>
        </Title>
        <Pill onClick={onGoToQueue}>Go to the queue</Pill>
      </div>
    );
  }

  return (
    <div className={classes.list}>
      <div className={classes.head}>
        <p className={classes.hint}>Yours until you close this tab.</p>
        <Pill onClick={onDownloadAll} icon={<DownloadSimpleIcon size={16} />}>
          {ready.length === 1 ? "Download" : `Download all ${ready.length} as a zip`}
        </Pill>
      </div>

      <ul className={classes.rows}>
        {ready.map((f) => {
          const Icon = f.type === "video" ? FilmStripIcon : ImageSquareIcon;
          return (
            <li key={f.id} className={classes.row}>
              <Icon size={18} className={classes.icon} aria-hidden="true" />
              <div className={classes.file}>
                <p className={classes.name} title={f.resultName ?? undefined}>
                  {f.resultName}
                </p>
                <p className={classes.meta}>
                  {f.resultDims ? `${f.resultDims} · ` : ""}
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
