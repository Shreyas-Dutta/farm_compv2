import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, ArrowLeft, Loader2, Leaf, AlertTriangle, CheckCircle } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { addScanResult, getUserCrops, updateCrop } from "@/lib/database";
import { detectCropDisease, hasCropScanAiConfigured } from "@/lib/api";
import { getSupportedLocalPlantHealthCropNames, predictLocalPlantHealth } from "@/lib/localPlantHealthModel";
import { doCropNamesMatch, isSupportedLocalPlantHealthCrop, resolveScanHealthAssessment } from "@/lib/scanHealth";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";

type ScanResult = {
  plantName: string;
  plantNameHi: string;
  identificationConfidence: number;
  healthStatus: "healthy" | "diseased" | "stressed" | "unknown";
  disease?: string;
  diseaseHi?: string;
  description: string;
  descriptionHi: string;
  treatment?: string;
  treatmentHi?: string;
  source: "vision" | "plantnet" | "fallback" | "local_model";
  isUnconfirmed?: boolean;
  notice?: "plantnet_rate_limited" | "plantnet_unavailable" | "plantnet_no_match" | "local_disease_limited" | "crop_mismatch";
  noticeMessage?: string;
};

type CropContext = {
  id?: string;
  name?: string;
  nameEn?: string;
  nameHi?: string;
  nameAs?: string;
  emoji?: string;
  health?: string;
  monitoringHistory?: any[];
};

const STRINGS: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  uploadTitle: string;
  uploadSubtitle: string;
  gallery: string;
  camera: string;
  analyzing: string;
  analyze: string;
  newScan: string;
  identification: string;
  confidence: string;
  health: string;
  details: string;
  treatment: string;
  failedAnalysis: string;
  unknown: string;
  imageAlt: string;
  monitoringTitle: string;
  monitoringHint: string;
  aiUnavailableTitle: string;
  aiUnavailableHint: string;
  aiTemporaryIssueTitle: string;
  plantNotIdentified: string;
  cropMismatchTitle: string;
  sourceLabel: string;
  sourceVision: string;
  sourcePlantnet: string;
  sourceFallback: string;
  sourceLocal: string;
  limitedDiseaseSupportTitle: string;
  unconfirmedResult: string;
  healthLabels: {
    healthy: string;
    diseased: string;
    stressed: string;
    unknown: string;
  };
}> = {
  en: {
    title: "Crop Scanner",
    subtitle: "AI Crop Health Scanner",
    uploadTitle: "Upload a crop photo",
    uploadSubtitle: "Upload a photo of your crop for AI analysis",
    gallery: "Choose from gallery",
    camera: "Open camera",
    analyzing: "Analyzing...",
    analyze: "Analyze",
    newScan: "New Scan",
    identification: "Identification",
    confidence: "confidence",
    health: "Health Status",
    details: "Details",
    treatment: "Treatment",
    failedAnalysis: "Failed to analyze image. Please try again.",
    unknown: "Unknown",
    imageAlt: "Selected crop",
    monitoringTitle: "Daily monitoring crop",
    monitoringHint: "This scan will update the daily health record for this crop.",
    aiUnavailableTitle: "Plant identification AI not configured",
    aiUnavailableHint: "Google Vision/PlantNet keys are missing, so plant identification may be limited. A local health model will still be used when available.",
    aiTemporaryIssueTitle: "AI scan temporarily unavailable",
    plantNotIdentified: "Plant not identified",
    cropMismatchTitle: "Crop name does not match the photo",
    sourceLabel: "Source",
    sourceVision: "Google Cloud Vision AI",
    sourcePlantnet: "PlantNet image identification",
    sourceFallback: "Limited fallback analysis",
    sourceLocal: "Local disease-identification model",
    limitedDiseaseSupportTitle: "Limited disease coverage for this crop",
    unconfirmedResult: "This photo was too unclear for a confirmed diagnosis, so it was not added to monitoring history.",
    healthLabels: {
      healthy: "Healthy",
      diseased: "Diseased",
      stressed: "Stressed",
      unknown: "Unknown",
    },
  },
  hi: {
    title: "फसल स्कैनर",
    subtitle: "एआई फसल स्वास्थ्य स्कैनर",
    uploadTitle: "फसल की फोटो अपलोड करें",
    uploadSubtitle: "एआई विश्लेषण के लिए अपनी फसल की फोटो अपलोड करें",
    gallery: "गैलरी से चुनें",
    camera: "कैमरा खोलें",
    analyzing: "विश्लेषण हो रहा है...",
    analyze: "विश्लेषण करें",
    newScan: "नया स्कैन",
    identification: "पहचान",
    confidence: "विश्वास",
    health: "स्वास्थ्य स्थिति",
    details: "विवरण",
    treatment: "उपचार",
    failedAnalysis: "छवि का विश्लेषण नहीं हो सका। कृपया फिर से प्रयास करें।",
    unknown: "अज्ञात",
    imageAlt: "चुनी गई फसल",
    monitoringTitle: "दैनिक निगरानी फसल",
    monitoringHint: "यह स्कैन इस फसल के दैनिक स्वास्थ्य रिकॉर्ड को अपडेट करेगा।",
    aiUnavailableTitle: "पौधे की पहचान करने वाला एआई कॉन्फ़िगर नहीं है",
    aiUnavailableHint: "Google Vision/PlantNet keys मौजूद नहीं हैं, इसलिए पौधे की पहचान सीमित हो सकती है। उपलब्ध होने पर स्थानीय स्वास्थ्य मॉडल फिर भी उपयोग होगा।",
    aiTemporaryIssueTitle: "एआई स्कैन अस्थायी रूप से उपलब्ध नहीं है",
    plantNotIdentified: "फसल की पहचान नहीं हुई",
    cropMismatchTitle: "फसल का नाम फोटो से मेल नहीं खाता",
    sourceLabel: "स्रोत",
    sourceVision: "Google Cloud Vision AI",
    sourcePlantnet: "PlantNet छवि पहचान",
    sourceFallback: "सीमित फॉलबैक विश्लेषण",
    sourceLocal: "स्थानीय रोग-पहचान मॉडल",
    limitedDiseaseSupportTitle: "इस फसल के लिए रोग कवरेज सीमित है",
    unconfirmedResult: "यह फोटो स्पष्ट नहीं थी, इसलिए इसे निगरानी इतिहास में नहीं जोड़ा गया।",
    healthLabels: {
      healthy: "स्वस्थ",
      diseased: "रोगग्रस्त",
      stressed: "तनावग्रस्त",
      unknown: "अज्ञात",
    },
  },
  as: {
    title: "শস্য স্কেনাৰ",
    subtitle: "AI শস্য স্বাস্থ্য স্কেনাৰ",
    uploadTitle: "শস্যৰ ফটো আপলোড কৰক",
    uploadSubtitle: "AI বিশ্লেষণৰ বাবে আপোনাৰ শস্যৰ ফটো আপলোড কৰক",
    gallery: "গেলাৰীৰ পৰা বাছক",
    camera: "কেমেৰা খোলক",
    analyzing: "বিশ্লেষণ হৈ আছে...",
    analyze: "বিশ্লেষণ কৰক",
    newScan: "নতুন স্কেন",
    identification: "চিনাক্তকৰণ",
    confidence: "বিশ্বাস",
    health: "স্বাস্থ্য অৱস্থা",
    details: "বিৱৰণ",
    treatment: "চিকিৎসা",
    failedAnalysis: "ছবিখন বিশ্লেষণ কৰিব পৰা নগ'ল। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
    unknown: "অজ্ঞাত",
    imageAlt: "নিৰ্বাচিত শস্য",
    monitoringTitle: "দৈনিক নজৰদাৰী শস্য",
    monitoringHint: "এই স্কেনে এই শস্যৰ দৈনিক স্বাস্থ্য ৰেকৰ্ড আপডেট কৰিব।",
    aiUnavailableTitle: "গছ চিনাক্তকৰণ AI কনফিগাৰ কৰা হোৱা নাই",
    aiUnavailableHint: "Google Vision/PlantNet key নথকাৰ বাবে গছ চিনাক্তকৰণ সীমিত হ'ব পাৰে। উপলব্ধ থাকিলে স্থানীয় স্বাস্থ্য মডেল তথাপি ব্যৱহাৰ কৰা হ'ব।",
    aiTemporaryIssueTitle: "AI স্কেন সাময়িকভাৱে উপলব্ধ নহয়",
    plantNotIdentified: "শস্য চিনাক্ত হোৱা নাই",
    cropMismatchTitle: "শস্যৰ নাম ফটোৰ সৈতে মিল খোৱা নাই",
    sourceLabel: "উৎস",
    sourceVision: "Google Cloud Vision AI",
    sourcePlantnet: "PlantNet ছবি চিনাক্তকৰণ",
    sourceFallback: "সীমিত ফলবেক বিশ্লেষণ",
    sourceLocal: "স্থানীয় ৰোগ চিনাক্তকৰণ মডেল",
    limitedDiseaseSupportTitle: "এই শস্যৰ বাবে ৰোগ কভাৰেজ সীমিত",
    unconfirmedResult: "এই ফটোখন স্পষ্ট নাছিল, সেয়েহে ইয়াক নজৰদাৰী ইতিহাসত সঞ্চয় কৰা হোৱা নাই।",
    healthLabels: {
      healthy: "সুস্থ",
      diseased: "ৰোগাক্ৰান্ত",
      stressed: "চাপত",
      unknown: "অজ্ঞাত",
    },
  },
};

const LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
};

const Scan = () => {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = STRINGS[language];
  const scanAiConfigured = hasCropScanAiConfigured();
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const cropFromState = (routerLocation.state as { crop?: CropContext } | null)?.crop || null;
  const requestedCropId = searchParams.get("cropId") || cropFromState?.id || "";
  const [selectedCrop, setSelectedCrop] = useState<CropContext | null>(cropFromState);

  const getLocalizedText = (primary?: string, secondary?: string) => {
    if (language === "hi") return primary || secondary || t.unknown;
    if (language === "as") return secondary || primary || t.unknown;
    return secondary || primary || t.unknown;
  };

  const getLocalizedCropName = (crop?: CropContext | null) => {
    if (!crop) return "";
    if (language === "hi") return crop.nameHi || crop.name || crop.nameEn || crop.nameAs || "";
    if (language === "as") return crop.nameAs || crop.nameEn || crop.name || crop.nameHi || "";
    return crop.nameEn || crop.name || crop.nameAs || crop.nameHi || "";
  };

  const isUnconfirmedDetection = (detection: { severity?: string; disease?: string }) => {
    const normalizedDisease = String(detection.disease || "").trim().toLowerCase();
    return detection.severity === "unknown" || normalizedDisease === "condition not confirmed";
  };

  const isGenericFallbackIdentity = (detection: { source?: string; plantName?: string; plantNameHi?: string }) => {
    return detection.source === "fallback"
      && String(detection.plantName || "").trim() === "Plant"
      && String(detection.plantNameHi || "").trim() === "पौधा";
  };

  const getSourceLabel = (source: ScanResult["source"]) => {
    if (source === "local_model") return t.sourceLocal;
    if (source === "vision") return t.sourceVision;
    if (source === "plantnet") return t.sourcePlantnet;
    return t.sourceFallback;
  };

  const getNoticeTitle = (notice: NonNullable<ScanResult["notice"]>) => {
    if (notice === "plantnet_no_match") return t.plantNotIdentified;
    if (notice === "crop_mismatch") return t.cropMismatchTitle;
    if (notice === "local_disease_limited") return t.limitedDiseaseSupportTitle;
    return t.aiTemporaryIssueTitle;
  };

  const buildLimitedDiseaseSupportMessage = (plantName: string, supportedCropNames: string[]) => {
    const supportedList = supportedCropNames.join(", ");
    if (language === "hi") {
      return `${plantName} के लिए स्थानीय रोग-पहचान अभी उपलब्ध नहीं है। स्थानीय रोग वर्गीकरण फिलहाल केवल इन फसलों के लिए उपलब्ध है: ${supportedList}. इस स्कैन में सामान्य पौधा पहचान का उपयोग किया गया है।`;
    }

    if (language === "as") {
      return `${plantName} ৰ বাবে স্থানীয় ৰোগ চিনাক্তকৰণ এতিয়াও উপলব্ধ নহয়। স্থানীয় ৰোগ শ্ৰেণীবিভাজন বৰ্তমান কেৱল এই শস্যসমূহৰ বাবেহে উপলব্ধ: ${supportedList}. এই স্কেনত সাধাৰণ উদ্ভিদ চিনাক্তকৰণ ব্যৱহাৰ কৰা হৈছে।`;
    }

    return `Local disease identification is not available for ${plantName} yet. The local disease model currently supports only: ${supportedList}. This scan used the broader plant-identification flow instead.`;
  };

  const buildCropMismatchMessage = (expectedCrop: string, identifiedCrop: string) => {
    if (language === "hi") {
      return `यह दैनिक निगरानी स्कैन ${expectedCrop} के लिए है, लेकिन फोटो ${identifiedCrop} के रूप में पहचानी गई। स्वास्थ्य परिणाम केवल संदर्भ के लिए दिखाया गया है और इसे इस फसल के निगरानी इतिहास में नहीं जोड़ा गया।`;
    }

    if (language === "as") {
      return `এই দৈনিক নজৰদাৰী স্কেন ${expectedCrop} ৰ বাবে, কিন্তু ফটোখন ${identifiedCrop} হিচাপে চিনাক্ত হৈছে। স্বাস্থ্য ফলাফল কেৱল ৰেফাৰেন্সৰ বাবে দেখুওৱা হৈছে আৰু ইয়াক এই শস্যৰ নজৰদাৰী ইতিহাসত যোগ কৰা হোৱা নাই।`;
    }

    return `This daily monitoring scan is for ${expectedCrop}, but the photo was identified as ${identifiedCrop}. The health result is shown for reference only and was not added to this crop's monitoring history.`;
  };

  useEffect(() => {
    let isMounted = true;

    if (!requestedCropId || !user?.uid) {
      return () => {
        isMounted = false;
      };
    }

    if (cropFromState?.id && String(cropFromState.id) === requestedCropId) {
      return () => {
        isMounted = false;
      };
    }

    const loadCrop = async () => {
      try {
        const crops = await getUserCrops(user.uid);
        const matchedCrop = Array.isArray(crops)
          ? crops.find((crop) => String(crop?.id || "") === requestedCropId)
          : null;

        if (isMounted && matchedCrop) {
          setSelectedCrop(matchedCrop);
        }
      } catch (error) {
        console.error("Error loading crop for monitoring:", error);
      }
    };

    void loadCrop();

    return () => {
      isMounted = false;
    };
  }, [cropFromState?.id, requestedCropId, user?.uid]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setSelectedImage(ev.target?.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);

    try {
      const localHealthPredictionTask = predictLocalPlantHealth(selectedFile).catch((error) => {
        console.warn("Local plant health analysis skipped for this image:", error);
        return null;
      });
      const supportedLocalCropNamesTask = getSupportedLocalPlantHealthCropNames().catch((error) => {
        console.warn("Supported local plant-health crops unavailable:", error);
        return [];
      });
      const [detectionResult, localHealthPrediction, supportedLocalCropNames] = await Promise.all([
        detectCropDisease(selectedFile),
        localHealthPredictionTask,
        supportedLocalCropNamesTask,
      ]);
      const explicitPlantName = selectedCrop?.nameEn
        || selectedCrop?.name
        || (detectionResult.plantName && detectionResult.plantName !== "Plant" ? detectionResult.plantName : "");
      const hasSupportedLocalDiseaseCoverage = isSupportedLocalPlantHealthCrop(explicitPlantName, supportedLocalCropNames);
      const isLimitedFallbackWithoutIdentity = !scanAiConfigured
        && !selectedCrop
        && isGenericFallbackIdentity(detectionResult);
      const fallbackPlantName = selectedCrop?.nameEn || selectedCrop?.name || detectionResult.plantName || t.unknown;
      const fallbackPlantNameHi = selectedCrop?.nameHi || selectedCrop?.name || detectionResult.plantNameHi || detectionResult.plantName || t.unknown;
      const resultPlantName = isLimitedFallbackWithoutIdentity
        ? t.plantNotIdentified
        : detectionResult.plantName && detectionResult.plantName !== "Plant"
        ? detectionResult.plantName
        : fallbackPlantName;
      const resultPlantNameHi = isLimitedFallbackWithoutIdentity
        ? t.plantNotIdentified
        : detectionResult.plantNameHi && detectionResult.plantNameHi !== "पौधा"
        ? detectionResult.plantNameHi
        : fallbackPlantNameHi;
      const hasCropNameMismatch = Boolean(selectedCrop)
        && Boolean(detectionResult.plantName && detectionResult.plantName !== "Plant")
        && !doCropNamesMatch(
          selectedCrop?.nameEn || selectedCrop?.name || selectedCrop?.nameHi || selectedCrop?.nameAs,
          detectionResult.plantName,
        );
      const cropNameForHistory = selectedCrop
        ? getLocalizedCropName(selectedCrop)
        : getLocalizedText(resultPlantNameHi, resultPlantName);
      const resolvedHealth = resolveScanHealthAssessment({
        detection: detectionResult,
        localPrediction: hasSupportedLocalDiseaseCoverage ? localHealthPrediction : null,
        plantName: resultPlantName,
      });
      const displaySource = detectionResult.source;
      const shouldShowLimitedDiseaseCoverageNotice = Boolean(explicitPlantName)
        && !hasCropNameMismatch
        && !hasSupportedLocalDiseaseCoverage
        && !detectionResult.notice;
      const notice = hasCropNameMismatch
        ? "crop_mismatch"
        : shouldShowLimitedDiseaseCoverageNotice
        ? "local_disease_limited"
        : detectionResult.notice;
      const noticeMessage = hasCropNameMismatch
        ? buildCropMismatchMessage(
          getLocalizedCropName(selectedCrop),
          getLocalizedText(resultPlantNameHi, resultPlantName),
        )
        : shouldShowLimitedDiseaseCoverageNotice
        ? buildLimitedDiseaseSupportMessage(getLocalizedText(resultPlantNameHi, resultPlantName), supportedLocalCropNames)
        : undefined;
      const isUnconfirmedDetectionResult = isUnconfirmedDetection(detectionResult);
      const currentUserId = user?.uid;
      const shouldPersistScanHistory = !isLimitedFallbackWithoutIdentity;
      const shouldPersistMonitoringResult = resolvedHealth.persistable && !isLimitedFallbackWithoutIdentity && !hasCropNameMismatch;
      const canPersistScanHistory = Boolean(currentUserId) && shouldPersistScanHistory;
      const canPersistMonitoringResult = Boolean(currentUserId) && shouldPersistMonitoringResult;
      const isUnconfirmedResult = (!shouldPersistMonitoringResult && !hasCropNameMismatch)
        || (resolvedHealth.source !== "local_model" && isUnconfirmedDetectionResult);
      const historyCropName = hasCropNameMismatch
        ? getLocalizedText(resultPlantNameHi, resultPlantName)
        : cropNameForHistory;
      const historyCropNameHi = hasCropNameMismatch
        ? resultPlantNameHi
        : selectedCrop?.nameHi || selectedCrop?.name || resultPlantNameHi;
      const historyCropNameEn = hasCropNameMismatch
        ? resultPlantName
        : selectedCrop?.nameEn || selectedCrop?.name || resultPlantName;
      const historyCropNameAs = hasCropNameMismatch
        ? resultPlantName
        : selectedCrop?.nameAs || selectedCrop?.nameEn || selectedCrop?.name || resultPlantName;

      const monitoringEntry = {
        date: new Date().toLocaleDateString(LOCALE_BY_LANGUAGE[language]),
        timestamp: detectionResult.timestamp,
        result: resolvedHealth.healthStatus,
        confidence: resolvedHealth.confidence,
        healthConfidence: resolvedHealth.confidence,
        identificationConfidence: detectionResult.confidence,
        disease: resolvedHealth.disease,
        diseaseHi: resolvedHealth.diseaseHi,
        summary: resolvedHealth.description,
        source: detectionResult.source,
        healthSource: resolvedHealth.source,
        imageUrl: selectedImage,
      };

      if (canPersistScanHistory && currentUserId) {
        await addScanResult(currentUserId, {
          crop: historyCropName,
          cropHi: historyCropNameHi,
          cropEn: historyCropNameEn,
          cropAs: historyCropNameAs,
          date: monitoringEntry.date,
          result: resolvedHealth.healthStatus,
          confidence: resolvedHealth.confidence,
          healthConfidence: resolvedHealth.confidence,
          identificationConfidence: detectionResult.confidence,
          disease: resolvedHealth.disease,
          diseaseHi: resolvedHealth.diseaseHi,
          recommendations: resolvedHealth.treatment ? [resolvedHealth.treatment] : [],
          severity: detectionResult.severity,
          timestamp: detectionResult.timestamp,
          imageUrl: selectedImage,
          source: detectionResult.source,
          summary: resolvedHealth.description,
          healthSource: resolvedHealth.source,
          cropId: hasCropNameMismatch ? null : selectedCrop?.id || null,
          isUnconfirmed: isUnconfirmedResult,
        });
      }

      if (selectedCrop?.id && canPersistMonitoringResult && currentUserId) {
        const existingHistory = Array.isArray(selectedCrop.monitoringHistory) ? selectedCrop.monitoringHistory : [];
        await updateCrop(currentUserId, String(selectedCrop.id), {
          health: resolvedHealth.healthStatus,
          lastMonitoringAt: detectionResult.timestamp,
          lastMonitoringDate: monitoringEntry.date,
          lastMonitoringResult: resolvedHealth.healthStatus,
          lastMonitoringConfidence: resolvedHealth.confidence,
          lastMonitoringHealthConfidence: resolvedHealth.confidence,
          lastMonitoringIdentificationConfidence: detectionResult.confidence,
          lastMonitoringDisease: resolvedHealth.disease,
          lastMonitoringDiseaseHi: resolvedHealth.diseaseHi,
          lastMonitoringSummary: resolvedHealth.description,
          lastMonitoringSource: detectionResult.source,
          lastMonitoringHealthSource: resolvedHealth.source,
          lastMonitoringImageUrl: selectedImage,
          monitoringHistory: [monitoringEntry, ...existingHistory].slice(0, 7),
        });

        setSelectedCrop((current) => current ? {
          ...current,
          health: resolvedHealth.healthStatus,
          lastMonitoringAt: detectionResult.timestamp,
          lastMonitoringDate: monitoringEntry.date,
          lastMonitoringResult: resolvedHealth.healthStatus,
          lastMonitoringConfidence: resolvedHealth.confidence,
          lastMonitoringHealthConfidence: resolvedHealth.confidence,
          lastMonitoringIdentificationConfidence: detectionResult.confidence,
          lastMonitoringDisease: resolvedHealth.disease,
          lastMonitoringDiseaseHi: resolvedHealth.diseaseHi,
          lastMonitoringSummary: resolvedHealth.description,
          lastMonitoringSource: detectionResult.source,
          lastMonitoringHealthSource: resolvedHealth.source,
          monitoringHistory: [monitoringEntry, ...(Array.isArray(current.monitoringHistory) ? current.monitoringHistory : [])].slice(0, 7),
        } : current);
      }

      setResult({
        plantName: resultPlantName,
        plantNameHi: resultPlantNameHi,
        identificationConfidence: detectionResult.confidence,
        healthStatus: resolvedHealth.healthStatus,
        disease: resolvedHealth.disease,
        diseaseHi: resolvedHealth.diseaseHi,
        description: resolvedHealth.description,
        descriptionHi: resolvedHealth.description,
        treatment: resolvedHealth.treatment,
        treatmentHi: resolvedHealth.treatment,
        source: displaySource,
        isUnconfirmed: isUnconfirmedResult,
        notice,
        noticeMessage,
      });
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert(t.failedAnalysis);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setSelectedFile(null);
    setResult(null);
  };

  const getHealthColor = (status: string) => {
    switch (status) {
      case "healthy": return "text-success";
      case "diseased": return "text-destructive";
      case "stressed": return "text-warning";
      default: return "text-muted-foreground";
    }
  };

  const getHealthLabel = (status: string) => {
    switch (status) {
      case "healthy": return t.healthLabels.healthy;
      case "diseased": return t.healthLabels.diseased;
      case "stressed": return t.healthLabels.stressed;
      default: return t.healthLabels.unknown;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-primary text-primary-foreground px-4 pt-10 pb-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <Leaf className="w-5 h-5" />
            {t.title}
          </h1>
          <p className="text-xs opacity-80">{t.subtitle}</p>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        {!scanAiConfigured && (
          <Card className="border border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t.aiUnavailableTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t.aiUnavailableHint}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedImage ? (
          <Card className="border-2 border-dashed border-primary/30">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <h2 className="font-semibold text-foreground mb-1">{t.uploadTitle}</h2>
              <p className="text-xs text-muted-foreground mb-6">{t.uploadSubtitle}</p>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full rounded-xl"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {t.gallery}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="w-full rounded-xl"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  {t.camera}
                </Button>
              </div>

              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />
            </CardContent>
          </Card>
        ) : (
          <>
            {selectedCrop && (
              <Card className="border border-primary/20 bg-primary/5">
                <CardContent className="p-4">
                  <p className="text-xs font-semibold text-primary mb-1">{t.monitoringTitle}</p>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{selectedCrop.emoji || "🌾"}</span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{getLocalizedCropName(selectedCrop)}</p>
                      <p className="text-xs text-muted-foreground">{t.monitoringHint}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image Preview */}
            <Card className="overflow-hidden border border-border">
              <img
                src={selectedImage}
                alt={t.imageAlt}
                className="w-full h-56 object-cover"
              />
              <CardContent className="p-3 flex gap-2">
                {!result && (
                  <Button
                    onClick={handleAnalyze}
                    disabled={isAnalyzing}
                    className="flex-1 rounded-xl"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t.analyzing}
                      </>
                    ) : (
                      <>
                        <Leaf className="w-4 h-4 mr-2" />
                        {t.analyze}
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" onClick={handleReset} className="rounded-xl">
                  <span className="text-xs">{t.newScan}</span>
                </Button>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {result.notice && (
                  <Card className="border border-warning/30 bg-warning/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {getNoticeTitle(result.notice)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {result.noticeMessage || getLocalizedText(result.descriptionHi, result.description)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Plant ID */}
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold">🌱 {t.identification}</h3>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                        {result.identificationConfidence}% {t.confidence}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-foreground">
                      {getLocalizedText(result.plantNameHi, result.plantName)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t.sourceLabel}: {getSourceLabel(result.source)}
                    </p>
                    {result.isUnconfirmed && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        {t.unconfirmedResult}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Health Status */}
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2">🏥 {t.health}</h3>
                    <div className={`flex items-center gap-2 ${getHealthColor(result.healthStatus)}`}>
                      {result.healthStatus === "healthy" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5" />
                      )}
                      <span className="font-semibold">
                        {result.isUnconfirmed && result.healthStatus === "unknown" && result.disease
                          ? getLocalizedText(result.diseaseHi, result.disease)
                          : getHealthLabel(result.healthStatus)}
                      </span>
                    </div>
                    {result.disease && result.healthStatus !== "healthy" && !result.isUnconfirmed && (
                      <div className="mt-2 bg-destructive/10 rounded-lg p-3">
                        <p className="text-sm font-semibold text-destructive">
                          {getLocalizedText(result.diseaseHi, result.disease)}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Description */}
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <h3 className="text-sm font-semibold mb-2">📋 {t.details}</h3>
                    <p className="text-sm text-foreground leading-relaxed">
                      {getLocalizedText(result.descriptionHi, result.description)}
                    </p>
                  </CardContent>
                </Card>

                {/* Treatment */}
                {result.treatment && (
                  <Card className="border border-primary/30 bg-primary/5">
                    <CardContent className="p-4">
                      <h3 className="text-sm font-semibold mb-2">💊 {t.treatment}</h3>
                      <p className="text-sm text-foreground leading-relaxed">
                        {getLocalizedText(result.treatmentHi, result.treatment)}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Scan;
