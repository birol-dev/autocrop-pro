import { useRef } from "react";
import { Title } from "@mantine/core";
import { Dropzone } from "@mantine/dropzone";
import { PlusIcon } from "@phosphor-icons/react";

import { Fade, Pill } from "../../components/Section";
import classes from "./CropDropzone.module.css";

type Props = {
  /** The slim "add more" target in the queue's header, instead of the whole empty window. */
  compact?: boolean;
  disabled: boolean;
  loadingSamples?: boolean;
  onFiles: (files: File[]) => void;
  onSample?: () => void;
  onFolder?: () => void;
};

/** A hidden folder input and the function that opens it. Dropped folders work without this. */
export function useFolderPicker(onFiles: (files: File[]) => void) {
  const ref = useRef<HTMLInputElement>(null);
  const input = (
    <input
      ref={ref}
      type="file"
      multiple
      hidden
      tabIndex={-1}
      aria-hidden="true"
      {...{ webkitdirectory: "" }}
      onChange={(e) => {
        onFiles(Array.from(e.currentTarget.files ?? []));
        e.currentTarget.value = "";
      }}
    />
  );
  return { input, open: () => ref.current?.click() };
}

export default function CropDropzone({ compact, disabled, loadingSamples, onFiles, onSample, onFolder }: Props) {
  return (
    <>
      {compact ? (
        <Dropzone onDrop={onFiles} disabled={disabled} className={classes.compact} aria-label="Add files">
          <span className={classes.compactInner}>
            <PlusIcon size={14} aria-hidden="true" />
            <Dropzone.Accept>Let go</Dropzone.Accept>
            <Dropzone.Reject>Add files</Dropzone.Reject>
            <Dropzone.Idle>Add files</Dropzone.Idle>
          </span>
        </Dropzone>
      ) : (
        <div className={classes.empty}>
          <Dropzone onDrop={onFiles} disabled={disabled} className={classes.root} aria-label="Add files">
            <div className={classes.zone}>
              <Title order={2} className={classes.title}>
                <Dropzone.Accept>Let go.</Dropzone.Accept>
                <Dropzone.Reject>Drop your files here.</Dropzone.Reject>
                <Dropzone.Idle>
                  Drop your files here. <Fade>Or a whole folder.</Fade>
                </Dropzone.Idle>
              </Title>
              <span className={classes.pill}>Choose files</span>
            </div>
          </Dropzone>

          <div className={classes.alternatives}>
            <Pill variant="soft" onClick={onFolder} disabled={disabled}>
              Choose a folder
            </Pill>
            <Pill
              variant="soft"
              onClick={onSample}
              disabled={disabled || loadingSamples}
              aria-busy={loadingSamples || undefined}
            >
              {loadingSamples ? "Loading samples…" : "Try sample images"}
            </Pill>
          </div>

          <p className={classes.formats}>PNG, JPG, WebP, BMP, GIF, MP4, MOV, WebM.</p>
        </div>
      )}

      {/* The whole page takes drops, not just the target. */}
      <Dropzone.FullScreen onDrop={onFiles} disabled={disabled} classNames={{ fullScreen: classes.fullScreen }}>
        <div className={classes.full}>
          <p className={classes.fullTitle}>Drop to add</p>
        </div>
      </Dropzone.FullScreen>
    </>
  );
}
