import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Minus, Search, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  getLocalizedMarketCommodityLabel,
  getMarketPrices,
  getNearbyMarketPlaces,
  hasValidCoordinates,
  type NearbyMarketDiscoveryResult,
} from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { getUserCrops, getUserProfile } from "@/lib/database";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";
import {
  CROP_CATALOG,
  formatRegionLabel,
  getStateFromMarket,
  type CropCatalogItem,
} from "@/lib/cropSuitability";

const STORAGE_KEY = "farm-companion-profile";

const STRINGS: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  userCropsTitle: string;
  userCropsLoading: string;
  userCropsReady: string;
  userCropsEmpty: string;
  userCropsNoMatches: string;
  addCropAction: string;
  searchPlaceholder: string;
  perUnit: string;
  updatedDaily: string;
  noResults: string;
  allStates: string;
  loadingPrices: string;
  sortedForLocation: string;
  sortedForCoordinates: string;
  addLocationHint: string;
    priceSectionTitle: string;
  nearbyMarketsTitle: string;
  nearbyMarketsLoading: string;
    nearbyMarketsEmpty: string;
  livePrice: string;
  openInMaps: string;
  source: string;
  sourceGoogle: string;
  sourceFallback: string;
}> = {
  en: {
    title: "My Crop Market",
    subtitle: "Prices and nearby buying options for the crops you added, using the same live market flow",
    userCropsTitle: "Your crops in this market view",
    userCropsLoading: "Loading your added crops...",
    userCropsReady: "Showing only crops you have added to your farm.",
    userCropsEmpty: "Add crops to your profile to see only those market prices here.",
    userCropsNoMatches: "No current market prices matched your added crops yet.",
    addCropAction: "Add Crop",
    searchPlaceholder: "Search your crop or market...",
    perUnit: "per",
    updatedDaily: "Prices updated daily",
    noResults: "No prices for your added crops match your search or state filter.",
    allStates: "All States",
    loadingPrices: "Loading market prices...",
    sortedForLocation: "Showing prices and nearby buy options for the crops you added near {region}.",
    sortedForCoordinates: "Showing prices for the crops you added with nearby suggestions from your saved coordinates.",
    addLocationHint: "Add your location in profile to get nearby buying options for the crops you added.",
    priceSectionTitle: "Current prices for your crops",
    nearbyMarketsTitle: "Where to buy nearby",
    nearbyMarketsLoading: "Finding market places near you...",
    nearbyMarketsEmpty: "No nearby buying options could be matched to your current crop prices yet.",
    livePrice: "Live price",
    openInMaps: "Open in Google Maps",
    source: "Source",
    sourceGoogle: "Google Maps",
    sourceFallback: "Price fallback",
  },
  hi: {
    title: "मेरी फसल मंडी",
    subtitle: "आपके जोड़े गए फसलों के भाव और आसपास खरीद विकल्प, उसी लाइव मार्केट फ्लो से",
    userCropsTitle: "इस मार्केट व्यू में आपकी फसलें",
    userCropsLoading: "आपकी जोड़ी गई फसलें लोड की जा रही हैं...",
    userCropsReady: "यहां केवल आपकी जोड़ी गई फसलें दिखाई जा रही हैं।",
    userCropsEmpty: "यहां केवल अपनी फसलें देखने के लिए प्रोफ़ाइल में फसल जोड़ें।",
    userCropsNoMatches: "अभी आपकी जोड़ी गई फसलों के लिए कोई मौजूदा मंडी भाव नहीं मिला।",
    addCropAction: "फसल जोड़ें",
    searchPlaceholder: "अपनी फसल या मंडी खोजें...",
    perUnit: "प्रति",
    updatedDaily: "भाव प्रतिदिन अपडेट होते हैं",
    noResults: "आपकी खोज या राज्य फ़िल्टर से आपकी फसलों का कोई भाव नहीं मिला।",
    allStates: "सभी राज्य",
    loadingPrices: "मंडी भाव लोड किए जा रहे हैं...",
    sortedForLocation: "{region} के पास आपकी जोड़ी गई फसलों के भाव और खरीद विकल्प दिखाए जा रहे हैं।",
    sortedForCoordinates: "सहेजे गए निर्देशांकों के आधार पर आपकी जोड़ी गई फसलों के भाव और नज़दीकी सुझाव दिखाए जा रहे हैं।",
    addLocationHint: "अपनी जोड़ी गई फसलों के लिए नज़दीकी खरीद विकल्प देखने के लिए प्रोफ़ाइल में स्थान जोड़ें।",
    priceSectionTitle: "आपकी फसलों के वर्तमान भाव",
    nearbyMarketsTitle: "आसपास कहां खरीदें",
    nearbyMarketsLoading: "आपके आसपास की मंडियां खोजी जा रही हैं...",
    nearbyMarketsEmpty: "आपकी वर्तमान फसल कीमतों के लिए नज़दीकी खरीद विकल्प नहीं मिल सके।",
    livePrice: "लाइव भाव",
    openInMaps: "Google Maps में खोलें",
    source: "स्रोत",
    sourceGoogle: "Google Maps",
    sourceFallback: "भाव फ़ॉलबैक",
  },
  as: {
    title: "মোৰ শস্য বজাৰ",
    subtitle: "আপুনি যোগ কৰা শস্যৰ দাম আৰু ওচৰৰ কিনাৰ বিকল্প, একেই লাইভ মার্কেট ফ্ল'ৰে",
    userCropsTitle: "এই বজাৰ দৃশ্যত আপোনাৰ শস্যসমূহ",
    userCropsLoading: "আপোনাৰ যোগ কৰা শস্যসমূহ লোড হৈ আছে...",
    userCropsReady: "ইয়াত কেৱল আপোনাৰ যোগ কৰা শস্যসমূহ দেখুওৱা হৈছে।",
    userCropsEmpty: "ইয়াত কেৱল আপোনাৰ শস্য চাবলৈ প্ৰ'ফাইলত শস্য যোগ কৰক।",
    userCropsNoMatches: "এতিয়াও আপোনাৰ যোগ কৰা শস্যসমূহৰ সৈতে মিল খোৱা বৰ্তমান বজাৰৰ দাম পোৱা নগ'ল।",
    addCropAction: "শস্য যোগ কৰক",
    searchPlaceholder: "আপোনাৰ শস্য বা বজাৰ বিচাৰক...",
    perUnit: "প্ৰতি",
    updatedDaily: "দাম প্ৰতিদিনে আপডেট কৰা হয়",
    noResults: "আপোনাৰ সন্ধান বা ৰাজ্য ফিল্টাৰৰ লগত মিল থকা আপোনাৰ শস্যৰ দাম পোৱা নগ'ল।",
    allStates: "সকলো ৰাজ্য",
    loadingPrices: "বজাৰৰ দাম লোড কৰা হৈছে...",
    sortedForLocation: "{region} ৰ ওচৰত আপোনাৰ যোগ কৰা শস্যৰ দাম আৰু কিনাৰ বিকল্প দেখুওৱা হৈছে।",
    sortedForCoordinates: "সংৰক্ষিত সমন্বয়ৰ ভিত্তিত আপোনাৰ যোগ কৰা শস্যৰ দাম আৰু ওচৰৰ পৰামৰ্শ দেখুওৱা হৈছে।",
    addLocationHint: "আপোনাৰ যোগ কৰা শস্যৰ বাবে ওচৰৰ কিনাৰ বিকল্প চাবলৈ প্ৰ'ফাইলত স্থান যোগ কৰক।",
    priceSectionTitle: "আপোনাৰ শস্যৰ বৰ্তমান দাম",
    nearbyMarketsTitle: "ওচৰত ক'ত কিনিব",
    nearbyMarketsLoading: "আপোনাৰ ওচৰৰ বজাৰ বিচাৰি আছে...",
    nearbyMarketsEmpty: "আপোনাৰ বৰ্তমান শস্যৰ দামৰ লগত মিল থকা ওচৰৰ কিনাৰ বিকল্প পোৱা নগ'ল।",
    livePrice: "লাইভ দাম",
    openInMaps: "Google Maps-ত খোলক",
    source: "উৎস",
    sourceGoogle: "Google Maps",
    sourceFallback: "দাম ফলবেক",
  },
};

const formatPriceValue = (value: string | number) => {
  const numericValue = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numericValue) ? numericValue.toLocaleString("en-IN") : String(value);
};

const normalizeCropText = (value?: string | null) => String(value ?? "")
  .trim()
  .toLocaleLowerCase()
  .replace(/[^\p{L}\p{N}]+/gu, " ")
  .replace(/\s+/g, " ");

const getCropTextVariants = (crop: any) => Array.from(new Set(
  [crop?.type, crop?.nameEn, crop?.name, crop?.nameAs, crop?.nameHi]
    .map((value) => normalizeCropText(value))
    .filter(Boolean)
));

const matchesNormalizedCropText = (source: string, target: string) => {
  if (!source || !target) {
    return false;
  }

  const normalizedSource = ` ${source} `;
  const normalizedTarget = ` ${target} `;
  return normalizedSource.includes(normalizedTarget) || normalizedTarget.includes(normalizedSource);
};

const findCatalogCropForText = (value?: string | null): CropCatalogItem | undefined => {
  const normalized = normalizeCropText(value);
  if (!normalized) {
    return undefined;
  }

  return CROP_CATALOG.find((crop) => {
    const labels = Object.values(crop.label);
    return normalizeCropText(crop.value) === normalized
      || crop.aliases.some((alias) => normalizeCropText(alias) === normalized)
      || labels.some((label) => normalizeCropText(label) === normalized);
  });
};

const getCropDisplayName = (crop: any, language: SupportedLanguage) => {
  if (!crop) {
    return "";
  }

  if (language === "hi") {
    return crop.name || crop.nameHi || crop.nameEn || crop.nameAs || crop.type || "";
  }

  if (language === "as") {
    return crop.nameAs || crop.nameEn || crop.name || crop.nameHi || crop.type || "";
  }

  return crop.nameEn || crop.name || crop.nameAs || crop.nameHi || crop.type || "";
};

const Market = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const t = STRINGS[language];
  const [search, setSearch] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [prices, setPrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userCrops, setUserCrops] = useState<any[]>([]);
  const [loadingUserCrops, setLoadingUserCrops] = useState(true);
  const [nearbyMarkets, setNearbyMarkets] = useState<NearbyMarketDiscoveryResult | null>(null);
  const [nearbyLoading, setNearbyLoading] = useState(false);

  const getCommodityDisplayLabel = (commodity?: string | null) => {
    return getLocalizedMarketCommodityLabel(commodity, language);
  };
  const hasSavedCoordinates = hasValidCoordinates(userProfile?.coordinates);

  useEffect(() => {
    let isMounted = true;

    const fetchUserProfile = async () => {
      const loadSavedProfile = () => {
        try {
          const saved = localStorage.getItem(STORAGE_KEY);
          if (!saved) return null;

          return JSON.parse(saved);
        } catch (storageError) {
          console.error('Market: Error reading local profile:', storageError);
          return null;
        }
      };

      const savedProfile = loadSavedProfile();
      if (savedProfile && isMounted) {
        setUserProfile(savedProfile);
      }

      if (!user?.uid) {
        if (isMounted) {
          setUserCrops([]);
          setLoadingUserCrops(false);
        }
        return;
      }

      try {
        setLoadingUserCrops(true);
        const [profile, crops] = await Promise.all([
          getUserProfile(user.uid),
          getUserCrops(user.uid),
        ]);

        if (!isMounted) {
          return;
        }

        if (profile) {
          setUserProfile(profile);
        }

        setUserCrops(Array.isArray(crops) ? crops : []);
      } catch (error) {
        console.error('Market: Error fetching user profile:', error);
        if (isMounted) {
          setUserCrops([]);
        }
      } finally {
        if (isMounted) {
          setLoadingUserCrops(false);
        }
      }
    };

    fetchUserProfile();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const userCropSearchTerms = useMemo(() => {
    const searchTerms = new Set<string>();

    userCrops.forEach((crop) => {
      const variants = getCropTextVariants(crop);
      variants.forEach((value) => searchTerms.add(value));

      variants
        .map((value) => findCatalogCropForText(value))
        .filter((match): match is CropCatalogItem => Boolean(match))
        .forEach((match) => {
          [match.value, ...match.aliases, ...Object.values(match.label)]
            .map((value) => normalizeCropText(value))
            .filter(Boolean)
            .forEach((value) => searchTerms.add(value));
        });
    });

    return Array.from(searchTerms.values());
  }, [userCrops]);

  useEffect(() => {
    let isMounted = true;

    const fetchPrices = async () => {
      if (loadingUserCrops) {
        return;
      }

      if (userCropSearchTerms.length === 0) {
        if (isMounted) {
          setPrices([]);
          setLoading(false);
          setNearbyMarkets(null);
          setNearbyLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        const marketData = await getMarketPrices(userProfile?.location);

        if (!isMounted) {
          return;
        }

        setPrices(marketData);
      } catch (error) {
        console.error('Error fetching market prices:', error);
        if (isMounted) {
          setNearbyMarkets(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setNearbyLoading(false);
        }
      }
    };

    void fetchPrices();

    return () => {
      isMounted = false;
    };
  }, [loadingUserCrops, userCropSearchTerms, userProfile?.location]);

  const userCropPrices = useMemo(() => {
    if (userCropSearchTerms.length === 0) {
      return [];
    }

    return prices.filter((item) => {
      const normalizedCommodity = normalizeCropText(item.commodity);
      return userCropSearchTerms.some((term) => matchesNormalizedCropText(normalizedCommodity, term));
    });
  }, [prices, userCropSearchTerms]);

  useEffect(() => {
    let isMounted = true;

    const fetchNearbyMarkets = async () => {
      if (loading || loadingUserCrops) {
        return;
      }

      if (!userProfile?.location && !hasSavedCoordinates) {
        if (isMounted) {
          setNearbyMarkets(null);
          setNearbyLoading(false);
        }
        return;
      }

      if (userCropPrices.length === 0) {
        if (isMounted) {
          setNearbyMarkets(null);
          setNearbyLoading(false);
        }
        return;
      }

      try {
        setNearbyLoading(true);

        const nearbyResult = await getNearbyMarketPlaces({
          location: userProfile?.location,
          coordinates: hasSavedCoordinates ? userProfile.coordinates : undefined,
          marketData: userCropPrices,
          language,
        });

        if (!isMounted) {
          return;
        }

        setNearbyMarkets(nearbyResult);
      } catch (error) {
        console.error("Error fetching nearby market places:", error);
        if (isMounted) {
          setNearbyMarkets(null);
        }
      } finally {
        if (isMounted) {
          setNearbyLoading(false);
        }
      }
    };

    void fetchNearbyMarkets();

    return () => {
      isMounted = false;
    };
  }, [hasSavedCoordinates, language, loading, loadingUserCrops, userCropPrices, userProfile?.coordinates, userProfile?.location]);

  const stateOptions = useMemo(() => {
    const mappedStates = new Map<string, string>();

    userCropPrices.forEach((item) => {
      const stateValue = getStateFromMarket(item.market, item.state);
      if (stateValue) {
        mappedStates.set(stateValue, formatRegionLabel(stateValue));
      }
    });

    return [
      { value: "all", label: t.allStates },
      ...Array.from(mappedStates.entries())
        .sort((a, b) => a[1].localeCompare(b[1]))
        .map(([value, label]) => ({ value, label })),
    ];
  }, [t.allStates, userCropPrices]);

  useEffect(() => {
    if (selectedState !== "all" && !stateOptions.some((option) => option.value === selectedState)) {
      setSelectedState("all");
    }
  }, [selectedState, stateOptions]);

  const filteredPrices = useMemo(() => {
    const searchTerm = search.toLowerCase();

    return userCropPrices.filter((p) => {
      const matchesSearch =
        p.commodity.toLowerCase().includes(searchTerm) ||
        p.market.toLowerCase().includes(searchTerm);
      const matchesState = selectedState === "all" || getStateFromMarket(p.market, p.state) === selectedState;

      return matchesSearch && matchesState;
    });
  }, [search, selectedState, userCropPrices]);

  const hasAddedCrops = userCrops.length > 0;
  const hasMatchedMarketPrices = userCropPrices.length > 0;

  const marketHint = !hasAddedCrops
    ? t.userCropsEmpty
    : !userProfile?.location
    ? hasSavedCoordinates
      ? t.sortedForCoordinates
      : t.addLocationHint
    : t.sortedForLocation.replace("{region}", userProfile.location);

  const marketCropsSummary = loadingUserCrops
    ? t.userCropsLoading
    : !hasAddedCrops
      ? t.userCropsEmpty
      : hasMatchedMarketPrices
        ? t.userCropsReady
        : loading
          ? t.loadingPrices
          : t.userCropsNoMatches;

  const nearbySourceLabel = nearbyMarkets
    ? {
        google: t.sourceGoogle,
        fallback: t.sourceFallback,
      }[nearbyMarkets.source]
    : null;

  if (loading || loadingUserCrops) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-primary text-primary-foreground px-4 pt-10 pb-4">
        <div className="max-w-lg mx-auto">
          <button onClick={() => navigate(-1)} className="mb-2">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold">{t.title}</h1>
          <p className="text-xs opacity-80">{t.subtitle}</p>
          
          {/* User Location Display */}
          {userProfile?.location && (
            <div className="flex items-center gap-2 text-xs opacity-90 mt-2">
              <MapPin className="w-3 h-3" />
              <span className="text-primary-foreground/80">
                {userProfile.location}
              </span>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-4 space-y-4">
        <Card className="border border-border">
          <CardContent className="p-4 text-sm text-muted-foreground">
            {marketHint}
          </CardContent>
        </Card>

        <Card className="border border-border">
          <CardContent className="p-4 space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t.userCropsTitle}</h2>
              <p className="text-xs text-muted-foreground mt-1">{marketCropsSummary}</p>
            </div>
            {hasAddedCrops ? (
              <div className="flex flex-wrap gap-2">
                {userCrops.map((crop) => {
                  const label = getCropDisplayName(crop, language);
                  return label ? (
                    <div
                      key={String(crop?.id || label)}
                      className="rounded-full border border-dashed border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {label}
                    </div>
                  ) : null;
                })}
              </div>
            ) : (
              <Button size="sm" onClick={() => navigate("/add-crop")}>{t.addCropAction}</Button>
            )}
          </CardContent>
        </Card>

        {(nearbyLoading || nearbyMarkets) && (
          <Card className="border border-border">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">{t.nearbyMarketsTitle}</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {nearbyLoading ? t.nearbyMarketsLoading : nearbyMarkets?.summary}
                  </p>
                </div>
                {nearbySourceLabel && (
                  <div className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
                    {t.source}: {nearbySourceLabel}
                  </div>
                )}
              </div>

              {!nearbyLoading && nearbyMarkets && nearbyMarkets.places.length > 0 && (
                <div className="space-y-3">
                  {nearbyMarkets.places.map((place) => (
                    <div key={place.id} className="rounded-lg border border-border bg-card/60 p-3 space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-medium text-foreground">{place.name}</h3>
                          <p className="text-xs text-muted-foreground">{place.address}</p>
                        </div>
                        {place.distanceKm !== null && (
                          <div className="rounded-full bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground">
                            {place.distanceKm} km
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">{place.reason}</p>

                      {place.matchedPrice && (
                        <div className="rounded-md bg-muted/70 px-3 py-2 text-xs text-foreground">
                          <span className="font-medium">{t.livePrice}:</span>{" "}
                          {getCommodityDisplayLabel(place.matchedPrice.commodity)} ₹{formatPriceValue(place.matchedPrice.price)} / {place.matchedPrice.unit}
                          <span className="text-muted-foreground"> · {place.matchedPrice.market}</span>
                        </div>
                      )}

                      <a
                        href={place.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-medium text-primary"
                      >
                        <MapPin className="w-3 h-3" />
                        {t.openInMaps}
                      </a>
                    </div>
                  ))}
                </div>
              )}

              {!nearbyLoading && nearbyMarkets && nearbyMarkets.places.length === 0 && (
                <p className="text-sm text-muted-foreground">{t.nearbyMarketsEmpty}</p>
              )}
            </CardContent>
          </Card>
        )}

        {hasMatchedMarketPrices ? (
          <>
            {/* Search & Filter */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 text-sm"
                />
              </div>
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger className="w-[130px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {stateOptions.map((state) => (
                    <SelectItem key={state.value} value={state.value} className="text-xs">
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Price Cards */}
            <div className="space-y-2">
              <div className="px-1">
                <h2 className="text-sm font-semibold text-foreground">{t.priceSectionTitle}</h2>
              </div>
              {filteredPrices.length === 0 ? (
                <Card className="border border-border">
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    {t.noResults}
                  </CardContent>
                </Card>
              ) : filteredPrices.map((item) => (
                <Card key={`${item.commodity}-${item.market}-${item.date}`} className="border border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold">{getCommodityDisplayLabel(item.commodity)}</h3>
                        <span className="text-xs text-muted-foreground">{item.date}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">₹{formatPriceValue(item.price)}</div>
                        <div className="text-[10px] text-muted-foreground">{t.perUnit} {item.unit}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-muted-foreground">📍 {item.market}</span>
                      <div className={`flex items-center gap-1 text-xs font-semibold ${
                        item.trend === 'up' ? "text-success" : item.trend === 'down' ? "text-destructive" : "text-muted-foreground"
                      }`}>
                        {item.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : item.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                        <span>{item.trend === 'up' ? "+" : item.trend === 'down' ? "-" : ""}5%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <Card className="border border-border">
            <CardContent className="p-4 text-center text-sm text-muted-foreground">
              {hasAddedCrops ? t.userCropsNoMatches : t.userCropsEmpty}
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground py-4">
          {t.updatedDaily}
        </p>
      </div>
    </div>
  );
};

export default Market;
