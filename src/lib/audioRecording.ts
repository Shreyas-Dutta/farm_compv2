export const PREFERRED_AUDIO_MIME_TYPES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/ogg;codecs=opus",
  "audio/ogg",
  "audio/mp4",
];

export const MIN_VOICE_RECORDING_MS = 700;
export const MIN_VOICE_RECORDING_BYTES = 1024;

type MicrophoneAccessErrorContext = {
  isSecureContext?: boolean;
};

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

export const getMicrophoneAccessErrorMessage = (
  error: unknown,
  context: MicrophoneAccessErrorContext = {},
) => {
  const errorName = typeof error === "object" && error !== null && "name" in error
    ? String((error as { name?: string }).name || "").toLowerCase()
    : "";
  const errorMessage = typeof error === "object" && error !== null && "message" in error
    ? String((error as { message?: string }).message || "").toLowerCase()
    : "";
  const isSecureContext = context.isSecureContext ?? (typeof window === "undefined" ? true : window.isSecureContext);

  if (
    errorName === "notallowederror"
    || errorName === "permissiondeniederror"
    || errorMessage.includes("permission denied")
    || errorMessage.includes("permission dismissed")
  ) {
    return "Microphone access is blocked. Allow microphone permission in your browser or app settings and try again.";
  }

  if (
    errorName === "notfounderror"
    || errorName === "devicesnotfounderror"
    || errorMessage.includes("requested device not found")
  ) {
    return "No microphone was found on this device.";
  }

  if (
    errorName === "notreadableerror"
    || errorName === "trackstarterror"
    || errorMessage.includes("could not start audio source")
    || errorMessage.includes("device in use")
  ) {
    return "The microphone is unavailable right now. Close other apps using it and try again.";
  }

  if (errorName === "aborterror") {
    return "Microphone setup was interrupted. Please try again.";
  }

  if (
    !isSecureContext
    || errorName === "securityerror"
    || errorMessage.includes("secure context")
    || errorMessage.includes("https")
  ) {
    return "Microphone access requires HTTPS or localhost.";
  }

  return "Unable to start microphone recording. Please try again.";
};