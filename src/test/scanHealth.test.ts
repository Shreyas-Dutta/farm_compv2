import { describe, expect, it } from "vitest";

import type { CropDiseaseDetectionResult } from "@/lib/api";
import { doCropNamesMatch, isSupportedLocalPlantHealthCrop, resolveScanHealthAssessment } from "@/lib/scanHealth";

const buildDetection = (overrides: Partial<CropDiseaseDetectionResult> = {}): CropDiseaseDetectionResult => ({
  plantName: "Tomato",
  plantNameHi: "टमाटर",
  disease: "Early Blight",
  diseaseHi: "अर्ली ब्लाइट",
  confidence: 44,
  severity: "medium",
  recommendations: ["Use a suitable fungicide and remove badly affected leaves."],
  imageUrl: "blob:test-image",
  timestamp: "2026-03-08T10:00:00.000Z",
  source: "vision",
  summary: "The external identification flow found likely disease symptoms.",
  labels: ["Tomato", "Leaf"],
  ...overrides,
});

describe("isSupportedLocalPlantHealthCrop", () => {
  const supportedCropNames = ["Bell Pepper", "Maize", "Tomato"];

  it("matches normalized crop aliases against the supported list", () => {
    expect(isSupportedLocalPlantHealthCrop("Corn", supportedCropNames)).toBe(true);
    expect(isSupportedLocalPlantHealthCrop("Capsicum", supportedCropNames)).toBe(true);
    expect(isSupportedLocalPlantHealthCrop("Tomato", supportedCropNames)).toBe(true);
  });

  it("returns false for unsupported or generic crop labels", () => {
    expect(isSupportedLocalPlantHealthCrop("Rice", supportedCropNames)).toBe(false);
    expect(isSupportedLocalPlantHealthCrop("Plant", supportedCropNames)).toBe(false);
    expect(isSupportedLocalPlantHealthCrop("", supportedCropNames)).toBe(false);
  });
});

describe("doCropNamesMatch", () => {
  it("matches normalized crop aliases", () => {
    expect(doCropNamesMatch("Corn", "Maize")).toBe(true);
    expect(doCropNamesMatch("Capsicum", "Bell Pepper")).toBe(true);
  });

  it("returns false for clearly different crop names", () => {
    expect(doCropNamesMatch("Rice", "Tomato")).toBe(false);
  });

  it("treats missing or generic identifications as non-blocking", () => {
    expect(doCropNamesMatch("Rice", "Plant")).toBe(true);
    expect(doCropNamesMatch("", "Tomato")).toBe(true);
  });
});

describe("resolveScanHealthAssessment", () => {
  it("uses the local multiclass disease result when it identifies a matching crop disease", () => {
    const result = resolveScanHealthAssessment({
      detection: buildDetection({
        disease: "Condition not confirmed",
        diseaseHi: "स्थिति की पुष्टि नहीं हुई",
        severity: "unknown",
        confidence: 31,
      }),
      localPrediction: {
        status: "diseased",
        confidence: 92,
        healthyProbability: 8,
        diseasedProbability: 92,
        label: "Tomato___Early_blight",
        cropName: "Tomato",
        disease: "Early Blight",
        diseaseHi: "Early Blight",
        topPredictions: [
          {
            label: "Tomato___Early_blight",
            cropName: "Tomato",
            disease: "Early Blight",
            diseaseHi: "Early Blight",
            status: "diseased",
            confidence: 92,
          },
        ],
      },
      plantName: "Tomato",
    });

    expect(result.healthStatus).toBe("diseased");
    expect(result.confidence).toBe(92);
    expect(result.disease).toBe("Early Blight");
    expect(result.treatment).toContain("Early Blight");
    expect(result.persistable).toBe(true);
    expect(result.source).toBe("local_model");
  });

  it("uses a confident local healthy result when the crop matches", () => {
    const result = resolveScanHealthAssessment({
      detection: buildDetection({ severity: "high", confidence: 87 }),
      localPrediction: {
        status: "healthy",
        confidence: 89,
        healthyProbability: 89,
        diseasedProbability: 11,
        label: "Tomato___healthy",
        cropName: "Tomato",
        topPredictions: [
          {
            label: "Tomato___healthy",
            cropName: "Tomato",
            status: "healthy",
            confidence: 89,
          },
        ],
      },
      plantName: "Tomato",
    });

    expect(result.healthStatus).toBe("healthy");
    expect(result.disease).toBeUndefined();
    expect(result.treatment).toBeUndefined();
    expect(result.persistable).toBe(true);
    expect(result.source).toBe("local_model");
  });

  it("falls back to detection disease when the local multiclass crop prediction does not match", () => {
    const result = resolveScanHealthAssessment({
      detection: buildDetection({ severity: "medium", confidence: 64 }),
      localPrediction: {
        status: "diseased",
        confidence: 96,
        healthyProbability: 4,
        diseasedProbability: 96,
        label: "Grape___Black_rot",
        cropName: "Grape",
        disease: "Black Rot",
        diseaseHi: "Black Rot",
      },
      plantName: "Tomato",
    });

    expect(result.healthStatus).toBe("diseased");
    expect(result.disease).toBe("Early Blight");
    expect(result.treatment).toContain("fungicide");
    expect(result.persistable).toBe(true);
    expect(result.source).toBe("detection_fallback");
  });

  it("shows healthy when no disease is identified even if the local model is inconclusive", () => {
    const result = resolveScanHealthAssessment({
      detection: buildDetection({
        disease: "Condition not confirmed",
        diseaseHi: "स्थिति की पुष्टि नहीं हुई",
        severity: "unknown",
      }),
      localPrediction: {
        status: "unknown",
        confidence: 61,
        healthyProbability: 61,
        diseasedProbability: 39,
      },
      plantName: "Tomato",
    });

    expect(result.healthStatus).toBe("healthy");
    expect(result.disease).toBeUndefined();
    expect(result.treatment).toBeUndefined();
    expect(result.persistable).toBe(false);
    expect(result.source).toBe("detection_fallback");
  });

  it("shows diseased when the disease is identified and the local model is unavailable", () => {
    const result = resolveScanHealthAssessment({
      detection: buildDetection({ severity: "medium", confidence: 47 }),
      localPrediction: null,
      plantName: "Tomato",
    });

    expect(result.healthStatus).toBe("diseased");
    expect(result.confidence).toBe(47);
    expect(result.source).toBe("detection_fallback");
    expect(result.disease).toBe("Early Blight");
    expect(result.treatment).toContain("fungicide");
  });

  it("shows healthy when no disease is identified and the local model is unavailable", () => {
    const result = resolveScanHealthAssessment({
      detection: buildDetection({
        disease: "Condition not confirmed",
        diseaseHi: "स्थिति की पुष्टि नहीं हुई",
        severity: "medium",
        confidence: 47,
      }),
      localPrediction: null,
      plantName: "Tomato",
    });

    expect(result.healthStatus).toBe("healthy");
    expect(result.confidence).toBe(47);
    expect(result.source).toBe("detection_fallback");
    expect(result.disease).toBeUndefined();
    expect(result.treatment).toBeUndefined();
    expect(result.persistable).toBe(false);
  });

  it("shows healthy and keeps the result persistable when the scan explicitly indicates healthy", () => {
    const result = resolveScanHealthAssessment({
      detection: buildDetection({
        disease: "Healthy",
        diseaseHi: "स्वस्थ",
        severity: "low",
        confidence: 72,
      }),
      localPrediction: null,
      plantName: "Tomato",
    });

    expect(result.healthStatus).toBe("healthy");
    expect(result.persistable).toBe(true);
    expect(result.disease).toBeUndefined();
  });
});