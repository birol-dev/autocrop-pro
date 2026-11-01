import { useRef, useState } from "react";
import { Loader, LoadingOverlay, Modal } from "@mantine/core";
import { CheckCircleIcon, ImageSquareIcon, WarningCircleIcon } from "@phosphor-icons/react";

import { displayedCrop } from "../useCropper";
import type { Item, Options } from "../types";
import classes from "./PreviewModal.module.css";

type Props = {
  item: Item | null;
  options: Options;
  onClose: () => void;
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className={classes.stat}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

const pct = (v: number, total: number) => `${(v / total) * 100}%`;

/** Media stage + stats. Rendered with `key={item.id}` so its failure state resets per file. */
function PreviewBody({ item, options }: { item: Item; options: Options }) {
  const [failed, setFailed] = useState(false);
  const crop = displayedCrop(item, options);
  const src = item.thumbnailUrl ?? item.previewUrl;
  const showVideo = item.type === "video" && !item.thumbnailUrl;
  const detecting = item.status === "detecting";
  const known = item.naturalW > 0 && item.naturalH > 0;
  const trimmed =
    crop && known ? Math.max(0, Math.round((1 - (crop.w * crop.h) / (item.naturalW * item.naturalH)) * 100)) : null;

  return (
    <>
      <div className={classes.viewport}>
        {!failed ? (
          <div className={classes.stage}>
            {showVideo ? (
              <video
                className={classes.media}
                src={src}
                autoPlay
                muted
                loop
                playsInline
                onError={() => setFailed(true)}
              />
            ) : (
              <img className={classes.media} src={src} alt={item.name} onError={() => setFailed(true)} />
            )}

            {crop && known && (
              <div
                className={classes.crop}
                data-testid="crop-overlay"
                style={{
                  left: pct(crop.x, item.naturalW),
                  top: pct(crop.y, item.naturalH),
                  width: pct(crop.w, item.naturalW),
                  height: pct(crop.h, item.naturalH),
                }}
              >
                {(["tl", "tr", "bl", "br"] as const).map((pos) => (
                  <span key={pos} className={classes.handle} data-pos={pos} />
                ))}
                <span className={classes.tag}>
                  {crop.w} × {crop.h}
                </span>
              </div>
            )}

            <LoadingOverlay
              visible={detecting}
              zIndex={5}
              overlayProps={{ backgroundOpacity: 0.55, blur: 3, color: "#0b0b12" }}
              loaderProps={{
                children: (
                  <div className={classes.loading}>
                    <Loader color="white" size="sm" />
                    <p className={classes.loadingText}>Detecting crop area…</p>
                  </div>
                ),
              }}
            />
          </div>
        ) : (
          <div className={classes.failed}>
            <ImageSquareIcon size={40} weight="regular" aria-hidden="true" />
            <p>Preview unavailable in this browser</p>
          </div>
        )}
      </div>

      <div className={classes.footer}>
        <dl className={classes.stats}>
          <Stat label="Original" value={known ? `${item.naturalW} × ${item.naturalH}` : "—"} />
          <Stat label="Cropped" value={crop ? `${crop.w} × ${crop.h}` : "—"} />
          <Stat label="Offset" value={crop ? `${crop.x}, ${crop.y}` : "—"} />
          <Stat label="Trimmed" value={trimmed !== null ? `${trimmed}%` : "—"} />
        </dl>
        <p className={classes.esc}>
          <kbd className={classes.kbd}>Esc</kbd> to close
        </p>
      </div>
    </>
  );
}

export default function PreviewModal({ item, options, onClose }: Props) {
  // Keep the last item around so the content doesn't vanish during the close animation.
  const last = useRef<Item | null>(null);
  if (item) last.current = item;
  const shown = item ?? last.current;

  const crop = shown ? displayedCrop(shown, options) : null;

  const status =
    shown?.status === "detecting" ? (
      <span className={classes.status}>
        <span className={classes.spinner} aria-hidden="true" />
        Detecting crop…
      </span>
    ) : crop ? (
      <span className={classes.status}>
        <CheckCircleIcon size={12} weight="bold" aria-hidden="true" />
        Crop detected
      </span>
    ) : shown?.error ? (
      <span className={classes.status} data-error>
        <WarningCircleIcon size={12} weight="bold" aria-hidden="true" />
        Detection failed
      </span>
    ) : (
      <span className={classes.status}>No crop detected</span>
    );

  return (
    <Modal
      opened={!!item}
      onClose={onClose}
      size="min(1040px, 94vw)"
      padding={0}
      overlayProps={{ backgroundOpacity: 0.55, blur: 4 }}
      transitionProps={{ transition: "pop", duration: 150 }}
      classNames={{
        content: classes.content,
        header: classes.header,
        title: classes.title,
        body: classes.body,
      }}
      title={
        <div className={classes.titleRow}>
          <p className={classes.fileName} title={shown?.name}>
            {shown?.name}
          </p>
          {status}
        </div>
      }
    >
      {shown && <PreviewBody key={shown.id} item={shown} options={options} />}
    </Modal>
  );
}
