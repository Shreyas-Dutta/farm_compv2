import * as tf from "@tensorflow/tfjs";

import type { LocalPlantHealthPrediction, LocalPlantHealthTopPrediction } from "./scanHealth";

type LocalPlantHealthClassMetadata = {
  label: string;
  cropName?: string;
  disease?: string;
  diseaseHi?: string;
  status?: "healthy" | "diseased";
};

type LocalPlantHealthMetadata = {
  imageSize?: number;
  healthyThreshold?: number;
  diseasedThreshold?: number;
  minConfidenceMargin?: number;
  labels?: string[];
  classes?: LocalPlantHealthClassMetadata[];
};

const MODEL_URL = "/models/plant-health/model.json";
const METADATA_URL = "/models/plant-health/metadata.json";

let modelPromise: Promise<tf.LayersModel | null> | null = null;
let metadataPromise: Promise<LocalPlantHealthMetadata | null> | null = null;

const CROP_NAME_MAP: Record<string, string> = {
  "Apple": "Apple",
  "Blueberry": "Blueberry",
  "Cherry_(including_sour)": "Cherry",
  "Corn_(maize)": "Maize",
  "Grape": "Grape",
  "Orange": "Orange",
  "Peach": "Peach",
  "Pepper,_bell": "Bell Pepper",
  "Potato": "Potato",
  "Raspberry": "Raspberry",
  "Soybean": "Soybean",
  "Squash": "Squash",
  "Strawberry": "Strawberry",
  "Tomato": "Tomato",
};

const DISEASE_NAME_MAP: Record<string, string> = {
  "healthy": "Healthy",
  "Apple_scab": "Apple Scab",
  "Black_rot": "Black Rot",
  "Cedar_apple_rust": "Cedar Apple Rust",
  "Powdery_mildew": "Powdery Mildew",
  "Cercospora_leaf_spot Gray_leaf_spot": "Cercospora Leaf Spot",
  "Common_rust_": "Common Rust",
  "Northern_Leaf_Blight": "Northern Leaf Blight",
  "Esca_(Black_Measles)": "Esca (Black Measles)",
  "Leaf_blight_(Isariopsis_Leaf_Spot)": "Leaf Blight (Isariopsis Leaf Spot)",
  "Haunglongbing_(Citrus_greening)": "Huanglongbing (Citrus Greening)",
  "Bacterial_spot": "Bacterial Spot",
  "Early_blight": "Early Blight",
  "Late_blight": "Late Blight",
  "Leaf_Mold": "Leaf Mold",
  "Septoria_leaf_spot": "Septoria Leaf Spot",
  "Spider_mites Two-spotted_spider_mite": "Spider Mites (Two-spotted Spider Mite)",
  "Target_Spot": "Target Spot",
  "Tomato_mosaic_virus": "Tomato Mosaic Virus",
  "Tomato_Yellow_Leaf_Curl_Virus": "Tomato Yellow Leaf Curl Virus",
  "Leaf_scorch": "Leaf Scorch",
};

const clampProbability = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value)));
};

const toTitleCase = (value: string) => {
  return value.replace(/\b([a-z])/g, (match) => match.toUpperCase());
};

const humanizeLabelPart = (value: string) => {
  return toTitleCase(
    String(value || "")
      .replace(/_/g, " ")
      .replace(/,/g, " ")
      .replace(/[()]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  );
};

const humanizeCropName = (value: string) => {
  return CROP_NAME_MAP[value] || humanizeLabelPart(value);
};

const humanizeDiseaseName = (value: string) => {
  return DISEASE_NAME_MAP[value] || humanizeLabelPart(value);
};

const parseClassLabel = (label: string): LocalPlantHealthClassMetadata => {
  const normalized = String(label || "").trim();
  const simpleStatus = normalized.toLowerCase() === "healthy" ? "healthy" : "diseased";

  if (!normalized.includes("___")) {
    const disease = simpleStatus === "healthy" ? undefined : humanizeDiseaseName(normalized);
    return {
      label: normalized,
      status: simpleStatus,
      disease,
      diseaseHi: disease,
    };
  }

  const [rawCropName, rawDiseaseName] = normalized.split("___", 2);
  const status = rawDiseaseName.trim().toLowerCase() === "healthy" ? "healthy" : "diseased";
  const disease = status === "healthy" ? undefined : humanizeDiseaseName(rawDiseaseName);

  return {
    label: normalized,
    cropName: humanizeCropName(rawCropName),
    status,
    disease,
    diseaseHi: disease,
  };
};

const loadMetadata = async () => {
  if (!metadataPromise) {
    metadataPromise = (async () => {
      try {
        const response = await fetch(METADATA_URL);
        if (!response.ok) {
          return null;
        }

        return (await response.json()) as LocalPlantHealthMetadata;
      } catch {
        return null;
      }
    })();
  }

  return metadataPromise;
};

export const getSupportedLocalPlantHealthCropNames = async () => {
  const metadata = await loadMetadata();
  const metadataCropNames = Array.isArray(metadata?.classes) && metadata.classes.length > 0
    ? metadata.classes
      .map((entry) => entry.cropName || parseClassLabel(entry.label || "").cropName)
      .filter((cropName): cropName is string => Boolean(String(cropName || "").trim()))
    : Array.isArray(metadata?.labels)
    ? metadata.labels
      .map((label) => parseClassLabel(label).cropName)
      .filter((cropName): cropName is string => Boolean(String(cropName || "").trim()))
    : [];

  return Array.from(new Set([...Object.values(CROP_NAME_MAP), ...metadataCropNames]))
    .map((cropName) => String(cropName || "").trim())
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right));
};

const loadModel = async () => {
  if (!modelPromise) {
    modelPromise = (async () => {
      try {
        await tf.ready();
        return await tf.loadLayersModel(MODEL_URL);
      } catch (error) {
        console.warn("Local plant health model unavailable:", error);
        return null;
      }
    })();
  }

  return modelPromise;
};

const loadImageElement = (file: File) => {
  return new Promise<{ image: HTMLImageElement; cleanup: () => void }>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      resolve({
        image,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to load image file."));
    };

    image.src = objectUrl;
  });
};

const createInputTensor = async (file: File, imageSize: number) => {
  const canvas = document.createElement("canvas");
  canvas.width = imageSize;
  canvas.height = imageSize;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file);

      try {
        context.drawImage(bitmap, 0, 0, imageSize, imageSize);
        return tf.tidy(() => tf.browser.fromPixels(canvas).toFloat().div(255).expandDims(0));
      } finally {
        bitmap.close?.();
      }
    } catch {
      // Some browsers expose createImageBitmap() but fail to decode certain
      // mobile gallery images with runtime errors like "Failed to load image data".
      // Fall back to the more compatible HTMLImageElement path below.
    }
  }

  const { image, cleanup } = await loadImageElement(file);

  try {
    context.drawImage(image, 0, 0, imageSize, imageSize);
  } finally {
    cleanup();
  }

  return tf.tidy(() => tf.browser.fromPixels(canvas).toFloat().div(255).expandDims(0));
};

const roundPercentage = (value: number) => Math.round(clampProbability(value) * 100);

const getProbabilities = (values: number[], labels?: string[]) => {
  if (values.length <= 1) {
    const diseasedProbability = clampProbability(values[0] ?? 0);
    return {
      diseasedProbability,
      healthyProbability: clampProbability(1 - diseasedProbability),
    };
  }

  const normalizedLabels = Array.isArray(labels) ? labels.map((label) => String(label || "").toLowerCase()) : [];
  const diseasedIndex = normalizedLabels.indexOf("diseased");
  const healthyIndex = normalizedLabels.indexOf("healthy");

  return {
    diseasedProbability: clampProbability(values[diseasedIndex >= 0 ? diseasedIndex : 0] ?? 0),
    healthyProbability: clampProbability(values[healthyIndex >= 0 ? healthyIndex : 1] ?? 0),
  };
};

const normalizeDistribution = (values: number[]) => {
  const probabilities = values.map((value) => clampProbability(value));
  const total = probabilities.reduce((sum, value) => sum + value, 0);
  if (total <= 0) {
    return probabilities;
  }
  return probabilities.map((value) => value / total);
};

const getClassMetadataEntries = (metadata: LocalPlantHealthMetadata, values: number[]) => {
  if (Array.isArray(metadata.classes) && metadata.classes.length === values.length) {
    return metadata.classes.map((entry, index) => {
      const fallback = parseClassLabel(entry.label || metadata.labels?.[index] || `class_${index}`);
      return {
        label: String(entry.label || fallback.label),
        cropName: entry.cropName || fallback.cropName,
        disease: entry.disease || fallback.disease,
        diseaseHi: entry.diseaseHi || fallback.diseaseHi,
        status: entry.status || fallback.status || "diseased",
      } satisfies Required<Pick<LocalPlantHealthClassMetadata, "label">> & LocalPlantHealthClassMetadata;
    });
  }

  if (Array.isArray(metadata.labels) && metadata.labels.length === values.length) {
    return metadata.labels.map((label) => parseClassLabel(label));
  }

  return [];
};

type RankedPrediction = LocalPlantHealthTopPrediction & {
  probability: number;
};

const summarizeRankedPredictions = (
  probabilities: number[],
  classEntries: LocalPlantHealthClassMetadata[]
) => {
  const ranked = probabilities
    .map((probability, index) => {
      const entry = classEntries[index] || parseClassLabel(`class_${index}`);
      return {
        label: entry.label,
        cropName: entry.cropName,
        disease: entry.disease,
        diseaseHi: entry.diseaseHi || entry.disease,
        status: entry.status === "healthy" ? "healthy" : "diseased",
        probability,
        confidence: roundPercentage(probability),
      } satisfies RankedPrediction;
    })
    .sort((left, right) => right.probability - left.probability);

  return {
    ranked,
    healthyProbability: ranked
      .filter((entry) => entry.status === "healthy")
      .reduce((sum, entry) => sum + entry.probability, 0),
    diseasedProbability: ranked
      .filter((entry) => entry.status === "diseased")
      .reduce((sum, entry) => sum + entry.probability, 0),
    topPredictions: ranked.slice(0, 3).map(({ probability: _probability, ...entry }) => entry),
  };
};

export const predictLocalPlantHealth = async (file: File): Promise<LocalPlantHealthPrediction | null> => {
  const [model, metadata] = await Promise.all([loadModel(), loadMetadata()]);
  if (!model || !metadata) {
    return null;
  }

  let inputTensor: tf.Tensor | null = null;
  let prediction: tf.Tensor | tf.Tensor[] | null = null;

  try {
    inputTensor = await createInputTensor(file, Math.max(32, Number(metadata.imageSize) || 128));
    prediction = model.predict(inputTensor) as tf.Tensor | tf.Tensor[];
    const outputTensor = Array.isArray(prediction) ? prediction[0] : prediction;
    const values = Array.from(await outputTensor.data()).map((value) => Number(value));
    const classEntries = getClassMetadataEntries(metadata, values);

    if (values.length <= 1 || classEntries.length !== values.length) {
      const { healthyProbability, diseasedProbability } = getProbabilities(values, metadata.labels);
      const healthyThreshold = clampProbability(Number(metadata.healthyThreshold) || 0.75);
      const diseasedThreshold = clampProbability(Number(metadata.diseasedThreshold) || 0.75);

      if (diseasedProbability >= diseasedThreshold) {
        return {
          status: "diseased",
          confidence: roundPercentage(diseasedProbability),
          healthyProbability: roundPercentage(healthyProbability),
          diseasedProbability: roundPercentage(diseasedProbability),
        };
      }

      if (healthyProbability >= healthyThreshold) {
        return {
          status: "healthy",
          confidence: roundPercentage(healthyProbability),
          healthyProbability: roundPercentage(healthyProbability),
          diseasedProbability: roundPercentage(diseasedProbability),
        };
      }

      return {
        status: "unknown",
        confidence: roundPercentage(Math.max(healthyProbability, diseasedProbability)),
        healthyProbability: roundPercentage(healthyProbability),
        diseasedProbability: roundPercentage(diseasedProbability),
      };
    }

    const probabilities = normalizeDistribution(values);
    const { ranked, topPredictions, healthyProbability, diseasedProbability } = summarizeRankedPredictions(
      probabilities,
      classEntries
    );
    const topPrediction = ranked[0];
    const secondProbability = ranked[1]?.probability ?? 0;
    const healthyThreshold = clampProbability(Number(metadata.healthyThreshold) || 0.7);
    const diseasedThreshold = clampProbability(Number(metadata.diseasedThreshold) || 0.5);
    const minConfidenceMargin = clampProbability(Number(metadata.minConfidenceMargin) || 0.15);

    if (
      topPrediction
      && topPrediction.status === "diseased"
      && topPrediction.probability >= diseasedThreshold
      && topPrediction.probability - secondProbability >= minConfidenceMargin
    ) {
      return {
        status: "diseased",
        confidence: topPrediction.confidence,
        healthyProbability: roundPercentage(healthyProbability),
        diseasedProbability: roundPercentage(diseasedProbability),
        label: topPrediction.label,
        cropName: topPrediction.cropName,
        disease: topPrediction.disease,
        diseaseHi: topPrediction.diseaseHi,
        topPredictions,
      };
    }

    if (
      topPrediction
      && topPrediction.status === "healthy"
      && topPrediction.probability >= healthyThreshold
      && topPrediction.probability - secondProbability >= minConfidenceMargin
    ) {
      return {
        status: "healthy",
        confidence: topPrediction.confidence,
        healthyProbability: roundPercentage(healthyProbability),
        diseasedProbability: roundPercentage(diseasedProbability),
        label: topPrediction.label,
        cropName: topPrediction.cropName,
        topPredictions,
      };
    }

    return {
      status: "unknown",
      confidence: topPrediction
        ? topPrediction.confidence
        : roundPercentage(Math.max(healthyProbability, diseasedProbability)),
      healthyProbability: roundPercentage(healthyProbability),
      diseasedProbability: roundPercentage(diseasedProbability),
      label: topPrediction?.label,
      cropName: topPrediction?.cropName,
      disease: topPrediction?.disease,
      diseaseHi: topPrediction?.diseaseHi,
      topPredictions,
    };
  } catch (error) {
    console.warn("Local plant health prediction failed:", error);
    return null;
  } finally {
    inputTensor?.dispose();

    if (Array.isArray(prediction)) {
      prediction.forEach((tensor) => tensor.dispose());
    } else {
      prediction?.dispose();
    }
  }
};

export const __resetLocalPlantHealthModelForTests = () => {
  modelPromise = null;
  metadataPromise = null;
};