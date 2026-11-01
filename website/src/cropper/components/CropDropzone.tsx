import { Dropzone } from "@mantine/dropzone";

import { Pill } from "../../components/Section";
import classes from "./CropDropzone.module.css";

type Props = {
  /** Once the queue has files the zone collapses into a slim "add more" bar. */
  compact: boolean;
  disabled: boolean;
  loadingSamples: boolean;
  onFiles: (files: File[]) => void;
  onSample: () => void;
};

const FORMATS = "PNG · JPG · WebP · BMP · TIFF · GIF · MP4 · MOV · MKV · AVI · WebM";

export default function CropDropzone({ compact, disabled, loadingSamples, onFiles, onSample }: Props) {
  return (
    <>
      <Dropzone
        onDrop={onFiles}
        disabled={disabled}
        className={classes.root}
        data-compact={compact || undefined}
        aria-label="Add media files"
      >
        {compact ? (
          <div className={classes.compact}>
            <div className={classes.compactText}>
              <p className={classes.compactTitle}>
                <Dropzone.Accept>Release to add files</Dropzone.Accept>
                <Dropzone.Idle>Drop more files here</Dropzone.Idle>
              </p>
              <p className={classes.compactHint}>or click to browse your computer</p>
            </div>
            <span className={classes.pill}>Add files</span>
          </div>
        ) : (
          <div className={classes.empty}>
            <p className={classes.dropTitle}>
              <Dropzone.Accept>Release to add files</Dropzone.Accept>
              <Dropzone.Idle>Drop your media here</Dropzone.Idle>
            </p>
            <p className={classes.dropText}>
              Add images or videos and AutoCrop Pro will find and trim the black borders — right in this tab.
            </p>
            <span className={classes.pill}>Browse files</span>
            <p className={classes.formats}>{FORMATS}</p>
          </div>
        )}
      </Dropzone>

      {!compact && (
        <div className={classes.sampleRow}>
          <span className={classes.sampleText}>No files handy?</span>
          <Pill
            variant="soft"
            onClick={onSample}
            disabled={disabled || loadingSamples}
            aria-busy={loadingSamples || undefined}
          >
            {loadingSamples ? "Loading samples…" : "Try sample images"}
          </Pill>
        </div>
      )}

      <Dropzone.FullScreen onDrop={onFiles} disabled={disabled}>
        <div className={classes.full}>
          <p className={classes.fullTitle}>Drop to add files</p>
          <p className={classes.fullText}>Images and videos stay on your device.</p>
        </div>
      </Dropzone.FullScreen>
    </>
  );
}
