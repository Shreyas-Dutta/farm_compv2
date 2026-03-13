import WeatherWidget from "@/components/WeatherWidget";
import CropCarousel from "@/components/CropCarousel";
import QuickActions from "@/components/QuickActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScanLine, Leaf, MapPin, ExternalLink, AlertTriangle, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/useAuth";
import { addDisasterAlertHistory, getUserProfile } from "@/lib/database";
import { getSoilInsights, type SoilInsights, type SoilMetric, type WeatherData } from "@/lib/api";
import { CROP_CATALOG } from "@/lib/cropSuitability";
import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "farm-companion-profile";

const LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
};

const parseStoredDate = (value: any) => {
  if (value && typeof value === "object" && typeof value.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const hasCoordinates = (coordinates?: { lat?: number; lng?: number } | null): coordinates is { lat: number; lng: number } => {
  return Boolean(
    coordinates &&
      Number.isFinite(coordinates.lat) &&
      Number.isFinite(coordinates.lng) &&
      !(coordinates.lat === 0 && coordinates.lng === 0)
  );
};

const formatSoilMetric = (metric: SoilMetric) => {
  if (!Number.isFinite(metric.value)) {
    return null;
  }

  const rounded = Math.round((metric.value as number) * 10) / 10;
  const value = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  const unit = metric.unit && metric.unit !== "-" ? ` ${metric.unit}` : "";
  return `${metric.label}: ${value}${unit}`;
};

const formatCropValue = (value: string) => {
  const normalized = value.replace(/-/g, " ").trim();
  return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : value;
};

const getRecommendedCropMeta = (crop: string, language: SupportedLanguage) => {
  const match = CROP_CATALOG.find((item) => item.value === crop);
  return {
    label: match?.label[language] || formatCropValue(crop),
    emoji: match?.emoji || "🌱",
  };
};

// Google Maps Component
const LocationDisplay = ({ location, coordinates }: { location?: string; coordinates?: { lat: number; lng: number } }) => {
  const { language } = useLanguage();
  if (!location) return null;

  const LOCATION_STRINGS = {
    en: { viewOnMaps: "View on Google Maps" },
    hi: { viewOnMaps: "Google Maps पर देखें" },
    as: { viewOnMaps: "Google Maps ত চাওক" },
  };

  const mapUrl = coordinates 
    ? `https://maps.google.com/maps?q=${coordinates.lat},${coordinates.lng}&z=15`
    : `https://maps.google.com/maps?q=${encodeURIComponent(location)}`;

  return (
    <div className="flex items-center gap-2 text-xs opacity-90 mt-2 group">
      <MapPin className="w-3 h-3 text-primary-foreground" />
      <div className="flex-1">
        <span className="text-primary-foreground/80">{location}</span>
        <a 
          href={mapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 text-primary-foreground/60 hover:text-primary-foreground/80 transition-colors inline-flex items-center gap-1"
          title={LOCATION_STRINGS[language].viewOnMaps}
        >
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [soilInsights, setSoilInsights] = useState<SoilInsights | null>(null);
  const [soilLoading, setSoilLoading] = useState(false);
  const [currentDisasterAlert, setCurrentDisasterAlert] = useState<{
    message: string;
    location: string;
    createdAt: string;
  } | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const loadSavedProfile = () => {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (!saved) return;

          const parsed = JSON.parse(saved);
          setUserProfile(parsed);
        } catch (storageError) {
          console.error('Error reading local profile:', storageError);
        }
      };

      if (user?.uid) {
        try {
          const profile = await getUserProfile(user.uid);

          if (profile) {
            setUserProfile(profile);
            return;
          }

          loadSavedProfile();
        } catch (error) {
          console.error('Error fetching user profile:', error);
          loadSavedProfile();
        }
      } else {
        loadSavedProfile();
      }
    };

    fetchUserProfile();
  }, [user]);

  const STRINGS: Record<SupportedLanguage, {
    title: string;
    subtitle: string;
    scanButton: string;
    tipTitle: string;
    tipText: string;
    soilTitle: string;
    soilLoading: string;
    soilFallbackNotice: string;
    soilRecommendations: string;
    soilSourceLabel: string;
    disasterAlertTitle: string;
    noDisasterAlert: string;
    viewAlertHistory: string;
    welcomeLocation: string;
    locationPlaceholder: string;
    soilSources: {
      soilgrids: string;
      fallback: string;
    };
  }> = {
    en: {
      title: "AgriNova",
      subtitle: "AgriNova — Your Smart Farming Companion",
      scanButton: "Check Crop Health",
      tipTitle: "💡 Today's Tip",
      tipText: "Wheat sowing requires 50-60% soil moisture. Timely irrigation can boost yield by 20%.",
      soilTitle: "🌱 Soil advisory",
      soilLoading: "Loading soil data for your location...",
      soilFallbackNotice: "Live soil service is temporarily unavailable. Showing fallback soil guidance.",
      soilRecommendations: "2 recommended crops",
      soilSourceLabel: "Advisory source",
      disasterAlertTitle: "Disaster alert",
      noDisasterAlert: "No active disaster alert right now.",
      viewAlertHistory: "View history",
      welcomeLocation: "Welcome from {location}",
      locationPlaceholder: "Detecting location...",
      soilSources: {
        soilgrids: "SoilGrids-based advisory",
        fallback: "Fallback soil guidance",
      },
    },
    hi: {
      title: "एग्रीनोवा",
      subtitle: "AgriNova — आपका स्मार्ट फार्मिंग साथी",
      scanButton: "फसल स्वास्थ्य जांचें",
      tipTitle: "💡 आज का सुझाव",
      tipText: "गेहूं की बुवाई के लिए 50-60% मिट्टी की नमी होनी चाहिए। समय पर सिंचाई सिंचाई से 20% तक बढ़ सकती है।",
      soilTitle: "🌱 मिट्टी सलाह",
      soilLoading: "आपके स्थान के लिए मिट्टी डेटा लोड हो रहा है...",
      soilFallbackNotice: "लाइव मिट्टी सेवा अभी उपलब्ध नहीं है। फिलहाल वैकल्पिक मिट्टी मार्गदर्शन दिखाया जा रहा है।",
      soilRecommendations: "2 सुझाई गई फसलें",
      soilSourceLabel: "सलाह का स्रोत",
      disasterAlertTitle: "आपदा चेतावनी",
      noDisasterAlert: "अभी कोई सक्रिय आपदा चेतावनी नहीं है।",
      viewAlertHistory: "इतिहास देखें",
      welcomeLocation: "{location} से आपका स्वागत है",
      locationPlaceholder: "स्थान का पता लगा रहा है...",
      soilSources: {
        soilgrids: "SoilGrids आधारित सलाह",
        fallback: "वैकल्पिक मिट्टी मार्गदर्शन",
      },
    },
    as: {
      title: "এগ্রিনোভা",
      subtitle: "AgriNova — আপোনাৰ স্মার্ট ফাৰ্মিংগ সঙ্গী",
      scanButton: "শস্য স্বাস্থ্য পৰীক্ষা কৰক",
      tipTitle: "💡 আজৰ পৰাম",
      tipText: "গমৰ ৰোপণ কৰোতে মাটিৰ আদ্ৰতা 50-60% নমী হব ললাগা চাইয়। সময় সময় সিংচাইসে 20% পৰ্যন্ত বঢ়াব পাৰি।",
      soilTitle: "🌱 মাটিৰ পৰামৰ্শ",
      soilLoading: "আপোনাৰ স্থানৰ বাবে মাটিৰ তথ্য লোড হৈ আছে...",
      soilFallbackNotice: "লাইভ মাটিৰ সেৱা এতিয়া উপলব্ধ নহয়। এতিয়াৰ বাবে বিকল্প মাটিৰ দিশনিৰ্দেশ দেখুওৱা হৈছে।",
      soilRecommendations: "2 টা পৰামৰ্শ দিয়া শস্য",
      soilSourceLabel: "পৰামৰ্শৰ উৎস",
      disasterAlertTitle: "দুৰ্যোগ সতৰ্কতা",
      noDisasterAlert: "এই মুহূর্তত কোনো সক্ৰিয় দুৰ্যোগ সতৰ্কতা নাই।",
      viewAlertHistory: "ইতিহাস চাওক",
      welcomeLocation: "{location} থেকে আপোনাৰ স্বাস্থ্য পৰীক্ষা কৰক",
      locationPlaceholder: "স্থানৰ পৰাত পাওয় হব লাগা চাইট...",
      soilSources: {
        soilgrids: "SoilGrids ভিত্তিক পৰামৰ্শ",
        fallback: "বিকল্প মাটিৰ দিশনিৰ্দেশ",
      },
    },
  };

  const t = STRINGS[language];
  const userCoordinates = hasCoordinates(userProfile?.coordinates) ? userProfile.coordinates : undefined;

  const formatDisasterTimestamp = (value: any) => {
    const parsed = parseStoredDate(value);
    if (!parsed) {
      return "";
    }

    return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }).format(parsed);
  };

  const handleWeatherLoaded = useCallback(async (weatherData: WeatherData) => {
    if (weatherData.alert) {
      setCurrentDisasterAlert({
        message: weatherData.alert,
        location: weatherData.location,
        createdAt: new Date().toISOString(),
      });
    } else {
      setCurrentDisasterAlert(null);
    }

    if (!user?.uid || !weatherData.alert) {
      return;
    }

    await addDisasterAlertHistory(user.uid, {
      message: weatherData.alert,
      location: weatherData.location,
      condition: weatherData.condition,
      temperature: weatherData.temp,
    });
  }, [user?.uid]);

  useEffect(() => {
    let isMounted = true;

    const fetchSoilData = async () => {
      if (!userProfile?.location && !userCoordinates) {
        if (isMounted) {
          setSoilInsights(null);
          setSoilLoading(false);
        }
        return;
      }

      if (isMounted) {
        setSoilLoading(true);
      }

      try {
        const result = await getSoilInsights({
          location: userProfile?.location,
          coordinates: userCoordinates,
          language,
        });

        if (isMounted) {
          setSoilInsights(result);
        }
      } finally {
        if (isMounted) {
          setSoilLoading(false);
        }
      }
    };

    void fetchSoilData();

    return () => {
      isMounted = false;
    };
  }, [language, userProfile?.location, userCoordinates?.lat, userCoordinates?.lng]);

  // Get display location
  const displayLocation = userProfile?.location || t.locationPlaceholder;
  const currentDisasterTimestamp = currentDisasterAlert
    ? formatDisasterTimestamp(currentDisasterAlert.createdAt)
    : "";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 pt-10 pb-6 rounded-b-3xl">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Leaf className="w-6 h-6" />
            <h1 className="text-xl font-bold">{t.title}</h1>
          </div>
          <p className="text-xs opacity-80">{t.subtitle}</p>

          {/* User Location Display */}
          <LocationDisplay 
            location={displayLocation} 
            coordinates={userCoordinates} 
          />

          <div className="mt-5">
            <Button
              onClick={() => navigate("/scan")}
              size="lg"
              className="w-full bg-card text-primary hover:bg-card/90 font-semibold rounded-xl shadow-lg"
            >
              <ScanLine className="w-5 h-5 mr-2" />
              <span>{t.scanButton}</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 space-y-6 mt-5">
        <WeatherWidget
          userLocation={userProfile?.location}
          userCoordinates={userCoordinates}
          onWeatherLoaded={handleWeatherLoaded}
        />

        <Card className="border border-border bg-card">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" />
                <h3 className="text-sm font-semibold">{t.disasterAlertTitle}</h3>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => navigate("/profile")}>
                {t.viewAlertHistory}
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {!currentDisasterAlert ? (
              <p className="text-sm text-muted-foreground">{t.noDisasterAlert}</p>
            ) : (
              <div className="rounded-lg bg-secondary/40 p-3">
                <p className="text-sm font-medium text-foreground">{currentDisasterAlert.message}</p>
                <p className="mt-1 text-xs text-muted-foreground">{currentDisasterAlert.location}</p>
                {currentDisasterTimestamp ? (
                  <p className="mt-1 text-[11px] text-muted-foreground">{currentDisasterTimestamp}</p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>

        {soilLoading ? (
          <Card className="border border-border">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold">{t.soilTitle}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t.soilLoading}</p>
            </CardContent>
          </Card>
        ) : soilInsights ? (
          <Card className="border border-border bg-card">
            <CardContent className="p-4 space-y-3">
              {soilInsights.source === "fallback" ? (
                <div
                  role="status"
                  className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <p>{t.soilFallbackNotice}</p>
                </div>
              ) : null}

              <div>
                <h3 className="text-sm font-semibold">{t.soilTitle}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{soilInsights.summary}</p>
                <p className="mt-2 text-sm leading-6">{soilInsights.advisory}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  soilInsights.metrics.ph,
                  soilInsights.metrics.clay,
                  soilInsights.metrics.sand,
                  soilInsights.metrics.cec,
                ]
                  .map(formatSoilMetric)
                  .filter(Boolean)
                  .map((metricText) => (
                    <span key={metricText} className="rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">
                      {metricText}
                    </span>
                  ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.soilRecommendations}</p>
                {soilInsights.recommendedCrops.slice(0, 2).map((recommendation, index) => {
                  const cropMeta = getRecommendedCropMeta(recommendation.crop, language);

                  return (
                  <div key={`${recommendation.crop}-${index}`} className="rounded-lg bg-secondary/40 p-3">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <span aria-hidden="true">{cropMeta.emoji}</span>
                      <span>{index + 1}. {cropMeta.label}</span>
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{recommendation.reason}</p>
                  </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                {t.soilSourceLabel}: {t.soilSources[soilInsights.source]}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <QuickActions />
        <CropCarousel />

        {/* Tip of the Day */}
        <div className="bg-secondary rounded-xl p-4">
          <h3 className="text-sm font-semibold text-secondary-foreground font-hindi mb-1">
            {t.tipTitle}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t.tipText}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
