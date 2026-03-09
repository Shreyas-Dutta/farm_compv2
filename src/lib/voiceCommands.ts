import { addCrop, deleteCrop, getUserCrops } from "@/lib/database";
import { CROP_CATALOG } from "@/lib/cropSuitability";

export const VOICE_COMMAND_CROPS_UPDATED_EVENT = "farm-companion:crops-updated";

export type VoiceCommand =
  | { type: "navigate"; route: string; label: string }
  | { type: "add-crop"; cropName: string }
  | { type: "delete-crop"; cropName: string };

type VoiceExecutorDeps = {
  userId: string;
  navigate: (path: string) => void;
  now?: Date;
  addCropFn?: typeof addCrop;
  getUserCropsFn?: typeof getUserCrops;
  deleteCropFn?: typeof deleteCrop;
  onCropsChanged?: () => void;
};

type TranscribeOptions = {
  apiKey?: string;
  fetchFn?: typeof fetch;
  maxPollAttempts?: number;
  pollIntervalMs?: number;
};

const ASSEMBLYAI_API_BASE = "https://api.assemblyai.com/v2";
const ASSEMBLYAI_SPEECH_MODELS = ["universal-3-pro", "universal-2"];

const normalizeText = (value: string) => value.toLocaleLowerCase().replace(/[.,!?/\\_-]+/g, " ").replace(/\s+/g, " ").trim();

const getTodayDate = (value: Date) => value.toISOString().slice(0, 10);

const getStatusByProgress = (progress: number) => progress >= 100
  ? { status: "ready", statusEn: "Grown", statusHi: "तैयार", statusAs: "প্ৰস্তুত" }
  : { status: "growing", statusEn: "Growing", statusHi: "बढ़ रहा है", statusAs: "বাঢ়ি আছে" };

const findCatalogCrop = (value: string) => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return undefined;
  }

  return CROP_CATALOG.find((crop) => {
    const values = [crop.value.replace(/-/g, " "), ...crop.aliases, ...Object.values(crop.label)];
    return values.some((candidate) => normalizeText(candidate) === normalized);
  });
};

const findBestCropMatch = (crops: any[], requestedName: string) => {
  const normalizedRequested = normalizeText(requestedName);
  const exactMatches = crops.filter((crop) => {
    const candidates = [crop?.name, crop?.nameEn, crop?.nameAs, crop?.type].filter(Boolean);
    return candidates.some((candidate) => normalizeText(String(candidate)) === normalizedRequested);
  });

  if (exactMatches.length === 1) {
    return exactMatches[0];
  }

  if (exactMatches.length > 1) {
    throw new Error(`I found multiple crops named ${requestedName}. Please be more specific.`);
  }

  const partialMatches = crops.filter((crop) => {
    const candidates = [crop?.name, crop?.nameEn, crop?.nameAs, crop?.type].filter(Boolean);
    return candidates.some((candidate) => normalizeText(String(candidate)).includes(normalizedRequested));
  });

  if (partialMatches.length === 1) {
    return partialMatches[0];
  }

  if (partialMatches.length > 1) {
    throw new Error(`I found multiple crops similar to ${requestedName}. Please say the full crop name.`);
  }

  throw new Error(`I couldn't find a crop named ${requestedName}.`);
};

const NAVIGATION_COMMANDS = [
  { route: "/", label: "home", phrases: ["home", "dashboard"] },
  { route: "/scan", label: "scan", phrases: ["scan", "scanner", "camera"] },
  { route: "/profile", label: "profile", phrases: ["profile", "my profile", "my crops"] },
  { route: "/market", label: "market", phrases: ["market", "mandi", "prices", "market prices"] },
  { route: "/weather", label: "weather", phrases: ["weather", "forecast"] },
  { route: "/news", label: "news", phrases: ["news", "headlines", "farming news"] },
  { route: "/add-crop", label: "add crop", phrases: ["add crop page", "crop form", "new crop page"] },
];

export const getAssemblyAiApiKey = () => import.meta.env.VITE_ASSEMBLYAI_API_KEY?.trim() || "";

export const parseVoiceCommand = (transcript: string): VoiceCommand | null => {
  const normalized = normalizeText(transcript);
  if (!normalized) {
    return null;
  }

  const addMatch = normalized.match(/^(?:please )?(?:add|create|save) (?:a |new )?crop(?: called)? (.+)$/);
  if (addMatch?.[1]) {
    return { type: "add-crop", cropName: addMatch[1].trim() };
  }

  const deleteMatch = normalized.match(/^(?:please )?(?:delete|remove) (?:the )?crop(?: called)? (.+)$/);
  if (deleteMatch?.[1]) {
    return { type: "delete-crop", cropName: deleteMatch[1].trim() };
  }

  const openPrefix = /^(?:open|show|go to|take me to|navigate to) /;
  const pageTarget = normalized.replace(openPrefix, "").trim();
  const pageCommand = NAVIGATION_COMMANDS.find((entry) => entry.phrases.some((phrase) => pageTarget === phrase || pageTarget === `${phrase} page`));
  if (pageCommand) {
    return { type: "navigate", route: pageCommand.route, label: pageCommand.label };
  }

  return null;
};

export const executeVoiceCommand = async (command: VoiceCommand, deps: VoiceExecutorDeps) => {
  const addCropImpl = deps.addCropFn ?? addCrop;
  const getUserCropsImpl = deps.getUserCropsFn ?? getUserCrops;
  const deleteCropImpl = deps.deleteCropFn ?? deleteCrop;

  if (command.type === "navigate") {
    deps.navigate(command.route);
    return { message: `Opening ${command.label}.` };
  }

  if (command.type === "add-crop") {
    const now = deps.now ?? new Date();
    const matchedCrop = findCatalogCrop(command.cropName);
    const status = getStatusByProgress(10);
    const typedName = command.cropName.trim();

    await addCropImpl(deps.userId, {
      name: matchedCrop?.label.hi || typedName,
      nameEn: matchedCrop?.label.en || typedName,
      nameAs: matchedCrop?.label.as || typedName,
      type: matchedCrop?.value || typedName,
      emoji: matchedCrop?.emoji || "🌱",
      health: "healthy",
      progress: 10,
      plantedDate: getTodayDate(now),
      notes: "",
      createdAt: now,
      updatedAt: now,
      ...status,
    });

    deps.onCropsChanged?.();
    deps.navigate("/profile");
    return { message: `Added ${matchedCrop?.label.en || typedName}.` };
  }

  const crops = await getUserCropsImpl(deps.userId);
  const crop = findBestCropMatch(crops || [], command.cropName);
  const cropId = String(crop?.id || "");
  if (!cropId) {
    throw new Error(`I couldn't delete ${command.cropName} because it has no id.`);
  }

  await deleteCropImpl(deps.userId, cropId);
  deps.onCropsChanged?.();
  deps.navigate("/profile");
  return { message: `Deleted ${crop?.nameEn || crop?.name || command.cropName}.` };
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getAssemblyAiErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const payload = await response.json() as { error?: string; message?: string };
    const detail = payload.error?.trim() || payload.message?.trim() || JSON.stringify(payload);
    return `${fallbackMessage} (${response.status}): ${detail}`;
  } catch {
    try {
      const detail = (await response.text()).trim();
      if (detail) {
        return `${fallbackMessage} (${response.status}): ${detail}`;
      }
    } catch {
      // Ignore parsing errors and use the generic fallback below.
    }
  }

  return `${fallbackMessage} (${response.status}).`;
};

export const transcribeAudioWithAssemblyAI = async (audioBlob: Blob, options: TranscribeOptions = {}) => {
  const apiKey = options.apiKey ?? getAssemblyAiApiKey();
  if (!apiKey) {
    throw new Error("AssemblyAI is not configured.");
  }

  if (!audioBlob.size) {
    throw new Error("No audio was recorded.");
  }

  const fetchFn = options.fetchFn ?? fetch;
  const maxPollAttempts = options.maxPollAttempts ?? 15;
  const pollIntervalMs = options.pollIntervalMs ?? 1000;
  const authHeaders = { Authorization: apiKey };

  const uploadResponse = await fetchFn(`${ASSEMBLYAI_API_BASE}/upload`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "application/octet-stream",
    },
    body: audioBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error(await getAssemblyAiErrorMessage(uploadResponse, "AssemblyAI upload failed"));
  }

  const uploadData = await uploadResponse.json() as { upload_url?: string };
  if (!uploadData.upload_url) {
    throw new Error("AssemblyAI did not return an upload URL.");
  }

  const transcriptResponse = await fetchFn(`${ASSEMBLYAI_API_BASE}/transcript`, {
    method: "POST",
    headers: {
      ...authHeaders,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      audio_url: uploadData.upload_url,
      speech_models: ASSEMBLYAI_SPEECH_MODELS,
      language_detection: true,
    }),
  });

  if (!transcriptResponse.ok) {
    throw new Error(await getAssemblyAiErrorMessage(transcriptResponse, "AssemblyAI transcript request failed"));
  }

  let transcriptData = await transcriptResponse.json() as { id?: string; status?: string; text?: string; error?: string };
  if (transcriptData.status === "completed") {
    return transcriptData.text?.trim() || "";
  }

  if (transcriptData.status === "error") {
    throw new Error(transcriptData.error || "AssemblyAI could not transcribe the audio.");
  }

  if (!transcriptData.id) {
    throw new Error("AssemblyAI did not return a transcript id.");
  }

  for (let attempt = 0; attempt < maxPollAttempts; attempt += 1) {
    await delay(pollIntervalMs);
    const pollResponse = await fetchFn(`${ASSEMBLYAI_API_BASE}/transcript/${transcriptData.id}`, {
      headers: authHeaders,
    });

    if (!pollResponse.ok) {
      throw new Error(await getAssemblyAiErrorMessage(pollResponse, "AssemblyAI polling failed"));
    }

    transcriptData = await pollResponse.json() as { status?: string; text?: string; error?: string };
    if (transcriptData.status === "completed") {
      return transcriptData.text?.trim() || "";
    }

    if (transcriptData.status === "error") {
      throw new Error(transcriptData.error || "AssemblyAI could not transcribe the audio.");
    }
  }

  throw new Error("Voice command timed out while waiting for transcription.");
};