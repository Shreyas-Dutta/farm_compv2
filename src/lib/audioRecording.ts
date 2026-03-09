export const PREFERRED_AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

export const MIN_VOICE_RECORDING_MS = 700;
export const MIN_VOICE_RECORDING_BYTES = 1024;

type MediaRecorderSupport = {
  isTypeSupported?: (mimeType: string) => boolean;
};

export const getPreferredAudioRecordingMimeType = (mediaRecorderSupport?: MediaRecorderSupport | null) => {
  const isTypeSupported = mediaRecorderSupport?.isTypeSupported;
  if (!isTypeSupported) {
    return "";
  }

  return PREFERRED_AUDIO_MIME_TYPES.find((mimeType) => isTypeSupported(mimeType)) || "";
};

export const getVoiceRecordingValidationError = (
  durationMs: number,
  blobSize: number,
) => {
  if (durationMs < MIN_VOICE_RECORDING_MS || blobSize < MIN_VOICE_RECORDING_BYTES) {
    return "Please hold the button and speak for a little longer.";
  }

  return null;
};