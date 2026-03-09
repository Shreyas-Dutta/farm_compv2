import type { SupportedLanguage } from "@/hooks/useLanguage";

import { extractStateFromLocation } from "./api";

export type CropCatalogItem = {
  value: string;
  label: Record<SupportedLanguage, string>;
  emoji: string;
  aliases: string[];
};

export type CropSuitabilitySource = "all" | "fallback";

export type CropSuitabilityResult = {
  crops: CropCatalogItem[];
  regionKey: string | null;
  source: CropSuitabilitySource;
};

export const CROP_CATALOG: CropCatalogItem[] = [
  { value: "wheat", label: { en: "Wheat", hi: "गेहूं", as: "গম" }, emoji: "🌾", aliases: ["wheat"] },
  { value: "rice", label: { en: "Rice", hi: "चावल", as: "ধান" }, emoji: "🌾", aliases: ["rice", "paddy"] },
  { value: "mustard", label: { en: "Mustard", hi: "सरसों", as: "সৰিয়হ" }, emoji: "🌻", aliases: ["mustard", "sarson", "rapeseed"] },
  { value: "cotton", label: { en: "Cotton", hi: "कपास", as: "কপাহ" }, emoji: "🌿", aliases: ["cotton"] },
  { value: "gram", label: { en: "Gram", hi: "चना", as: "বুট" }, emoji: "🫘", aliases: ["gram", "chana", "chickpea"] },
  { value: "maize", label: { en: "Maize", hi: "मक्का", as: "ভুট্টা" }, emoji: "🌽", aliases: ["maize", "corn"] },
  { value: "sugarcane", label: { en: "Sugarcane", hi: "गन्ना", as: "আখ" }, emoji: "🎋", aliases: ["sugarcane"] },
];

const FALLBACK_REGION_CROPS: Record<string, string[]> = {
  assam: ["rice", "mustard", "maize", "sugarcane"],
  bihar: ["wheat", "rice", "maize", "sugarcane"],
  delhi: ["wheat", "mustard", "gram"],
  gujarat: ["cotton", "wheat", "mustard", "groundnut", "maize"],
  haryana: ["wheat", "mustard", "cotton", "sugarcane"],
  karnataka: ["rice", "maize", "sugarcane", "cotton", "gram"],
  "madhya pradesh": ["wheat", "mustard", "gram", "maize", "cotton", "rice"],
  maharashtra: ["cotton", "sugarcane", "gram", "maize", "rice"],
  odisha: ["rice", "maize", "sugarcane", "mustard"],
  punjab: ["wheat", "rice", "cotton", "sugarcane", "maize"],
  rajasthan: ["wheat", "mustard", "gram", "cotton", "maize"],
  "tamil nadu": ["rice", "maize", "sugarcane", "cotton"],
  telangana: ["rice", "cotton", "maize", "gram", "sugarcane"],
  "uttar pradesh": ["wheat", "rice", "mustard", "gram", "maize", "sugarcane"],
  "west bengal": ["rice", "maize", "mustard", "sugarcane"],
  "north india": ["wheat", "mustard", "gram", "sugarcane"],
  "south india": ["rice", "cotton", "maize", "sugarcane"],
  "east india": ["rice", "maize", "mustard", "sugarcane"],
  "west india": ["cotton", "wheat", "mustard", "gram"],
  "central india": ["wheat", "gram", "cotton", "maize"],
  "north east india": ["rice", "mustard", "maize", "sugarcane"],
};

const suitabilityCache = new Map<string, Promise<CropSuitabilityResult>>();

const normalizeText = (value: string) => value.toLowerCase().replace(/[^a-z]+/g, " ").trim().replace(/\s+/g, " ");

export const toStateFilterValue = (value?: string | null) => {
  const normalized = normalizeText(value || "");
  return normalized ? normalized.replace(/\s+/g, "-") : null;
};

export const formatRegionLabel = (value?: string | null) => {
  const normalized = normalizeText((value || "").replace(/-/g, " "));
  if (!normalized) {
    return "";
  }

  return normalized
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getCropCatalogByValues = (values: string[]) => {
  const allowed = new Set(values.filter((value) => CROP_CATALOG.some((crop) => crop.value === value)));
  return CROP_CATALOG.filter((crop) => allowed.has(crop.value));
};

const resolveFallbackRegionKey = (location: string) => {
  const extractedState = extractStateFromLocation(location);
  const normalizedState = normalizeText(extractedState || "");
  if (normalizedState && FALLBACK_REGION_CROPS[normalizedState]) {
    return normalizedState;
  }

  const normalizedLocation = normalizeText(location);
  const matchingRegion = Object.keys(FALLBACK_REGION_CROPS).find((region) => normalizedLocation.includes(region));
  return matchingRegion || normalizedState || null;
};

const findCropValueByCommodity = (commodity: string) => {
  const normalizedCommodity = normalizeText(commodity);
  if (!normalizedCommodity) {
    return null;
  }

  const match = CROP_CATALOG.find((crop) =>
    crop.aliases.some((alias) => normalizedCommodity.includes(alias) || alias.includes(normalizedCommodity))
  );

  return match?.value ?? null;
};

export const getStateFromMarket = (market: string, explicitState?: string | null) => {
  const explicitValue = toStateFilterValue(explicitState);
  if (explicitValue) {
    return explicitValue;
  }

  return toStateFilterValue(extractStateFromLocation(market));
};

export const filterMarketPricesBySuitableCrops = <T extends { commodity: string }>(items: T[], suitableCrops: CropCatalogItem[]) => {
  if (suitableCrops.length === 0) {
    return [];
  }

  if (suitableCrops.length === CROP_CATALOG.length) {
    return items;
  }

  const allowed = new Set(suitableCrops.map((crop) => crop.value));
  return items.filter((item) => {
    const cropValue = findCropValueByCommodity(item.commodity);
    return cropValue ? allowed.has(cropValue) : false;
  });
};

const buildAllCropsResult = (regionKey: string | null = null): CropSuitabilityResult => ({
  crops: CROP_CATALOG,
  regionKey,
  source: "all",
});

export const getSuitableCropsForLocation = async (location?: string | null): Promise<CropSuitabilityResult> => {
  const trimmedLocation = location?.trim();
  if (!trimmedLocation) {
    return buildAllCropsResult();
  }

  const cacheKey = normalizeText(trimmedLocation);
  const cached = suitabilityCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const task = (async () => {
    const regionKey = resolveFallbackRegionKey(trimmedLocation);

    const fallbackValues = regionKey ? FALLBACK_REGION_CROPS[regionKey] : undefined;
    const fallbackCrops = getCropCatalogByValues(fallbackValues || []);

    if (fallbackCrops.length > 0) {
      return {
        crops: fallbackCrops,
        regionKey,
        source: "fallback" as const,
      };
    }

    return buildAllCropsResult(regionKey);
  })().catch((error) => {
    suitabilityCache.delete(cacheKey);
    throw error;
  });

  suitabilityCache.set(cacheKey, task);
  return task;
};

export const clearCropSuitabilityCache = () => {
  suitabilityCache.clear();
};