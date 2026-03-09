import type { CropDiseaseDetectionResult } from "./api";

import { getRecommendations } from "./api";

export type LocalPlantHealthTopPrediction = {
  label: string;
  cropName?: string;
  disease?: string;
  diseaseHi?: string;
  status: "healthy" | "diseased";
  confidence: number;
};

export type LocalPlantHealthPrediction = {
  status: "healthy" | "diseased" | "unknown";
  confidence: number;
  healthyProbability: number;
  diseasedProbability: number;
  label?: string;
  cropName?: string;
  disease?: string;
  diseaseHi?: string;
  topPredictions?: LocalPlantHealthTopPrediction[];
};

export type ResolvedScanHealthAssessment = {
  healthStatus: "healthy" | "diseased" | "stressed" | "unknown";
  confidence: number;
  description: string;
  treatment?: string;
  disease?: string;
  diseaseHi?: string;
  persistable: boolean;
  source: "local_model" | "detection_fallback";
};

const UNCONFIRMED_DISEASE_VALUES = new Set([
  "",
  "unknown",
  "condition not confirmed",
  "अज्ञात",
  "स्थिति की पुष्टि नहीं हुई",
  "অজ্ঞাত",
  "অৱস্থা নিশ্চিত নহ'ল",
]);

const HEALTHY_DISEASE_VALUES = new Set([
  "healthy",
  "स्वस्थ",
  "সুস্থ",
]);

const GENERIC_PLANT_VALUES = new Set([
  "",
  "plant",
  "unknown",
  "plant not identified",
  "पौधा",
  "अज्ञात",
  "अज्ञात पौधा",
  "পৌধা",
  "অজ্ঞাত উদ্ভিদ",
]);

const clampConfidence = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
};

const hasConfirmedDiseaseLabel = (value?: string) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized.length > 0
    && !UNCONFIRMED_DISEASE_VALUES.has(normalized)
    && !HEALTHY_DISEASE_VALUES.has(normalized);
};

const hasHealthyDiseaseLabel = (value?: string) => {
  return HEALTHY_DISEASE_VALUES.has(String(value || "").trim().toLowerCase());
};

const isUnconfirmedDiseaseLabel = (value?: string) => {
  return UNCONFIRMED_DISEASE_VALUES.has(String(value || "").trim().toLowerCase());
};

const getPlantLabel = (plantName?: string) => {
  const normalized = String(plantName || "").trim();
  return normalized || "this crop";
};

export const normalizeCropName = (value?: string) => {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[,_/()-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized || GENERIC_PLANT_VALUES.has(normalized) || normalized.includes("not identified")) {
    return "";
  }

  if (normalized.includes("corn") || normalized.includes("maize")) return "maize";
  if (normalized.includes("pepper") || normalized.includes("capsicum")) return "bell pepper";
  if (normalized.startsWith("cherry")) return "cherry";
  if (normalized.includes("orange") || normalized.includes("citrus")) return "orange";
  return normalized;
};

export const doCropNamesMatch = (expected?: string, identified?: string) => {
  const normalizedExpected = normalizeCropName(expected);
  const normalizedIdentified = normalizeCropName(identified);

  return !normalizedExpected || !normalizedIdentified || normalizedExpected === normalizedIdentified;
};

export const isSupportedLocalPlantHealthCrop = (plantName: string | undefined, supportedCropNames: string[]) => {
  const normalizedPlantName = normalizeCropName(plantName);
  if (!normalizedPlantName) {
    return false;
  }

  const supportedCrops = new Set(
    (Array.isArray(supportedCropNames) ? supportedCropNames : [])
      .map((cropName) => normalizeCropName(cropName))
      .filter((cropName): cropName is string => Boolean(cropName))
  );

  return supportedCrops.has(normalizedPlantName);
};

const normalizeDiseaseName = (value?: string) => {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
};

const doesLocalPredictionMatchPlant = (
  localPrediction: LocalPlantHealthPrediction | null,
  plantName?: string,
  detectionPlantName?: string
) => {
  const expectedCrop = normalizeCropName(plantName) ? plantName : detectionPlantName;
  return doCropNamesMatch(expectedCrop, localPrediction?.cropName);
};

const getPrimaryTreatment = (recommendations?: string[]) => {
  return Array.isArray(recommendations)
    ? recommendations.find((item) => String(item || "").trim())
    : undefined;
};

const getLocalDiseaseTreatment = (
  localPrediction: LocalPlantHealthPrediction,
  detection: CropDiseaseDetectionResult,
  plantLabel: string
) => {
  const primaryTreatment = getPrimaryTreatment(detection.recommendations);
  const matchesDetectionDisease = normalizeDiseaseName(localPrediction.disease) !== ""
    && normalizeDiseaseName(localPrediction.disease) === normalizeDiseaseName(detection.disease);

  if (matchesDetectionDisease && primaryTreatment) {
    return primaryTreatment;
  }

  const recommendation = localPrediction.disease
    ? getRecommendations(localPrediction.disease).find((item) => String(item || "").trim())
    : undefined;

  if (recommendation && recommendation !== "Consult with a local agriculture expert") {
    return recommendation;
  }

  if (localPrediction.disease) {
    return `Inspect affected leaves closely on ${plantLabel}, remove badly damaged tissue if possible, and follow a crop-specific management plan for ${localPrediction.disease}.`;
  }

  return "Inspect affected leaves closely, isolate badly infected plants if possible, and capture a clearer close-up photo for more specific advice.";
};

export const mapDetectionSeverityToHealthStatus = (
  severity?: string
): ResolvedScanHealthAssessment["healthStatus"] => {
  if (severity === "low") return "healthy";
  if (severity === "high") return "diseased";
  if (severity === "medium") return "stressed";
  return "unknown";
};

export const resolveScanHealthAssessment = ({
  detection,
  localPrediction,
  plantName,
}: {
  detection: CropDiseaseDetectionResult;
  localPrediction: LocalPlantHealthPrediction | null;
  plantName?: string;
}): ResolvedScanHealthAssessment => {
  const plantLabel = getPlantLabel(plantName || detection.plantName);
  const confirmedDisease = hasConfirmedDiseaseLabel(detection.disease);
  const healthyDetectionLabel = hasHealthyDiseaseLabel(detection.disease);
  const detectionHealthStatus = mapDetectionSeverityToHealthStatus(detection.severity);
  const unconfirmedDetection = isUnconfirmedDiseaseLabel(detection.disease) || detectionHealthStatus === "unknown";
  const primaryTreatment = getPrimaryTreatment(detection.recommendations);
  const localPredictionMatchesPlant = doesLocalPredictionMatchPlant(localPrediction, plantName, detection.plantName);

  if (localPrediction && localPrediction.status === "diseased" && localPrediction.disease && localPredictionMatchesPlant) {
    return {
      healthStatus: "diseased",
      confidence: clampConfidence(localPrediction.confidence),
      description: `The local disease-identification model found ${localPrediction.disease} in this photo of ${plantLabel}. Treat this crop as diseased and begin the recommended care steps.`,
      treatment: getLocalDiseaseTreatment(localPrediction, detection, plantLabel),
      disease: localPrediction.disease,
      diseaseHi: localPrediction.diseaseHi || localPrediction.disease,
      persistable: true,
      source: "local_model",
    };
  }

  if (localPrediction && localPrediction.status === "healthy" && localPredictionMatchesPlant) {
    return {
      healthStatus: "healthy",
      confidence: clampConfidence(localPrediction.confidence),
      description: confirmedDisease
        ? `The local disease-identification model did not confirm a supported disease class in this photo of ${plantLabel}. Treat this crop as healthy for now, and retake a close-up leaf photo if symptoms continue.`
        : `The local disease-identification model did not find a supported disease class in this photo of ${plantLabel}. Treat this crop as healthy and continue routine monitoring.`,
      persistable: true,
      source: "local_model",
    };
  }

  if (confirmedDisease) {
    return {
      healthStatus: "diseased",
      confidence: clampConfidence(detection.confidence),
      description: `The identification flow suggests ${detection.disease} in this photo of ${plantLabel}. Treat this crop as diseased and begin the recommended care steps.`,
      treatment: primaryTreatment || "Inspect affected leaves closely, isolate badly infected plants if possible, and capture a clearer close-up photo for more specific advice.",
      disease: detection.disease,
      diseaseHi: detection.diseaseHi,
      persistable: true,
      source: "detection_fallback",
    };
  }

  return {
    healthStatus: "healthy",
    confidence: clampConfidence(detection.confidence),
    description: healthyDetectionLabel || detectionHealthStatus === "healthy"
      ? `No disease was identified in this photo of ${plantLabel}. Treat this crop as healthy and continue routine monitoring.`
      : `No disease was identified in this photo of ${plantLabel}. Show Health Status as healthy for now, and retake a close-up photo if you still suspect a problem.`,
    persistable: !unconfirmedDetection,
    source: "detection_fallback",
  };
};