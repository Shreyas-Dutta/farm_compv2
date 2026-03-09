import { afterEach, describe, expect, it, vi } from "vitest";

import {
  executeVoiceCommand,
  parseVoiceCommand,
  transcribeAudioWithAssemblyAI,
} from "@/lib/voiceCommands";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("voice command helpers", () => {
  it("parses navigation commands", () => {
    expect(parseVoiceCommand("open market page")).toEqual({
      type: "navigate",
      route: "/market",
      label: "market",
    });
  });

  it("parses add and delete crop commands", () => {
    expect(parseVoiceCommand("add crop rice")).toEqual({ type: "add-crop", cropName: "rice" });
    expect(parseVoiceCommand("delete crop rice")).toEqual({ type: "delete-crop", cropName: "rice" });
  });

  it("adds a crop with catalog defaults and redirects to profile", async () => {
    const addCropFn = vi.fn().mockResolvedValue("crop-1");
    const navigate = vi.fn();
    const onCropsChanged = vi.fn();

    const result = await executeVoiceCommand(
      { type: "add-crop", cropName: "rice" },
      {
        userId: "test-user",
        navigate,
        addCropFn,
        onCropsChanged,
        now: new Date("2026-03-08T10:00:00.000Z"),
      },
    );

    expect(addCropFn).toHaveBeenCalledWith(
      "test-user",
      expect.objectContaining({
        nameEn: "Rice",
        type: "rice",
        emoji: "🌾",
        plantedDate: "2026-03-08",
        health: "healthy",
        progress: 10,
        status: "growing",
      }),
    );
    expect(navigate).toHaveBeenCalledWith("/profile");
    expect(onCropsChanged).toHaveBeenCalled();
    expect(result.message).toBe("Added Rice.");
  });

  it("deletes a matched crop and redirects to profile", async () => {
    const getUserCropsFn = vi.fn().mockResolvedValue([
      { id: "crop-1", nameEn: "Rice", type: "rice" },
    ]);
    const deleteCropFn = vi.fn().mockResolvedValue(true);
    const navigate = vi.fn();

    const result = await executeVoiceCommand(
      { type: "delete-crop", cropName: "rice" },
      {
        userId: "test-user",
        navigate,
        getUserCropsFn,
        deleteCropFn,
      },
    );

    expect(deleteCropFn).toHaveBeenCalledWith("test-user", "crop-1");
    expect(navigate).toHaveBeenCalledWith("/profile");
    expect(result.message).toBe("Deleted Rice.");
  });

  it("uploads audio and submits a transcript request to AssemblyAI", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: "https://cdn.assemblyai.test/audio.webm" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "transcript-1", status: "completed", text: "open market" }),
      });

    const transcript = await transcribeAudioWithAssemblyAI(new Blob(["audio"]), {
      apiKey: "assembly-test-key",
      fetchFn: fetchFn as unknown as typeof fetch,
    });

    expect(transcript).toBe("open market");
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn.mock.calls[0][0]).toBe("https://api.assemblyai.com/v2/upload");
    expect(fetchFn.mock.calls[1][0]).toBe("https://api.assemblyai.com/v2/transcript");
    expect(JSON.parse(String(fetchFn.mock.calls[1][1]?.body))).toEqual({
      audio_url: "https://cdn.assemblyai.test/audio.webm",
      speech_models: ["universal-3-pro", "universal-2"],
      language_detection: true,
    });
  });

  it("surfaces AssemblyAI transcript error details", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ upload_url: "https://cdn.assemblyai.test/audio.webm" }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ error: "speech_models is required" }),
      });

    await expect(
      transcribeAudioWithAssemblyAI(new Blob(["audio"]), {
        apiKey: "assembly-test-key",
        fetchFn: fetchFn as unknown as typeof fetch,
      }),
    ).rejects.toThrow("AssemblyAI transcript request failed (400): speech_models is required");
  });
});