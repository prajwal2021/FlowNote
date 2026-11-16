const FRAME_MIME = 'image/webp';
const FRAME_QUALITY = 0.7;
const MAX_FRAME_WIDTH = 1280;

export interface GrabbedFrame {
  blob: Blob;
  width: number;
  height: number;
  mimeType: string;
}

export async function grabFrame(video: HTMLVideoElement): Promise<GrabbedFrame | null> {
  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  if (sourceWidth === 0 || sourceHeight === 0) return null;

  const scale = Math.min(1, MAX_FRAME_WIDTH / sourceWidth);
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.drawImage(video, 0, 0, width, height);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((result) => resolve(result), FRAME_MIME, FRAME_QUALITY),
  );
  return blob ? { blob, width, height, mimeType: FRAME_MIME } : null;
}
