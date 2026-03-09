import { describe, expect, it } from "vitest";

import {
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
});