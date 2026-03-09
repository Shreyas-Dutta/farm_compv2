import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Sprout, History, Edit, Leaf, LogOut, ScanLine, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import { clearUserScanHistory, deleteCrop, deleteScanResult, getUserProfile, getUserCrops, getUserScanHistory } from "@/lib/database";
import { getDisasterEventsForLocation, hasValidCoordinates, type DisasterEvent } from "@/lib/api";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";
import { VOICE_COMMAND_CROPS_UPDATED_EVENT } from "@/lib/voiceCommands";

const LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
};

const INITIAL_VISIBLE_DISASTER_EVENTS = 5;

const STRINGS: Record<SupportedLanguage, {
  fallbackName: string;
  male: string;
  female: string;
  years: string;
  loading: string;
  loadingProfileData: string;
  loadingSlow: string;
  logoutConfirm: string;
  sections: {
    crops: string;
    disasterHistory: string;
    scanHistory: string;
  };
  disasterLocationLabel: string;
  disasterLocationPlaceholder: string;
  disasterLocationHint: string;
  loadingDisasterHistory: string;
  disasterPastYearSummary: string;
  noDisasterHistoryForLocation: string;
  noDisasterHistory: string;
  seeMoreDisasterEvents: string;
  showLessDisasterEvents: string;
  noCrops: string;
  noScans: string;
  addFirstCrop: string;
  addNewCrop: string;
  editCrop: string;
    monitorCrop: string;
  deleteCrop: string;
  deleteCropConfirm: string;
  deleteCropFailed: string;
  firstScan: string;
  deleteScan: string;
  deleteScanConfirm: string;
  deleteScanFailed: string;
  clearHistory: string;
  clearHistoryConfirm: string;
  clearHistoryFailed: string;
  lastChecked: string;
  noMonitoringYet: string;
  sourceLabel: string;
  visionSource: string;
  fallbackSource: string;
  unconfirmedMonitoring: string;
  unconfirmedScan: string;
  health: {
    healthy: string;
    stressed: string;
    diseased: string;
    unknown: string;
  };
  status: Record<string, string>;
}> = {
  en: {
    fallbackName: "Farm Companion",
    male: "Male",
    female: "Female",
    years: "years",
    loading: "Loading...",
    loadingProfileData: "Loading profile data...",
    loadingSlow: "This is taking longer than expected. Please check your internet connection.",
    logoutConfirm: "Are you sure you want to logout?",
    sections: {
      crops: "My Crops",
      disasterHistory: "Disaster History",
      scanHistory: "Scan History",
    },
    disasterLocationLabel: "Location",
    disasterLocationPlaceholder: "Enter a location",
    disasterLocationHint: "Enter a location to view disaster events from the past year.",
    loadingDisasterHistory: "Loading disaster events...",
    disasterPastYearSummary: "{count} disaster events from the past year for {location}",
    noDisasterHistoryForLocation: "No disaster events found for {location} in the past year",
    noDisasterHistory: "No disaster events found yet",
    seeMoreDisasterEvents: "See more",
    showLessDisasterEvents: "Show less",
    noCrops: "No crops added yet",
    noScans: "No scan history yet",
    addFirstCrop: "Add First Crop",
    addNewCrop: "Add New Crop",
    editCrop: "Edit",
    monitorCrop: "Daily Monitor",
    deleteCrop: "Delete",
    deleteCropConfirm: "Delete {crop}?",
    deleteCropFailed: "Failed to delete crop. Please try again.",
    firstScan: "Start First Scan",
    deleteScan: "Delete",
    deleteScanConfirm: "Delete this scan history item?",
    deleteScanFailed: "Failed to delete scan history. Please try again.",
    clearHistory: "Clear All",
    clearHistoryConfirm: "Delete all scan history?",
    clearHistoryFailed: "Failed to clear scan history. Please try again.",
    lastChecked: "Last checked",
    noMonitoringYet: "No daily health check yet",
    sourceLabel: "Source",
    visionSource: "Google Cloud Vision AI",
    fallbackSource: "Fallback scan",
    unconfirmedMonitoring: "Condition not confirmed",
    unconfirmedScan: "Not confirmed",
    health: {
      healthy: "Healthy",
      stressed: "Stressed",
      diseased: "Diseased",
      unknown: "Unknown",
    },
    status: {
      growing: "Growing",
      harvested: "Harvested",
      ready: "Ready",
    },
  },
  hi: {
    fallbackName: "खेत सहायक",
    male: "पुरुष",
    female: "महिला",
    years: "वर्ष",
    loading: "लोड हो रहा है...",
    loadingProfileData: "प्रोफाइल डेटा लोड हो रहा है...",
    loadingSlow: "उम्मीद से अधिक समय लग रहा है। कृपया अपना इंटरनेट कनेक्शन जांचें।",
    logoutConfirm: "क्या आप वाकई लॉगआउट करना चाहते हैं?",
    sections: {
      crops: "मेरी फसलें",
      disasterHistory: "आपदा इतिहास",
      scanHistory: "स्कैन इतिहास",
    },
    disasterLocationLabel: "स्थान",
    disasterLocationPlaceholder: "स्थान दर्ज करें",
    disasterLocationHint: "पिछले एक साल की आपदा घटनाएँ देखने के लिए स्थान दर्ज करें।",
    loadingDisasterHistory: "आपदा घटनाएँ लोड हो रही हैं...",
    disasterPastYearSummary: "पिछले एक साल में {location} के लिए {count} आपदा घटनाएँ",
    noDisasterHistoryForLocation: "पिछले एक साल में {location} के लिए कोई आपदा घटना नहीं मिली",
    noDisasterHistory: "अभी तक कोई आपदा घटना नहीं मिली",
    seeMoreDisasterEvents: "और देखें",
    showLessDisasterEvents: "कम दिखाएँ",
    noCrops: "कोई फसल नहीं जोड़ी गई",
    noScans: "कोई स्कैन इतिहास नहीं",
    addFirstCrop: "पहली फसल जोड़ें",
    addNewCrop: "नई फसल जोड़ें",
    editCrop: "संपादित करें",
    monitorCrop: "दैनिक निगरानी",
    deleteCrop: "हटाएँ",
    deleteCropConfirm: "क्या {crop} को हटाना है?",
    deleteCropFailed: "फसल हटाने में समस्या हुई। कृपया फिर से कोशिश करें।",
    firstScan: "पहला स्कैन करें",
    deleteScan: "हटाएँ",
    deleteScanConfirm: "क्या इस स्कैन इतिहास को हटाना है?",
    deleteScanFailed: "स्कैन इतिहास हटाने में समस्या हुई। कृपया फिर से कोशिश करें।",
    clearHistory: "सभी हटाएँ",
    clearHistoryConfirm: "क्या पूरा स्कैन इतिहास हटाना है?",
    clearHistoryFailed: "स्कैन इतिहास साफ़ करने में समस्या हुई। कृपया फिर से कोशिश करें।",
    lastChecked: "आखिरी जांच",
    noMonitoringYet: "अभी तक कोई दैनिक स्वास्थ्य जांच नहीं",
    sourceLabel: "स्रोत",
    visionSource: "Google Cloud Vision AI",
    fallbackSource: "फॉलबैक स्कैन",
    unconfirmedMonitoring: "स्थिति की पुष्टि नहीं हुई",
    unconfirmedScan: "पुष्टि नहीं हुई",
    health: {
      healthy: "स्वस्थ",
      stressed: "तनावग्रस्त",
      diseased: "रोगग्रस्त",
      unknown: "अज्ञात",
    },
    status: {
      growing: "बढ़ रहा है",
      harvested: "कटाई हो चुकी है",
      ready: "तैयार",
    },
  },
  as: {
    fallbackName: "খেতি সহায়ক",
    male: "পুৰুষ",
    female: "মহিলা",
    years: "বছৰ",
    loading: "লোড হৈ আছে...",
    loadingProfileData: "প্ৰ'ফাইল ডাটা লোড হৈ আছে...",
    loadingSlow: "আশাতকৈ বেছি সময় লাগিছে। অনুগ্ৰহ কৰি ইণ্টাৰনেট সংযোগ পৰীক্ষা কৰক।",
    logoutConfirm: "আপুনি সঁচাকৈ লগআউট কৰিব বিচাৰে নেকি?",
    sections: {
      crops: "মোৰ শস্যসমূহ",
      disasterHistory: "দুৰ্যোগ ইতিহাস",
      scanHistory: "স্কেন ইতিহাস",
    },
    disasterLocationLabel: "অৱস্থান",
    disasterLocationPlaceholder: "অৱস্থান লিখক",
    disasterLocationHint: "যোৱা এবছৰৰ দুৰ্যোগ ঘটনাবোৰ চাবলৈ অৱস্থান লিখক।",
    loadingDisasterHistory: "দুৰ্যোগ ঘটনাবোৰ লোড হৈ আছে...",
    disasterPastYearSummary: "যোৱা এবছৰত {location}ৰ বাবে {count}টা দুৰ্যোগ ঘটনা",
    noDisasterHistoryForLocation: "যোৱা এবছৰত {location}ৰ বাবে কোনো দুৰ্যোগ ঘটনা পোৱা নগ'ল",
    noDisasterHistory: "এতিয়ালৈ কোনো দুৰ্যোগ ঘটনা পোৱা নগ'ল",
    seeMoreDisasterEvents: "আৰু চাওক",
    showLessDisasterEvents: "কম দেখুৱাওক",
    noCrops: "এতিয়ালৈ কোনো শস্য যোগ কৰা হোৱা নাই",
    noScans: "এতিয়ালৈ কোনো স্কেন ইতিহাস নাই",
    addFirstCrop: "প্ৰথম শস্য যোগ কৰক",
    addNewCrop: "নতুন শস্য যোগ কৰক",
    editCrop: "সম্পাদনা কৰক",
    monitorCrop: "দৈনিক নজৰদাৰী",
    deleteCrop: "মচক",
    deleteCropConfirm: "{crop} মচি পেলাবনে?",
    deleteCropFailed: "শস্য মচিব নোৱাৰি। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
    firstScan: "প্ৰথম স্কেন আৰম্ভ কৰক",
    deleteScan: "মচক",
    deleteScanConfirm: "এই স্কেন ইতিহাসটো মচি পেলাবনে?",
    deleteScanFailed: "স্কেন ইতিহাস মচিব নোৱাৰি। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
    clearHistory: "সকলো মচক",
    clearHistoryConfirm: "সম্পূৰ্ণ স্কেন ইতিহাস মচি পেলাবনে?",
    clearHistoryFailed: "স্কেন ইতিহাস খালী কৰিব নোৱাৰি। অনুগ্ৰহ কৰি পুনৰ চেষ্টা কৰক।",
    lastChecked: "শেষ পৰীক্ষা",
    noMonitoringYet: "এতিয়ালৈ কোনো দৈনিক স্বাস্থ্য পৰীক্ষা নাই",
    sourceLabel: "উৎস",
    visionSource: "Google Cloud Vision AI",
    fallbackSource: "ফলবেক স্কেন",
    unconfirmedMonitoring: "অৱস্থা নিশ্চিত নহ'ল",
    unconfirmedScan: "নিশ্চিত নহ'ল",
    health: {
      healthy: "সুস্থ",
      stressed: "চাপত",
      diseased: "ৰোগাক্ৰান্ত",
      unknown: "অজ্ঞাত",
    },
    status: {
      growing: "বাঢ়ি আছে",
      harvested: "কাটি লোৱা হৈছে",
      ready: "প্ৰস্তুত",
    },
  },
};

const parseStoredDate = (value: any) => {
  if (value && typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const normalizeLocationText = (value: string) => {
  return String(value || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { language } = useLanguage();
  const t = STRINGS[language];
  const [profile, setProfile] = useState<any>(null);
  const [myCrops, setMyCrops] = useState<any[]>([]);
  const [disasterEvents, setDisasterEvents] = useState<DisasterEvent[]>([]);
  const [disasterEventsLoading, setDisasterEventsLoading] = useState(false);
  const [disasterLocationFilter, setDisasterLocationFilter] = useState("");
  const [hasEditedDisasterLocation, setHasEditedDisasterLocation] = useState(false);
  const [showAllDisasterEvents, setShowAllDisasterEvents] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeoutReached, setTimeoutReached] = useState(false);

  const getSexLabel = (sex?: string) => {
    if (sex === "male") return t.male;
    if (sex === "female") return t.female;
    return "";
  };

  const getCropName = (crop: any) => {
    if (!crop) return "";
    if (language === "hi") return crop.name || crop.nameHi || crop.nameEn || crop.nameAs || "";
    if (language === "as") return crop.nameAs || crop.nameEn || crop.name || crop.nameHi || "";
    return crop.nameEn || crop.name || crop.nameAs || crop.nameHi || "";
  };

  const getStatusLabel = (crop: any) => {
    if (!crop) return "";
    const statusKey = typeof crop.status === "string" ? crop.status.toLowerCase() : "";
    if (language === "hi") return crop.statusHi || t.status[statusKey] || crop.status || "";
    if (language === "as") return crop.statusAs || t.status[statusKey] || crop.statusEn || crop.status || crop.statusHi || "";
    return crop.statusEn || t.status[statusKey] || crop.status || crop.statusHi || "";
  };

  const getHealthLabel = (status?: string) => {
    switch (status) {
      case "healthy":
        return t.health.healthy;
      case "stressed":
        return t.health.stressed;
      case "diseased":
        return t.health.diseased;
      default:
        return t.health.unknown;
    }
  };

  const getScanName = (scan: any) => {
    if (!scan) return "";
    if (language === "hi") return scan.cropHi || scan.diseaseHi || scan.crop || scan.cropEn || scan.disease || "";
    if (language === "as") return scan.cropAs || scan.cropEn || scan.disease || scan.cropHi || scan.diseaseHi || scan.crop || "";
    return scan.cropEn || scan.disease || scan.crop || scan.cropHi || scan.diseaseHi || "";
  };

  const handleEditCrop = (crop: any) => {
    const cropId = crop?.id ? `?cropId=${encodeURIComponent(String(crop.id))}` : "";
    navigate(`/add-crop${cropId}`, { state: { crop } });
  };

  const handleMonitorCrop = (crop: any) => {
    const cropId = crop?.id ? `?cropId=${encodeURIComponent(String(crop.id))}` : "";
    navigate(`/scan${cropId}`, { state: { crop } });
  };

  const handleDeleteCrop = async (crop: any) => {
    if (!user?.uid || !crop?.id) {
      return;
    }

    const cropName = getCropName(crop) || crop?.nameEn || crop?.name || "crop";
    if (!confirm(t.deleteCropConfirm.replace("{crop}", cropName))) {
      return;
    }

    try {
      await deleteCrop(user.uid, String(crop.id));
      setMyCrops((current) => current.filter((item) => String(item?.id || "") !== String(crop.id)));
    } catch (error) {
      console.error("Error deleting crop:", error);
      alert(t.deleteCropFailed);
    }
  };

  const handleDeleteScan = async (scan: any) => {
    if (!user?.uid || !scan?.id) {
      return;
    }

    if (!confirm(t.deleteScanConfirm)) {
      return;
    }

    try {
      await deleteScanResult(user.uid, String(scan.id));
      setScanHistory((current) => current.filter((item) => String(item?.id || "") !== String(scan.id)));
    } catch (error) {
      console.error("Error deleting scan history:", error);
      alert(t.deleteScanFailed);
    }
  };

  const handleClearHistory = async () => {
    if (!user?.uid || scanHistory.length === 0) {
      return;
    }

    if (!confirm(t.clearHistoryConfirm)) {
      return;
    }

    try {
      await clearUserScanHistory(user.uid);
      setScanHistory([]);
    } catch (error) {
      console.error("Error clearing scan history:", error);
      alert(t.clearHistoryFailed);
    }
  };

  const getMonitoringDiseaseLabel = (crop: any) => {
    if (!crop) return "";
    if (language === "hi") return crop.lastMonitoringDiseaseHi || crop.lastMonitoringDisease || "";
    if (language === "as") return crop.lastMonitoringDisease || crop.lastMonitoringDiseaseHi || "";
    return crop.lastMonitoringDisease || crop.lastMonitoringDiseaseHi || "";
  };

  const getMonitoringSourceLabel = (source?: string) => {
    if (source === "vision") return t.visionSource;
    if (source) return t.fallbackSource;
    return "";
  };

  const isUnconfirmedFallbackValue = (value?: string) => {
    const normalized = String(value || "").trim().toLowerCase();
    return normalized === "unknown" || normalized === "condition not confirmed" || normalized === "अज्ञात" || normalized === "स्थिति की पुष्टि नहीं हुई" || normalized === "অৱস্থা নিশ্চিত নহ'ল";
  };

  const isUnconfirmedMonitoring = (crop: any) => {
    return crop?.lastMonitoringSource === "fallback"
      && (
        crop?.lastMonitoringResult === "unknown"
        || isUnconfirmedFallbackValue(crop?.lastMonitoringDisease)
        || Number(crop?.lastMonitoringConfidence || 0) <= 0
      );
  };

  const isUnconfirmedScan = (scan: any) => {
    return scan?.source === "fallback"
      && (
        scan?.result === "unknown"
        || isUnconfirmedFallbackValue(scan?.disease)
        || Number(scan?.confidence || 0) <= 0
      );
  };

  const getMonitoringDisplay = (crop: any) => {
    if (isUnconfirmedMonitoring(crop)) {
      return t.unconfirmedMonitoring;
    }

    return `${getMonitoringDiseaseLabel(crop)} • ${crop.lastMonitoringConfidence || 0}%`;
  };

  const getScanConfidenceDisplay = (scan: any) => {
    return isUnconfirmedScan(scan) ? t.unconfirmedScan : `${scan.confidence}%`;
  };

  const formatDisasterTimestamp = (value: any) => {
    const parsed = parseStoredDate(value);
    if (!parsed) {
      return "";
    }

    return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed);
  };

  const hasDisasterLocationFilter = disasterLocationFilter.trim().length > 0;
  const disasterLocationDisplay = disasterLocationFilter.trim();
  const savedProfileLocation = String(profile?.location || "").trim();
  const shouldUseProfileCoordinates = hasValidCoordinates(profile?.coordinates)
    && normalizeLocationText(disasterLocationDisplay) === normalizeLocationText(savedProfileLocation);

  const getDisasterEventMeta = (event: DisasterEvent) => {
    return [
      event.categoryLabels.join(", "),
      event.magnitudeLabel,
      event.sourceIds.length > 0 ? `${t.sourceLabel}: ${event.sourceIds.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" • ");
  };

  const disasterSummaryText = hasDisasterLocationFilter
    ? disasterEventsLoading
      ? t.loadingDisasterHistory
      : t.disasterPastYearSummary
          .replace("{count}", String(disasterEvents.length))
          .replace("{location}", disasterLocationDisplay)
    : t.disasterLocationHint;

  const disasterEmptyStateText = hasDisasterLocationFilter
    ? t.noDisasterHistoryForLocation.replace("{location}", disasterLocationDisplay)
    : t.disasterLocationHint;
  const visibleDisasterEvents = showAllDisasterEvents
    ? disasterEvents
    : disasterEvents.slice(0, INITIAL_VISIBLE_DISASTER_EVENTS);
  const hasHiddenDisasterEvents = disasterEvents.length > INITIAL_VISIBLE_DISASTER_EVENTS;

  useEffect(() => {
    if (!hasEditedDisasterLocation) {
      setDisasterLocationFilter(String(profile?.location || ""));
    }
  }, [profile?.location, hasEditedDisasterLocation]);

  useEffect(() => {
    setShowAllDisasterEvents(false);

    if (!hasDisasterLocationFilter) {
      setDisasterEvents([]);
      setDisasterEventsLoading(false);
      return;
    }

    let cancelled = false;
    setDisasterEventsLoading(true);

    const request = {
      location: disasterLocationDisplay,
      ...(shouldUseProfileCoordinates ? { coordinates: profile.coordinates } : {}),
    };

    void getDisasterEventsForLocation(request)
      .then((events) => {
        if (!cancelled) {
          setDisasterEvents(events);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDisasterEvents([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDisasterEventsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [disasterLocationDisplay, hasDisasterLocationFilter, profile?.coordinates, shouldUseProfileCoordinates]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) {
        console.log('No user UID found');
        setLoading(false);
        return;
      }
      
      let shouldRedirectToSetup = false;

      try {
        console.log('Fetching data for user:', user.uid);
        setLoading(true);
        
        const userProfile = await getUserProfile(user.uid);
        console.log('User profile:', userProfile);
        setProfile(userProfile);
        shouldRedirectToSetup = !userProfile;
        
        const crops = await getUserCrops(user.uid);
        console.log('User crops:', crops);
        setMyCrops(crops || []);
        
        const scans = await getUserScanHistory(user.uid);
        console.log('User scans:', scans);
        setScanHistory(scans || []);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        // Set empty data on error to prevent infinite loading
        setProfile(null);
        setMyCrops([]);
        setDisasterEvents([]);
        setScanHistory([]);
      } finally {
        setLoading(false);
        
        // Redirect to profile setup if no profile exists
        if (shouldRedirectToSetup && user?.uid) {
          console.log('No profile found, redirecting to setup');
          navigate('/profile-setup');
        }
      }
    };

    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Loading timeout reached, showing profile anyway');
        setLoading(false);
        setTimeoutReached(true);
      }
    }, 5000); // 5 seconds timeout

    const handleRefresh = () => {
      void fetchData();
    };

    void fetchData();
    window.addEventListener(VOICE_COMMAND_CROPS_UPDATED_EVENT, handleRefresh);
    
    return () => {
      clearTimeout(timeout);
      window.removeEventListener(VOICE_COMMAND_CROPS_UPDATED_EVENT, handleRefresh);
    };
  }, [navigate, user?.uid]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {timeoutReached ? t.loadingProfileData : t.loading}
          </p>
          {timeoutReached && (
            <p className="text-xs text-muted-foreground mt-2">
              {t.loadingSlow}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-primary text-primary-foreground px-4 pt-10 pb-6 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="mb-3">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {getCropName(profile) || profile?.name || profile?.nameEn || t.fallbackName}
              </h1>
              <p className="text-sm opacity-90">
                {profile?.age ? `${profile.age} ${t.years}` : ""}
                {profile?.sex && profile?.age ? " • " : ""}
                {getSexLabel(profile?.sex)}
              </p>
              <div className="flex items-center gap-1 text-xs opacity-80 mt-0.5">
                <Mail className="w-3 h-3" />
                <span>{user?.email || 'email@example.com'}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-primary-foreground" onClick={() => navigate('/profile-setup')}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground"
              onClick={async () => {
                if (confirm(t.logoutConfirm)) {
                  await logout();
                  navigate('/login');
                }
              }}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-5 space-y-5">
        {/* My Crops */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Sprout className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{t.sections.crops}</h2>
          </div>
          <div className="space-y-2">
            {myCrops.length === 0 ? (
              <Card className="border border-border">
                <CardContent className="p-4 text-center">
                  <Sprout className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t.noCrops}</p>
                  <Button 
                    className="mt-3" 
                    size="sm"
                    onClick={() => navigate('/add-crop')}
                  >
                    <Leaf className="w-4 h-4 mr-2" />
                    {t.addFirstCrop}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              myCrops.map((crop) => (
                <Card key={crop.id || crop.nameEn} className="border border-border">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{crop.emoji || '🌾'}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">{getCropName(crop)}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            crop.health === "healthy" ? "bg-success/10 text-success" :
                            crop.health === "stressed" ? "bg-warning/10 text-warning" :
                            crop.health === "diseased" ? "bg-destructive/10 text-destructive" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {getHealthLabel(crop.health)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{getStatusLabel(crop)}</p>
                        <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all"
                            style={{ width: `${crop.progress}%` }}
                          />
                        </div>
                        <div className="mt-2 rounded-lg bg-muted/40 p-2 space-y-1">
                          <p className="text-[11px] text-muted-foreground">
                            {crop.lastMonitoringDate
                              ? `${t.lastChecked}: ${crop.lastMonitoringDate}`
                              : t.noMonitoringYet}
                          </p>
                          {(crop.lastMonitoringDisease || isUnconfirmedMonitoring(crop)) && (
                            <p className="text-xs text-foreground">
                              {getMonitoringDisplay(crop)}
                            </p>
                          )}
                          {crop.lastMonitoringSource && (
                            <p className="text-[11px] text-muted-foreground">
                              {t.sourceLabel}: {getMonitoringSourceLabel(crop.lastMonitoringSource)}
                            </p>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap justify-end gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleMonitorCrop(crop)}
                          >
                            <ScanLine className="w-3.5 h-3.5 mr-1" />
                            {t.monitorCrop}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleEditCrop(crop)}
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            {t.editCrop}
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="h-8 px-2 text-xs"
                            onClick={() => handleDeleteCrop(crop)}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            {t.deleteCrop}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          <Button 
            className="w-full mt-3"
            onClick={() => navigate('/add-crop')}
          >
            <Leaf className="w-4 h-4 mr-2" />
            {t.addNewCrop}
          </Button>
        </div>

        {/* Disaster History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{t.sections.disasterHistory}</h2>
          </div>
          <div className="mb-3 space-y-2">
            <label htmlFor="disaster-location-filter" className="text-sm font-medium text-foreground">
              {t.disasterLocationLabel}
            </label>
            <Input
              id="disaster-location-filter"
              value={disasterLocationFilter}
              onChange={(event) => {
                setHasEditedDisasterLocation(true);
                setDisasterLocationFilter(event.target.value);
              }}
              placeholder={t.disasterLocationPlaceholder}
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">{disasterSummaryText}</p>
          </div>
          <div className="space-y-2">
            {disasterEventsLoading ? (
              <Card className="border border-border">
                <CardContent className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-3"></div>
                  <p className="text-sm text-muted-foreground">{t.loadingDisasterHistory}</p>
                </CardContent>
              </Card>
            ) : disasterEvents.length === 0 ? (
              <Card className="border border-border">
                <CardContent className="p-4 text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{disasterEmptyStateText}</p>
                </CardContent>
              </Card>
            ) : (
              visibleDisasterEvents.map((entry, index) => {
                const formattedTime = formatDisasterTimestamp(entry.date);
                const metadata = getDisasterEventMeta(entry);

                return (
                  <Card key={entry.id || index} className="border border-border">
                    <CardContent className="p-3">
                      <p className="text-sm font-medium text-foreground">{entry.title}</p>
                      {metadata ? (
                        <p className="mt-1 text-xs text-muted-foreground">{metadata}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-muted-foreground">{entry.location}</p>
                      {entry.description ? (
                        <p className="mt-1 text-xs text-foreground/80">{entry.description}</p>
                      ) : null}
                      {formattedTime ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">{formattedTime}</p>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })
            )}
            {!disasterEventsLoading && hasHiddenDisasterEvents ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setShowAllDisasterEvents((current) => !current)}
              >
                {showAllDisasterEvents ? t.showLessDisasterEvents : t.seeMoreDisasterEvents}
              </Button>
            ) : null}
          </div>
        </div>

        {/* Scan History */}
        <div>
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <h2 className="font-semibold text-foreground">{t.sections.scanHistory}</h2>
            </div>
            {scanHistory.length > 0 && (
              <Button type="button" size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={handleClearHistory}>
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {t.clearHistory}
              </Button>
            )}
          </div>
          <div className="space-y-2">
            {scanHistory.length === 0 ? (
              <Card className="border border-border">
                <CardContent className="p-4 text-center">
                  <History className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">{t.noScans}</p>
                  <Button 
                    className="mt-3" 
                    size="sm"
                    onClick={() => navigate('/scan')}
                  >
                    {t.firstScan}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              scanHistory.map((scan, i) => (
                <Card key={scan.id || i} className="border border-border">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-foreground">{getScanName(scan)}</p>
                      <p className="text-xs text-muted-foreground">{scan.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold ${
                        isUnconfirmedScan(scan)
                          ? "text-muted-foreground"
                          : scan.result === "healthy"
                            ? "text-success"
                            : scan.result === "stressed"
                              ? "text-warning"
                              : "text-destructive"
                      }`}>
                        {getScanConfidenceDisplay(scan)}
                      </span>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteScan(scan)}
                        aria-label={t.deleteScan}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
