import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ArrowLeft, ExternalLink, AlertTriangle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  getPersonalizedFarmingNews,
  getSoilInsights,
  type NewsArticle,
  type NewsSectionKey,
  type PersonalizedNewsProfile,
  type PersonalizedNewsResult,
  type SoilInsights,
  type SoilMetric,
} from "@/lib/api";
import { getUserCrops, getUserProfile } from "@/lib/database";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage, type SupportedLanguage } from "@/hooks/useLanguage";

const PROFILE_STORAGE_KEY = "farm-companion-profile";
const SECTION_ORDER: NewsSectionKey[] = ["events", "highlights", "stories", "tips"];

type StoredProfile = PersonalizedNewsProfile & {
  coordinates?: {
    lat?: number;
    lng?: number;
  } | null;
};
type StoredCrop = {
  type?: string;
  name?: string;
  nameEn?: string;
  nameAs?: string;
};

const STRINGS: Record<SupportedLanguage, {
  title: string;
  subtitle: string;
  loading: string;
  personalizedFor: string;
  sourceLabel: string;
  soilTitle: string;
    soilFallbackNotice: string;
  soilRecommendations: string;
  soilSourceLabel: string;
  empty: string;
  tabs: {
    highlights: string;
    stories: string;
    tips: string;
    events: string;
  };
  sources: {
    newsapi: string;
    fallback: string;
  };
  soilSources: {
    soilgrids: string;
    fallback: string;
  };
}> = {
  en: {
    title: "Agriculture News",
    subtitle: "News, tips, and farming updates personalized for you",
    loading: "Loading your personalized news...",
    personalizedFor: "Personalized for",
    sourceLabel: "Source mode",
    soilTitle: "Soil advisory for your area",
    soilFallbackNotice: "Live soil service is temporarily unavailable. Showing fallback soil guidance.",
    soilRecommendations: "Recommended order",
    soilSourceLabel: "Soil source",
    empty: "No articles available right now.",
    tabs: {
      highlights: "Monthly",
      stories: "Success",
      tips: "Tips",
      events: "Daily",
    },
    sources: {
      newsapi: "Personalized NewsAPI search",
      fallback: "Local personalized fallback",
    },
    soilSources: {
      soilgrids: "SoilGrids-based advisory",
      fallback: "Fallback soil guidance",
    },
  },
  hi: {
    title: "कृषि समाचार",
    subtitle: "आपके लिए व्यक्तिगत समाचार, सुझाव और खेती अपडेट",
    loading: "आपके लिए व्यक्तिगत समाचार लोड हो रहे हैं...",
    personalizedFor: "व्यक्तिगत समाचार",
    sourceLabel: "समाचार स्रोत",
    soilTitle: "आपके क्षेत्र की मिट्टी सलाह",
    soilFallbackNotice: "लाइव मिट्टी सेवा अभी उपलब्ध नहीं है। फिलहाल वैकल्पिक मिट्टी मार्गदर्शन दिखाया जा रहा है।",
    soilRecommendations: "सुझाव का क्रम",
    soilSourceLabel: "मिट्टी स्रोत",
    empty: "अभी कोई लेख उपलब्ध नहीं है।",
    tabs: {
      highlights: "मासिक",
      stories: "सफलता",
      tips: "टिप्स",
      events: "दैनिक",
    },
    sources: {
      newsapi: "व्यक्तिगत NewsAPI खोज",
      fallback: "स्थानीय वैकल्पिक समाचार",
    },
    soilSources: {
      soilgrids: "SoilGrids आधारित सलाह",
      fallback: "वैकल्पिक मिट्टी मार्गदर्शन",
    },
  },
  as: {
    title: "কৃষি বাতৰি",
    subtitle: "আপোনাৰ বাবে ব্যক্তিগত বাতৰি, পৰামৰ্শ আৰু খেতিৰ আপডেট",
    loading: "আপোনাৰ ব্যক্তিগত বাতৰি লোড হৈ আছে...",
    personalizedFor: "ব্যক্তিগতকৰণ",
    sourceLabel: "বাতৰিৰ উৎস",
    soilTitle: "আপোনাৰ স্থানৰ মাটিৰ পৰামৰ্শ",
    soilFallbackNotice: "লাইভ মাটিৰ সেৱা এতিয়া উপলব্ধ নহয়। এতিয়াৰ বাবে বিকল্প মাটিৰ দিশনিৰ্দেশ দেখুওৱা হৈছে।",
    soilRecommendations: "পৰামৰ্শৰ ক্রম",
    soilSourceLabel: "মাটিৰ উৎস",
    empty: "এই মুহূৰ্তত কোনো বাতৰি উপলব্ধ নহয়।",
    tabs: {
      highlights: "মাহেকীয়া",
      stories: "সফলতা",
      tips: "টিপছ",
      events: "দৈনিক",
    },
    sources: {
      newsapi: "ব্যক্তিগত NewsAPI search",
      fallback: "স্থানীয় বিকল্প বাতৰি",
    },
    soilSources: {
      soilgrids: "SoilGrids ভিত্তিক পৰামৰ্শ",
      fallback: "বিকল্প মাটিৰ দিশনিৰ্দেশ",
    },
  },
};

const LOCALE_BY_LANGUAGE: Record<SupportedLanguage, string> = {
  en: "en-IN",
  hi: "hi-IN",
  as: "as-IN",
};

const readStoredProfile = (): StoredProfile | null => {
  try {
    const saved = localStorage.getItem(PROFILE_STORAGE_KEY);
    return saved ? JSON.parse(saved) as StoredProfile : null;
  } catch {
    return null;
  }
};

const extractCropTopics = (crops: StoredCrop[]) => {
  return Array.from(
    new Set(
      crops
        .map((crop) => crop?.nameEn || crop?.type || crop?.name || crop?.nameAs || "")
        .map((value) => String(value).replace(/-/g, " ").trim())
        .filter(Boolean)
    )
  ).slice(0, 6);
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

const formatPublishedDate = (value: string, language: SupportedLanguage) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(LOCALE_BY_LANGUAGE[language], {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const News = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const t = STRINGS[language];
  const [searchParams] = useSearchParams();
  const [newsResult, setNewsResult] = useState<PersonalizedNewsResult | null>(null);
  const [soilInsights, setSoilInsights] = useState<SoilInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const activeTab = SECTION_ORDER.includes(searchParams.get("tab") as NewsSectionKey)
    ? searchParams.get("tab") as NewsSectionKey
    : "events";

  useEffect(() => {
    if (authLoading) {
      return;
    }

    let isMounted = true;

    const fetchNews = async () => {
      const storedProfile = readStoredProfile();
      let soilCoordinates = hasCoordinates(storedProfile?.coordinates) ? storedProfile.coordinates : undefined;
      const requestProfile: PersonalizedNewsProfile = {
        name: storedProfile?.name,
        age: storedProfile?.age,
        sex: storedProfile?.sex,
        language,
        location: storedProfile?.location,
        crops: [],
      };

      try {
        setLoading(true);
        if (user?.uid) {
          const [profile, crops] = await Promise.all([
            getUserProfile(user.uid),
            getUserCrops(user.uid),
          ]);

          if (profile) {
            requestProfile.name = profile.name || requestProfile.name;
            requestProfile.age = profile.age || requestProfile.age;
            requestProfile.sex = profile.sex || requestProfile.sex;
            requestProfile.location = profile.location || requestProfile.location;

            if (hasCoordinates(profile.coordinates)) {
              soilCoordinates = profile.coordinates;
            }
          }

          requestProfile.crops = extractCropTopics(Array.isArray(crops) ? crops : []);
        }

        const [result, soilResult] = await Promise.all([
          getPersonalizedFarmingNews(requestProfile),
          requestProfile.location || soilCoordinates
            ? getSoilInsights({
                location: requestProfile.location,
                coordinates: soilCoordinates,
                crops: requestProfile.crops,
                language,
              })
            : Promise.resolve<SoilInsights | null>(null),
        ]);

        if (isMounted) {
          setNewsResult(result);
          setSoilInsights(soilResult);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchNews();

    return () => {
      isMounted = false;
    };
  }, [authLoading, language, user?.uid]);

  const getSectionArticles = (sectionKey: NewsSectionKey) => {
    return newsResult?.sections.find((section) => section.key === sectionKey);
  };

  const renderArticleCard = (article: NewsArticle, index: number) => {
    const isExternalLink = Boolean(article.url && article.url !== "#");

    return (
      <Card key={`${article.title}-${index}`} className="border border-border">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-sm font-semibold leading-5">{article.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{article.description}</p>
            </div>
            {isExternalLink ? (
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary shrink-0"
                aria-label={article.title}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatPublishedDate(article.publishedAt, language)}
            </span>
            <span>{article.source}</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSection = (sectionKey: NewsSectionKey) => {
    const section = getSectionArticles(sectionKey);

    return (
      <TabsContent key={sectionKey} value={sectionKey} className="space-y-3 mt-4">
        <Card className="border border-border bg-secondary/30">
          <CardContent className="p-4">
            <h2 className="text-sm font-semibold">{section?.label || t.tabs[sectionKey]}</h2>
            <p className="text-xs text-muted-foreground mt-1">{section?.description || t.empty}</p>
          </CardContent>
        </Card>

        {section?.articles?.length
          ? section.articles.map(renderArticleCard)
          : (
            <Card className="border border-dashed border-border">
              <CardContent className="p-4 text-sm text-muted-foreground">{t.empty}</CardContent>
            </Card>
          )}
      </TabsContent>
    );
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-sm text-muted-foreground">{t.loading}</p>
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
          {newsResult ? (
            <div className="mt-2 text-xs opacity-90 space-y-1">
              <p>{t.personalizedFor}: {newsResult.personalizationSummary}</p>
              <p>{t.sourceLabel}: {t.sources[newsResult.source]}</p>
            </div>
          ) : null}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 mt-4">
        {soilInsights ? (
          <Card className="border border-border bg-secondary/20 mb-4">
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
                <h2 className="text-sm font-semibold">{t.soilTitle}</h2>
                <p className="text-xs text-muted-foreground mt-1">{soilInsights.summary}</p>
                <p className="text-sm mt-2 leading-6">{soilInsights.advisory}</p>
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
                    <span key={metricText} className="rounded-full bg-background px-3 py-1 text-xs text-foreground border border-border">
                      {metricText}
                    </span>
                  ))}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.soilRecommendations}</p>
                {soilInsights.recommendations.slice(0, 3).map((recommendation, index) => (
                  <div key={`${recommendation.title}-${index}`} className="rounded-lg bg-background p-3 border border-border/60">
                    <p className="text-sm font-medium">{index + 1}. {recommendation.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{recommendation.description}</p>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                {t.soilSourceLabel}: {t.soilSources[soilInsights.source]}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Tabs defaultValue={activeTab}>
          <TabsList className="w-full grid grid-cols-4 bg-muted">
            <TabsTrigger value="events" className="text-xs">{t.tabs.events}</TabsTrigger>
            <TabsTrigger value="highlights" className="text-xs">{t.tabs.highlights}</TabsTrigger>
            <TabsTrigger value="stories" className="text-xs">{t.tabs.stories}</TabsTrigger>
            <TabsTrigger value="tips" className="text-xs">{t.tabs.tips}</TabsTrigger>
          </TabsList>

          {SECTION_ORDER.map((sectionKey) => renderSection(sectionKey))}
        </Tabs>
      </div>
    </div>
  );
};

export default News;
