import { describe, expect, it } from "vitest";

import {
  getMicrophoneAccessErrorMessage,
  getPreferredAudioRecordingMimeType,
  getVoiceRecordingValidationError,
  MIN_VOICE_RECORDING_BYTES,
  MIN_VOICE_RECORDING_MS,
} from "@/lib/audioRecording";

describe("audio recording helpers", () => {
  it("prefers an audio-only mime type", () => {
    const mimeType = getPreferredAudioRecordingMimeType({
      isTypeSupported: (value) => value === "audio/webm;codecs=opus" || value === "video/webm",
    });

    expect(mimeType).toBe("audio/webm;codecs=opus");
  });

  it("returns an empty mime type when support cannot be detected", () => {
    expect(getPreferredAudioRecordingMimeType()).toBe("");
  });

  it("rejects recordings that are too short or too small", () => {
    expect(getVoiceRecordingValidationError(MIN_VOICE_RECORDING_MS - 1, MIN_VOICE_RECORDING_BYTES)).toBe(
      "Please hold the button and speak for a little longer.",
    );
    expect(getVoiceRecordingValidationError(MIN_VOICE_RECORDING_MS, MIN_VOICE_RECORDING_BYTES - 1)).toBe(
      "Please hold the button and speak for a little longer.",
    );
    expect(getVoiceRecordingValidationError(MIN_VOICE_RECORDING_MS, MIN_VOICE_RECORDING_BYTES)).toBeNull();
  });

  it("maps blocked microphone permissions to actionable guidance", () => {
    expect(getMicrophoneAccessErrorMessage({ name: "NotAllowedError" })).toBe(
      "Microphone access is blocked. Allow microphone permission in your browser or app settings and try again.",
    );
  });

  it("maps insecure microphone contexts to HTTPS guidance", () => {
    expect(getMicrophoneAccessErrorMessage({ name: "SecurityError" }, { isSecureContext: false })).toBe(
      "Microphone access requires HTTPS or localhost.",
    );
  });

  it("maps missing or busy microphones to specific user messages", () => {
    expect(getMicrophoneAccessErrorMessage({ name: "NotFoundError" })).toBe(
      "No microphone was found on this device.",
    );
    expect(getMicrophoneAccessErrorMessage({ name: "NotReadableError" })).toBe(
      "The microphone is unavailable right now. Close other apps using it and try again.",
    );
  });
});