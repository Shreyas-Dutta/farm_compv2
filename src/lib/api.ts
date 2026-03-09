import { geocodeLocationWithGoogleMaps, hasGoogleMapsApiKey } from "./location";

// API Service for external data sources

export type WeatherCondition = "sunny" | "cloudy" | "rainy";

export type WeatherForecastDay = {
  date: string;
  condition: WeatherCondition;
  conditionText: string;
  high: number;
  low: number;
  precipitationChance: number | null;
  humidity: number | null;
  wind: number | null;
};

export type WeatherData = {
  temp: number;
  condition: WeatherCondition;
  humidity: number;
  wind: number;
  location: string;
  alert: string | null;
  dailyForecast: WeatherForecastDay[];
};

export type DisasterEvent = {
  id: string;
  title: string;
  description: string | null;
  link: string;
  date: string;
  closedAt: string | null;
  location: string;
  distanceKm: number | null;
  categoryIds: string[];
  categoryLabels: string[];
  sourceIds: string[];
  magnitudeLabel: string | null;
};

export type DisasterEventRequest = {
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  radiusKm?: number;
};

type Coordinates = {
  lat: number;
  lng: number;
};

type EonetEventCategory = {
  id?: string;
  title?: string;
};

type EonetEventSource = {
  id?: string;
  url?: string;
};

type EonetEventGeometry = {
  date?: string;
  type?: string;
  coordinates?: unknown;
  magnitudeValue?: number | null;
  magnitudeUnit?: string | null;
  magnitudeDescription?: string | null;
};

type EonetEvent = {
  id?: string;
  title?: string;
  description?: string | null;
  link?: string;
  closed?: string | null;
  categories?: EonetEventCategory[];
  sources?: EonetEventSource[];
  geometry?: EonetEventGeometry[];
};

type EonetEventsResponse = {
  events?: EonetEvent[];
};

type WeatherRequest = {
  location?: string;
  coordinates?: Coordinates;
  includeDailyForecast?: boolean;
  languageCode?: string;
};

type WeatherAlertLanguage = "en" | "hi" | "as";

type GoogleWeatherDate = {
  year?: number;
  month?: number;
  day?: number;
};

type GoogleWeatherDayPart = {
  weatherCondition?: {
    type?: string;
    description?: {
      text?: string;
    };
  };
  precipitation?: {
    probability?: {
      percent?: number;
    };
  };
  relativeHumidity?: number;
  wind?: {
    speed?: {
      value?: number;
    };
  };
};

type GoogleWeatherForecastDay = {
  displayDate?: GoogleWeatherDate;
  daytimeForecast?: GoogleWeatherDayPart;
  nighttimeForecast?: GoogleWeatherDayPart;
  maxTemperature?: {
    degrees?: number;
  };
  minTemperature?: {
    degrees?: number;
  };
};

type GoogleWeatherDailyResponse = {
  forecastDays?: GoogleWeatherForecastDay[];
};

type MarketItem = {
  commodity: string;
  price: string | number;
  unit: string;
  market: string;
  date: string;
  trend: string;
  state?: string;
};

export type NearbyMarketDiscoverySource = "google" | "fallback";

export type NearbyMarketPriceMatch = {
  market: string;
  commodity: string;
  price: string | number;
  unit: string;
  state?: string;
};

export type NearbyMarketPlace = {
  id: string;
  name: string;
  address: string;
  distanceKm: number | null;
  mapsUrl: string;
  reason: string;
  matchedPrice: NearbyMarketPriceMatch | null;
};

export type NearbyMarketDiscoveryResult = {
  location: string;
  source: NearbyMarketDiscoverySource;
  summary: string;
  places: NearbyMarketPlace[];
};

export type CropDiseaseDetectionSeverity = "low" | "medium" | "high" | "unknown";

export type CropDiseaseDetectionSource = "vision" | "plantnet" | "fallback";

type CropDiseaseDetectionNotice = "plantnet_rate_limited" | "plantnet_unavailable" | "plantnet_no_match";

export type CropDiseaseDetectionResult = {
  plantName: string;
  plantNameHi: string;
  disease: string;
  diseaseHi: string;
  confidence: number;
  severity: CropDiseaseDetectionSeverity;
  recommendations: string[];
  imageUrl: string;
  timestamp: string;
  source: CropDiseaseDetectionSource;
  summary: string;
  labels: string[];
  notice?: CropDiseaseDetectionNotice;
};

type NearbyMarketDiscoveryRequest = {
  location?: string;
  coordinates?: Coordinates;
  marketData?: MarketItem[];
};

type GooglePlacesTextSearchPlace = {
  id?: string;
  displayName?: {
    text?: string;
  };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  googleMapsUri?: string;
};

type GooglePlacesTextSearchResponse = {
  places?: GooglePlacesTextSearchPlace[];
};

type GoogleCloudVisionEntityAnnotation = {
  description?: string;
  score?: number;
  topicality?: number;
};

type GoogleCloudVisionLocalizedObjectAnnotation = {
  name?: string;
  score?: number;
};

type GoogleCloudVisionColorInfo = {
  pixelFraction?: number;
  color?: {
    red?: number;
    green?: number;
    blue?: number;
  };
};

type GoogleCloudVisionAnnotateImageResponse = {
  labelAnnotations?: GoogleCloudVisionEntityAnnotation[];
  localizedObjectAnnotations?: GoogleCloudVisionLocalizedObjectAnnotation[];
  webDetection?: {
    webEntities?: GoogleCloudVisionEntityAnnotation[];
  };
  imagePropertiesAnnotation?: {
    dominantColors?: {
      colors?: GoogleCloudVisionColorInfo[];
    };
  };
  error?: {
    message?: string;
  };
};

type GoogleCloudVisionBatchAnnotateResponse = {
  responses?: GoogleCloudVisionAnnotateImageResponse[];
};

type NewsRefreshCadence = "daily" | "weekly" | "monthly";

type PersonalizedNewsCacheEntry = {
  periodKey: string;
  cachedAt: string;
  section: PersonalizedNewsSection;
};

type PersonalizedNewsCacheStore = Partial<Record<string, Partial<Record<NewsSectionKey, PersonalizedNewsCacheEntry>>>>;

export type NewsSectionKey = "highlights" | "stories" | "tips" | "events";

export type NewsArticle = {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
  publishedAt: string;
  source: string;
};

export type PersonalizedNewsProfile = {
  name?: string;
  age?: string | number;
  sex?: string;
  language?: string;
  location?: string;
  crops?: string[];
};

export type PersonalizedNewsSection = {
  key: NewsSectionKey;
  label: string;
  description: string;
  query: string;
  articles: NewsArticle[];
};

export type PersonalizedNewsResult = {
  sections: PersonalizedNewsSection[];
  source: "newsapi" | "fallback";
  personalizationSummary: string;
};

export type SoilMetric = {
  label: string;
  value: number | null;
  unit: string;
  depthLabel: string;
};

export type SoilMetrics = {
  ph: SoilMetric;
  clay: SoilMetric;
  sand: SoilMetric;
  silt: SoilMetric;
  organicCarbon: SoilMetric;
  cec: SoilMetric;
};

export type SoilRecommendation = {
  title: string;
  description: string;
  priority: number;
};

export type SoilCropRecommendation = {
  crop: string;
  reason: string;
  priority: number;
};

export type SoilInsightSource = "soilgrids" | "fallback";

export type SoilInsightRequest = {
  location?: string;
  coordinates?: Coordinates;
  crops?: string[];
};

export type SoilInsights = {
  location: string;
  source: SoilInsightSource;
  summary: string;
  advisory: string;
  recommendations: SoilRecommendation[];
  recommendedCrops: SoilCropRecommendation[];
  metrics: SoilMetrics;
};

type NewsSectionPlan = Omit<PersonalizedNewsSection, "articles">;

const DEFAULT_WEATHER: WeatherData = {
  temp: 28,
  condition: "sunny",
  humidity: 60,
  wind: 10,
  location: "Unknown location",
  alert: null,
  dailyForecast: [],
};

const GOOGLE_WEATHER_ENDPOINT = "https://weather.googleapis.com/v1/forecast/days:lookup";
const GOOGLE_PLACES_TEXT_SEARCH_ENDPOINT = "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_CLOUD_VISION_ENDPOINT = "https://vision.googleapis.com/v1/images:annotate";
const EONET_EVENTS_ENDPOINT = "https://eonet.gsfc.nasa.gov/api/v3/events";
const EONET_DISASTER_CATEGORY_IDS = [
  "drought",
  "dustHaze",
  "earthquakes",
  "floods",
  "landslides",
  "manmade",
  "severeStorms",
  "snow",
  "tempExtremes",
  "volcanoes",
  "wildfires",
] as const;
const EONET_DISASTER_DEFAULT_RADIUS_KM = 300;
const EONET_DISASTER_MAX_RESULTS = 200;
const GOOGLE_PLACES_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.location",
  "places.googleMapsUri",
].join(",");
const GOOGLE_DAILY_FORECAST_DAYS = 5;
const MARKET_PLACE_RESULT_LIMIT = 3;
const MARKET_API_PAGE_SIZE = 200;
const MARKET_API_MAX_PAGES = 10;
const MARKET_API_HOST = import.meta.env.DEV ? "/api-proxy/data-gov" : "https://api.data.gov.in";
const PLANTNET_IDENTIFY_ENDPOINT = import.meta.env.DEV
  ? "/api-proxy/plantnet/v2/identify"
  : "https://my-api.plantnet.org/v2/identify";
const NEWS_API_PAGE_SIZE = 4;
const PERSONALIZED_NEWS_CACHE_STORAGE_KEY = "farm-companion-personalized-news-cache-v1";
const NEWS_SECTION_REFRESH_CADENCE: Record<NewsSectionKey, NewsRefreshCadence> = {
  events: "daily",
  highlights: "monthly",
  stories: "weekly",
  tips: "daily",
};
const VISION_API_LABEL_LIMIT = 8;
const SOILGRIDS_API_HOST = "https://rest.isric.org";
const SOILGRIDS_PROPERTIES = ["clay", "sand", "silt", "phh2o", "soc", "cec"] as const;
const SOILGRIDS_DEPTHS = ["0-5cm", "5-15cm"] as const;
const SOILGRIDS_SUCCESS_CACHE_MS = 30 * 60 * 1000;
const SOILGRIDS_FAILURE_COOLDOWN_MS = 5 * 60 * 1000;
const SOILGRIDS_FAILURE_STORAGE_KEY = "farm-companion-soilgrids-failure-until";
const PLANTNET_CROP_SCAN_FAILURE_COOLDOWN_MS = 5 * 60 * 1000;
const PLANTNET_CROP_SCAN_FAILURE_STORAGE_KEY = "farm-companion-plantnet-crop-scan-failure-until";
const SOIL_RECOMMENDED_CROP_VALUES = ["wheat", "rice", "mustard", "cotton", "gram", "maize", "sugarcane"] as const;
const SOIL_RECOMMENDED_CROP_LABELS: Record<(typeof SOIL_RECOMMENDED_CROP_VALUES)[number], string> = {
  wheat: "Wheat",
  rice: "Rice",
  mustard: "Mustard",
  cotton: "Cotton",
  gram: "Gram",
  maize: "Maize",
  sugarcane: "Sugarcane",
};

type SoilGridsLayerName = typeof SOILGRIDS_PROPERTIES[number];

type SoilGridsLayer = {
  name?: SoilGridsLayerName;
  unit_measure?: {
    d_factor?: number;
    target_units?: string;
  };
  depths?: Array<{
    label?: string;
    values?: {
      mean?: number | null;
    };
  }>;
};

export const INDIAN_STATES = [
  "andhra pradesh",
  "arunachal pradesh",
  "assam",
  "bihar",
  "chhattisgarh",
  "goa",
  "gujarat",
  "haryana",
  "himachal pradesh",
  "jharkhand",
  "karnataka",
  "kerala",
  "madhya pradesh",
  "maharashtra",
  "manipur",
  "meghalaya",
  "mizoram",
  "nagaland",
  "odisha",
  "punjab",
  "rajasthan",
  "sikkim",
  "tamil nadu",
  "telangana",
  "tripura",
  "uttar pradesh",
  "uttarakhand",
  "west bengal",
  "delhi",
  "jammu and kashmir",
  "ladakh",
  "puducherry",
  "chandigarh",
  "andaman and nicobar islands",
  "dadra and nagar haveli and daman and diu",
  "lakshadweep",
];

const FALLBACK_MARKET_TEMPLATE_BY_STATE: Record<string, {
  market: string;
  commodity: string;
  price: string;
  trend: string;
}> = {
  "andhra pradesh": { market: "Amaravati", commodity: "Rice", price: "2600", trend: "stable" },
  "arunachal pradesh": { market: "Itanagar", commodity: "Maize", price: "2400", trend: "up" },
  assam: { market: "Guwahati", commodity: "Rice", price: "3100", trend: "up" },
  bihar: { market: "Patna", commodity: "Wheat", price: "2300", trend: "stable" },
  chhattisgarh: { market: "Raipur", commodity: "Rice", price: "2500", trend: "up" },
  goa: { market: "Margao", commodity: "Rice", price: "2900", trend: "stable" },
  gujarat: { market: "Ahmedabad", commodity: "Cotton", price: "6500", trend: "up" },
  haryana: { market: "Karnal", commodity: "Wheat", price: "2400", trend: "up" },
  "himachal pradesh": { market: "Shimla", commodity: "Maize", price: "2200", trend: "stable" },
  jharkhand: { market: "Ranchi", commodity: "Maize", price: "2100", trend: "stable" },
  karnataka: { market: "Bengaluru", commodity: "Maize", price: "2550", trend: "up" },
  kerala: { market: "Kochi", commodity: "Coconut", price: "3400", trend: "stable" },
  "madhya pradesh": { market: "Bhopal", commodity: "Gram", price: "4800", trend: "up" },
  maharashtra: { market: "Mumbai", commodity: "Cotton", price: "6200", trend: "stable" },
  manipur: { market: "Imphal", commodity: "Rice", price: "3200", trend: "up" },
  meghalaya: { market: "Shillong", commodity: "Maize", price: "2300", trend: "stable" },
  mizoram: { market: "Aizawl", commodity: "Rice", price: "3300", trend: "up" },
  nagaland: { market: "Kohima", commodity: "Maize", price: "2350", trend: "stable" },
  odisha: { market: "Bhubaneswar", commodity: "Rice", price: "2400", trend: "up" },
  punjab: { market: "Ludhiana", commodity: "Wheat", price: "2350", trend: "up" },
  rajasthan: { market: "Jaipur", commodity: "Mustard", price: "4500", trend: "down" },
  sikkim: { market: "Gangtok", commodity: "Maize", price: "2600", trend: "stable" },
  "tamil nadu": { market: "Chennai", commodity: "Rice", price: "2800", trend: "stable" },
  telangana: { market: "Hyderabad", commodity: "Cotton", price: "6400", trend: "up" },
  tripura: { market: "Agartala", commodity: "Rice", price: "3000", trend: "stable" },
  "uttar pradesh": { market: "Lucknow", commodity: "Sugarcane", price: "350", trend: "stable" },
  uttarakhand: { market: "Dehradun", commodity: "Wheat", price: "2450", trend: "up" },
  "west bengal": { market: "Kolkata", commodity: "Rice", price: "2900", trend: "stable" },
  delhi: { market: "Delhi", commodity: "Wheat", price: "2200", trend: "up" },
  "jammu and kashmir": { market: "Srinagar", commodity: "Apple", price: "6800", trend: "stable" },
  ladakh: { market: "Leh", commodity: "Barley", price: "2600", trend: "stable" },
  puducherry: { market: "Puducherry", commodity: "Rice", price: "2750", trend: "stable" },
  chandigarh: { market: "Chandigarh", commodity: "Wheat", price: "2300", trend: "stable" },
  "andaman and nicobar islands": { market: "Port Blair", commodity: "Coconut", price: "3600", trend: "stable" },
  "dadra and nagar haveli and daman and diu": { market: "Daman", commodity: "Rice", price: "2550", trend: "stable" },
  lakshadweep: { market: "Kavaratti", commodity: "Coconut", price: "3700", trend: "stable" },
};

const CITY_TO_STATE: Record<string, string> = {
  delhi: "delhi",
  mumbai: "maharashtra",
  jaipur: "rajasthan",
  kolkata: "west bengal",
  bangalore: "karnataka",
  bengaluru: "karnataka",
  chennai: "tamil nadu",
  hyderabad: "telangana",
  lucknow: "uttar pradesh",
  bhopal: "madhya pradesh",
  ahmedabad: "gujarat",
  kota: "rajasthan",
  chandigarh: "chandigarh",
  dehradun: "uttarakhand",
  patna: "bihar",
  ranchi: "jharkhand",
  bhubaneswar: "odisha",
  guwahati: "assam",
  chandrapur: "maharashtra",
};

const normalizeLocationParts = (location: string) =>
  location
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

const formatStateKey = (value: string) => value.trim().toLowerCase().replace(/\s+/g, " ");

const formatStateLabel = (value: string) =>
  value
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const buildFallbackMarketData = (): MarketItem[] => {
  const today = new Date().toLocaleDateString();

  return INDIAN_STATES.map((stateKey) => {
    const fallback = FALLBACK_MARKET_TEMPLATE_BY_STATE[stateKey];

    return {
      commodity: fallback.commodity,
      price: fallback.price,
      unit: "Quintal",
      market: fallback.market,
      date: today,
      trend: fallback.trend,
      state: formatStateLabel(stateKey),
    };
  });
};

const getMarketStateKey = (item: Pick<MarketItem, "market" | "state">) => {
  const explicitState = item.state ? formatStateKey(item.state) : "";
  if (explicitState) {
    return explicitState;
  }

  const mappedState = extractStateFromLocation(item.market || "");
  return mappedState ? formatStateKey(mappedState) : null;
};

const appendMissingStateFallbacks = (marketData: MarketItem[]) => {
  const coveredStateKeys = new Set(
    marketData
      .map((item) => getMarketStateKey(item))
      .filter((value): value is string => Boolean(value))
  );

  const fallbackRows = buildFallbackMarketData().filter(
    (item) => !coveredStateKeys.has(formatStateKey(item.state || ""))
  );

  return [...marketData, ...fallbackRows];
};

const transformMarketRecords = (records: any[]): MarketItem[] => {
  return records.map((item: any) => ({
    commodity: item.commodity || item.Commodity || "Unknown",
    price: item.modal_price || item["Modal Price"] || "0",
    unit: item.unit || item.Unit || "Quintal",
    market: item.market || item.Market || "Local Market",
    date: item.arrival_date || item["Arrival Date"] || new Date().toLocaleDateString(),
    trend: item.price_change || "stable",
    state: item.state || item.State || item.state_name || item["State"] || "",
  }));
};

const getMarketItemKey = (item: MarketItem) => {
  return [item.commodity, item.market, item.date, item.state || "", String(item.price), item.unit]
    .join("|")
    .toLowerCase();
};

const dedupeMarketItems = (items: MarketItem[]) => {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = getMarketItemKey(item);
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const normalizeMarketSearchText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const buildGoogleMapsSearchUrl = (query: string) => {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}`;
};

const roundToSingleDecimal = (value: number) => Math.round(value * 10) / 10;

const calculateDistanceKm = (from: Coordinates, to: Coordinates) => {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return roundToSingleDecimal(earthRadiusKm * c);
};

const formatDateOnly = (value: Date) => value.toISOString().slice(0, 10);

const buildRadiusBoundingBox = (coordinates: Coordinates, radiusKm: number) => {
  const latitudeDelta = radiusKm / 111;
  const safeCosine = Math.max(Math.cos((coordinates.lat * Math.PI) / 180), 0.1);
  const longitudeDelta = radiusKm / (111 * safeCosine);
  const minLng = Math.max(-180, coordinates.lng - longitudeDelta);
  const maxLng = Math.min(180, coordinates.lng + longitudeDelta);
  const minLat = Math.max(-90, coordinates.lat - latitudeDelta);
  const maxLat = Math.min(90, coordinates.lat + latitudeDelta);

  return [minLng, maxLat, maxLng, minLat].map((value) => value.toFixed(4)).join(",");
};

const collectGeoJsonCoordinatePairs = (value: unknown, pairs: Coordinates[] = []): Coordinates[] => {
  if (!Array.isArray(value)) {
    return pairs;
  }

  if (value.length >= 2 && Number.isFinite(value[0]) && Number.isFinite(value[1])) {
    pairs.push({ lng: Number(value[0]), lat: Number(value[1]) });
    return pairs;
  }

  value.forEach((item) => {
    collectGeoJsonCoordinatePairs(item, pairs);
  });

  return pairs;
};

const getRepresentativeGeometryCoordinates = (geometry?: EonetEventGeometry): Coordinates | null => {
  const pairs = collectGeoJsonCoordinatePairs(geometry?.coordinates);
  if (pairs.length === 0) {
    return null;
  }

  if ((geometry?.type || "").toLowerCase() === "point" || pairs.length === 1) {
    return pairs[0];
  }

  const latitude = pairs.reduce((sum, point) => sum + point.lat, 0) / pairs.length;
  const longitude = pairs.reduce((sum, point) => sum + point.lng, 0) / pairs.length;
  return { lat: latitude, lng: longitude };
};

const formatDisasterMagnitude = (geometry?: EonetEventGeometry) => {
  if (!geometry) {
    return null;
  }

  const value = Number(geometry.magnitudeValue);
  if (Number.isFinite(value) && geometry.magnitudeUnit) {
    return `${value} ${geometry.magnitudeUnit}`;
  }

  if (typeof geometry.magnitudeDescription === "string" && geometry.magnitudeDescription.trim()) {
    return geometry.magnitudeDescription.trim();
  }

  return null;
};

const buildDisasterLocationLabel = (location: string, distanceKm: number | null) => {
  if (!location) {
    return distanceKm === null ? "Selected area" : `${distanceKm} km from selected area`;
  }

  return distanceKm === null ? location : `${distanceKm} km from ${location}`;
};

const normalizeDisasterEvent = (event: EonetEvent, target: Coordinates, location: string, radiusKm: number): DisasterEvent | null => {
  const categoryIds = Array.isArray(event.categories)
    ? event.categories.map((category) => String(category?.id || "").trim()).filter(Boolean)
    : [];
  const categoryLabels = Array.isArray(event.categories)
    ? event.categories.map((category) => String(category?.title || category?.id || "").trim()).filter(Boolean)
    : [];
  const sourceIds = Array.isArray(event.sources)
    ? event.sources.map((source) => String(source?.id || "").trim()).filter(Boolean)
    : [];

  const selectedGeometry = Array.isArray(event.geometry)
    ? event.geometry
        .map((geometry) => {
          const parsedDate = new Date(String(geometry?.date || ""));
          if (Number.isNaN(parsedDate.getTime())) {
            return null;
          }

          const representativeCoordinates = getRepresentativeGeometryCoordinates(geometry);
          const distanceKm = representativeCoordinates ? calculateDistanceKm(target, representativeCoordinates) : null;
          return {
            geometry,
            date: parsedDate.toISOString(),
            distanceKm,
          };
        })
        .filter((item): item is { geometry: EonetEventGeometry; date: string; distanceKm: number | null } => Boolean(item))
        .filter((item) => item.distanceKm === null || item.distanceKm <= radiusKm)
        .sort((a, b) => {
          const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
          if (dateDiff !== 0) {
            return dateDiff;
          }

          return (a.distanceKm ?? Number.POSITIVE_INFINITY) - (b.distanceKm ?? Number.POSITIVE_INFINITY);
        })[0]
    : undefined;

  if (!selectedGeometry) {
    return null;
  }

  const distanceKm = selectedGeometry.distanceKm === null ? null : roundToSingleDecimal(selectedGeometry.distanceKm);

  return {
    id: String(event.id || event.link || `${event.title || "event"}-${selectedGeometry.date}`),
    title: String(event.title || "Untitled disaster event"),
    description: typeof event.description === "string" && event.description.trim() ? event.description.trim() : null,
    link: String(event.link || ""),
    date: selectedGeometry.date,
    closedAt: typeof event.closed === "string" && event.closed.trim() ? event.closed : null,
    location: buildDisasterLocationLabel(location, distanceKm),
    distanceKm,
    categoryIds,
    categoryLabels,
    sourceIds,
    magnitudeLabel: formatDisasterMagnitude(selectedGeometry.geometry),
  };
};

const pickMatchedMarketPrice = (
  place: Pick<NearbyMarketPlace, "name" | "address">,
  marketData: MarketItem[],
  userLocation: string
): NearbyMarketPriceMatch | null => {
  if (marketData.length === 0) {
    return null;
  }

  const placeText = normalizeMarketSearchText(`${place.name} ${place.address}`);
  const placeState = extractStateFromLocation(place.address || place.name || "");

  const bestMatch = [...marketData]
    .map((item) => {
      const marketText = normalizeMarketSearchText(item.market || "");
      let score = userLocation ? getLocationMatchScore(item, userLocation) : 0;

      if (marketText && (placeText.includes(marketText) || marketText.includes(placeText))) {
        score += 5;
      } else if (marketText) {
        const marketWords = marketText.split(" ").filter((word) => word.length >= 4);
        if (marketWords.some((word) => placeText.includes(word))) {
          score += 3;
        }
      }

      if (placeState) {
        const itemState = extractStateFromLocation(`${item.market}, ${item.state || ""}`);
        if (itemState === placeState) {
          score += 2;
        }
      }

      return { item, score };
    })
    .sort((a, b) => b.score - a.score)[0];

  if (!bestMatch || bestMatch.score <= 0) {
    return null;
  }

  return {
    market: bestMatch.item.market,
    commodity: bestMatch.item.commodity,
    price: bestMatch.item.price,
    unit: bestMatch.item.unit,
    state: bestMatch.item.state,
  };
};

const buildFallbackNearbyMarketPlaces = (
  location: string,
  marketData: MarketItem[]
): NearbyMarketDiscoveryResult => {
  const sourceData = marketData.length > 0 ? marketData : buildFallbackMarketData();
  const sorted = location ? filterAndSortByLocation(sourceData, location) : [...sourceData];
  const seenMarkets = new Set<string>();

  const places = sorted
    .filter((item) => {
      const key = normalizeMarketSearchText(item.market || "");
      if (!key || seenMarkets.has(key)) {
        return false;
      }

      seenMarkets.add(key);
      return true;
    })
    .slice(0, MARKET_PLACE_RESULT_LIMIT)
    .map((item) => ({
      id: `fallback-${normalizeMarketSearchText(item.market || "market").replace(/\s+/g, "-")}`,
      name: item.market,
      address: [item.market, item.state, "India"].filter(Boolean).join(", "),
      distanceKm: null,
      mapsUrl: buildGoogleMapsSearchUrl([item.market, item.state, "India"].filter(Boolean).join(", ")),
      reason: `Matched from current mandi prices for ${item.commodity}.`,
      matchedPrice: {
        market: item.market,
        commodity: item.commodity,
        price: item.price,
        unit: item.unit,
        state: item.state,
      },
    }));

  return {
    location: location || "your area",
    source: "fallback",
    summary: location
      ? `Showing likely mandi options near ${location} using current market-price matches.`
      : "Showing mandi options from current market-price data.",
    places,
  };
};

const fetchGoogleMarketPlaceCandidates = async (
  location: string,
  coordinates?: Coordinates
): Promise<NearbyMarketPlace[]> => {
  const apiKey = getGoogleMapsApiKey();
  if (!apiKey) {
    return [];
  }

  const textQuery = location ? `agricultural market near ${location}` : "agricultural market";
  const response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "en",
      regionCode: "IN",
      maxResultCount: MARKET_PLACE_RESULT_LIMIT,
      ...(coordinates
        ? {
            locationBias: {
              circle: {
                center: {
                  latitude: coordinates.lat,
                  longitude: coordinates.lng,
                },
                radius: 50000,
              },
            },
          }
        : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Google Places text search failed with status ${response.status}`);
  }

  const data = (await response.json()) as GooglePlacesTextSearchResponse;
  const seen = new Set<string>();

  return (Array.isArray(data.places) ? data.places : [])
    .map((place, index) => {
      const name = place.displayName?.text?.trim() || place.formattedAddress?.trim() || `Market ${index + 1}`;
      const address = place.formattedAddress?.trim() || name;
      const latitude = place.location?.latitude;
      const longitude = place.location?.longitude;

      return {
        id: place.id?.trim() || `google-place-${index + 1}`,
        name,
        address,
        distanceKm:
          coordinates && Number.isFinite(latitude) && Number.isFinite(longitude)
            ? calculateDistanceKm(coordinates, { lat: latitude as number, lng: longitude as number })
            : null,
        mapsUrl: place.googleMapsUri || buildGoogleMapsSearchUrl(address),
        reason: "",
        matchedPrice: null,
      } satisfies NearbyMarketPlace;
    })
    .filter((place) => {
      const key = normalizeMarketSearchText(`${place.name} ${place.address}`);
      if (!key || seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
};

const getDataGovApiKey = () => import.meta.env.VITE_DATA_GOV_API_KEY?.trim() || "";
const getNewsApiKey = () => import.meta.env.VITE_NEWS_API_KEY?.trim() || "";
const getPlantNetApiKey = () => import.meta.env.VITE_PLANTNET_API_KEY?.trim() || "";
const getGoogleCloudVisionApiKey = () => import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY?.trim() || "";

export const hasCropScanAiConfigured = () => Boolean(getGoogleCloudVisionApiKey() || getPlantNetApiKey());

const buildFallbackNews = () => [
  {
    title: "Monsoon Progress: 78% of Country Covered",
    description: "India Meteorological Department reports good monsoon coverage this year",
    url: "#",
    imageUrl: "",
    publishedAt: new Date().toISOString(),
    source: "IMD",
  },
  {
    title: "Government Increases MSP for Kharif Crops",
    description: "Minimum Support Prices raised by 5-10% for major crops",
    url: "#",
    imageUrl: "",
    publishedAt: new Date().toISOString(),
    source: "Agriculture Ministry",
  },
];

const normalizeNewsTopic = (value: string) => value.replace(/-/g, " ").trim();

const createSoilMetric = (label: string, unit = "", depthLabel = ""): SoilMetric => ({
  label,
  value: null,
  unit,
  depthLabel,
});

const createEmptySoilMetrics = (): SoilMetrics => ({
  ph: createSoilMetric("pH"),
  clay: createSoilMetric("Clay", "%"),
  sand: createSoilMetric("Sand", "%"),
  silt: createSoilMetric("Silt", "%"),
  organicCarbon: createSoilMetric("Organic carbon"),
  cec: createSoilMetric("CEC", "cmol(c)/kg"),
});

const formatSoilNumber = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1).replace(/\.0$/, "");
};

const formatSoilMetricValue = (metric: SoilMetric) => {
  if (!Number.isFinite(metric.value)) {
    return "Unavailable";
  }

  const unit = metric.unit && metric.unit !== "-" ? ` ${metric.unit}` : "";
  return `${formatSoilNumber(metric.value as number)}${unit}`;
};

const getFiniteSoilMetricValue = (metric: SoilMetric) => {
  return Number.isFinite(metric.value) ? Number(metric.value) : null;
};

const getSoilRecommendedCropLabel = (crop: string) => {
  const normalized = normalizeNewsTopic(String(crop || "")).toLowerCase().replace(/\s+/g, "-");
  return SOIL_RECOMMENDED_CROP_LABELS[normalized as keyof typeof SOIL_RECOMMENDED_CROP_LABELS] || crop;
};

const normalizeSoilRecommendedCropValue = (value: string) => {
  const normalized = normalizeNewsTopic(String(value || "")).toLowerCase().replace(/[^a-z]+/g, "-").replace(/-+/g, "-");
  const aliases: Record<string, string> = {
    paddy: "rice",
    corn: "maize",
    chickpea: "gram",
    chana: "gram",
    "sugar-cane": "sugarcane",
  };
  const mapped = aliases[normalized] || normalized;
  return SOIL_RECOMMENDED_CROP_VALUES.includes(mapped as (typeof SOIL_RECOMMENDED_CROP_VALUES)[number]) ? mapped : "";
};

const mergeSoilRecommendedCrops = (
  primary: SoilCropRecommendation[],
  fallback: SoilCropRecommendation[]
) => {
  const merged: SoilCropRecommendation[] = [];
  const seen = new Set<string>();

  for (const item of [...primary, ...fallback]) {
    if (!item.crop || !item.reason || seen.has(item.crop)) {
      continue;
    }

    merged.push(item);
    seen.add(item.crop);

    if (merged.length === 2) {
      break;
    }
  }

  return merged.length === 2 ? merged : fallback.slice(0, 2);
};

const convertSoilValue = (value?: number | null, dFactor?: number) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  const divisor = Number.isFinite(dFactor) && Number(dFactor) !== 0 ? Number(dFactor) : 1;
  return Math.round((Number(value) / divisor) * 10) / 10;
};

const averageSoilValues = (values: Array<number | null>) => {
  const valid = values.filter((value): value is number => Number.isFinite(value));
  if (valid.length === 0) {
    return null;
  }

  const total = valid.reduce((sum, value) => sum + value, 0);
  return Math.round((total / valid.length) * 10) / 10;
};

const normalizeSoilLayerMetric = (
  layers: SoilGridsLayer[],
  layerName: SoilGridsLayerName,
  label: string,
  fallbackUnit = ""
): SoilMetric => {
  const layer = layers.find((entry) => entry?.name === layerName);
  if (!layer) {
    return createSoilMetric(label, fallbackUnit);
  }

  const depths = Array.isArray(layer.depths) ? layer.depths : [];
  const preferredDepths = depths.filter((depth) => SOILGRIDS_DEPTHS.includes((depth?.label || "") as (typeof SOILGRIDS_DEPTHS)[number]));
  const selectedDepths = preferredDepths.length > 0 ? preferredDepths : depths;
  const value = averageSoilValues(selectedDepths.map((depth) => convertSoilValue(depth?.values?.mean, layer.unit_measure?.d_factor)));
  const depthLabel = selectedDepths.find((depth) => Number.isFinite(depth?.values?.mean))?.label || selectedDepths[0]?.label || "";

  return {
    label,
    value,
    unit: String(layer.unit_measure?.target_units || fallbackUnit || "").trim(),
    depthLabel,
  };
};

type SoilGridsMetricsCacheEntry =
  | {
      status: "pending";
      promise: Promise<SoilMetrics>;
      expiresAt: number;
    }
  | {
      status: "resolved";
      metrics: SoilMetrics;
      expiresAt: number;
    }
  | {
      status: "failed";
      expiresAt: number;
    };

const soilGridsMetricsCache = new Map<string, SoilGridsMetricsCacheEntry>();

const getSoilGridsCacheKey = (coordinates: Coordinates) => {
  return `${coordinates.lat.toFixed(4)},${coordinates.lng.toFixed(4)}`;
};

const getPlantNetCropScanPersistentFailureUntil = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(PLANTNET_CROP_SCAN_FAILURE_STORAGE_KEY);
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const setPlantNetCropScanPersistentFailureUntil = (expiresAt: number | null) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (expiresAt && expiresAt > Date.now()) {
      window.sessionStorage.setItem(PLANTNET_CROP_SCAN_FAILURE_STORAGE_KEY, String(expiresAt));
    } else {
      window.sessionStorage.removeItem(PLANTNET_CROP_SCAN_FAILURE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access issues and fall back to per-request behavior.
  }
};

const getSoilGridsPersistentFailureUntil = () => {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = window.sessionStorage.getItem(SOILGRIDS_FAILURE_STORAGE_KEY);
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

const setSoilGridsPersistentFailureUntil = (expiresAt: number | null) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (expiresAt && expiresAt > Date.now()) {
      window.sessionStorage.setItem(SOILGRIDS_FAILURE_STORAGE_KEY, String(expiresAt));
    } else {
      window.sessionStorage.removeItem(SOILGRIDS_FAILURE_STORAGE_KEY);
    }
  } catch {
    // Ignore storage access issues and fall back to in-memory behavior.
  }
};

const shouldPersistSoilGridsFailure = (error: unknown) => {
  const status = typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: number }).status)
    : null;

  return !Number.isFinite(status) || (status as number) >= 500;
};

export const __resetApiCachesForTests = (options?: { includePersistent?: boolean }) => {
  soilGridsMetricsCache.clear();

  if (options?.includePersistent !== false) {
    setPlantNetCropScanPersistentFailureUntil(null);
    setSoilGridsPersistentFailureUntil(null);
    clearPersonalizedNewsCacheStore();
  }
};

const normalizeSoilMetrics = (layers: SoilGridsLayer[]): SoilMetrics => ({
  ph: normalizeSoilLayerMetric(layers, "phh2o", "pH"),
  clay: normalizeSoilLayerMetric(layers, "clay", "Clay", "%"),
  sand: normalizeSoilLayerMetric(layers, "sand", "Sand", "%"),
  silt: normalizeSoilLayerMetric(layers, "silt", "Silt", "%"),
  organicCarbon: normalizeSoilLayerMetric(layers, "soc", "Organic carbon"),
  cec: normalizeSoilLayerMetric(layers, "cec", "CEC", "cmol(c)/kg"),
});

const countAvailableSoilMetrics = (metrics: SoilMetrics) => {
  return Object.values(metrics).filter((metric) => Number.isFinite(metric.value)).length;
};

const describeSoilPh = (value: number | null) => {
  if (!Number.isFinite(value)) {
    return null;
  }

  if ((value as number) < 5.5) return "strongly acidic";
  if ((value as number) < 6.5) return "slightly acidic";
  if ((value as number) <= 7.5) return "near neutral";
  return "alkaline";
};

const describeSoilTexture = (metrics: SoilMetrics) => {
  if (Number.isFinite(metrics.clay.value) && (metrics.clay.value as number) >= 40) {
    return "clay-rich";
  }

  if (Number.isFinite(metrics.sand.value) && (metrics.sand.value as number) >= 60) {
    return "sandy";
  }

  if (Number.isFinite(metrics.silt.value) && (metrics.silt.value as number) >= 50) {
    return "silt-rich";
  }

  if (countAvailableSoilMetrics(metrics) > 0) {
    return "mixed-texture";
  }

  return null;
};

const buildFallbackSoilCropRecommendations = (
  location: string,
  metrics: SoilMetrics
): SoilCropRecommendation[] => {
  const ph = getFiniteSoilMetricValue(metrics.ph);
  const clay = getFiniteSoilMetricValue(metrics.clay);
  const sand = getFiniteSoilMetricValue(metrics.sand);
  const silt = getFiniteSoilMetricValue(metrics.silt);
  const cec = getFiniteSoilMetricValue(metrics.cec);
  const availableMetricCount = countAvailableSoilMetrics(metrics);

  if (availableMetricCount === 0) {
    return [
      {
        crop: "rice",
        reason: `Detailed soil values were unavailable for ${location}, so rice is shown only as a conservative staple option until local pH, drainage, and water-holding conditions are confirmed.`,
        priority: 60,
      },
      {
        crop: "maize",
        reason: `Maize is shown as a flexible fallback choice while SoilGrids values for ${location} are incomplete, but a field soil test should confirm texture and nutrient-holding capacity first.`,
        priority: 55,
      },
    ];
  }

  const candidates = [
    {
      crop: "rice",
      priority: 52,
      reasons: [] as string[],
    },
    {
      crop: "wheat",
      priority: 50,
      reasons: [] as string[],
    },
    {
      crop: "mustard",
      priority: 48,
      reasons: [] as string[],
    },
    {
      crop: "cotton",
      priority: 46,
      reasons: [] as string[],
    },
    {
      crop: "gram",
      priority: 48,
      reasons: [] as string[],
    },
    {
      crop: "maize",
      priority: 50,
      reasons: [] as string[],
    },
    {
      crop: "sugarcane",
      priority: 48,
      reasons: [] as string[],
    },
  ];

  const addReason = (crop: string, text: string, score: number) => {
    const candidate = candidates.find((item) => item.crop === crop);
    if (!candidate) {
      return;
    }

    candidate.priority += score;
    candidate.reasons.push(text);
  };

  if (clay !== null && clay >= 35) {
    addReason("rice", `Clay is about ${formatSoilMetricValue(metrics.clay)}, which supports stronger water retention for rice roots.`, 20);
    addReason("cotton", `Clay around ${formatSoilMetricValue(metrics.clay)} can hold moisture longer, which suits a longer-duration crop like cotton.`, 12);
  }

  if (clay !== null && clay >= 45) {
    addReason("rice", `The heavier clay texture can handle standing moisture better than dryland crops.`, 8);
  }

  if (clay !== null && clay < 35) {
    addReason("mustard", `Clay is below heavy-soil levels, so the topsoil should drain better for mustard than puddled crops.`, 10);
    addReason("gram", `The lighter clay load improves drainage, which helps gram avoid prolonged wet feet.`, 10);
    addReason("maize", `This texture should stay more open for maize root growth than very heavy soil.`, 6);
  }

  if (sand !== null && sand >= 60) {
    addReason("mustard", `Sand is about ${formatSoilMetricValue(metrics.sand)}, so the field should drain faster and suit mustard better than water-loving crops.`, 16);
    addReason("maize", `The sandy texture can work for maize if moisture is managed with timely irrigation and mulch.`, 10);
    addReason("gram", `Fast drainage from sandy soil usually suits gram better than crops that need standing moisture.`, 8);
  }

  if (sand !== null && sand <= 45) {
    addReason("rice", `Sand is not excessively high, so moisture should stay in the root zone longer for rice.`, 10);
    addReason("sugarcane", `Moderate sand means less moisture loss than very sandy soil, which helps a thirstier crop like sugarcane.`, 8);
  }

  if (silt !== null && silt >= 35) {
    addReason("wheat", `Silt is about ${formatSoilMetricValue(metrics.silt)}, which can support a softer seedbed and steady root spread for wheat.`, 12);
    addReason("maize", `Higher silt can help hold moisture and still keep maize roots well aerated.`, 8);
  }

  if (ph !== null && ph < 5.8) {
    addReason("rice", `pH is around ${formatSoilMetricValue(metrics.ph)}, and rice usually tolerates slightly acidic soil better than most neutral-preferring crops.`, 18);
    addReason("maize", `Maize can still perform in mildly acidic soil when nutrient management is corrected early.`, 6);
  }

  if (ph !== null && ph >= 6 && ph <= 7.5) {
    addReason("wheat", `pH near ${formatSoilMetricValue(metrics.ph)} is close to the neutral range that generally suits wheat well.`, 18);
    addReason("maize", `pH around ${formatSoilMetricValue(metrics.ph)} fits maize better than strongly acidic or alkaline conditions.`, 18);
    addReason("gram", `This pH range is favorable for gram nutrient uptake and nodulation.`, 16);
    addReason("sugarcane", `Sugarcane usually performs better in this moderate pH range than in strongly acidic soil.`, 14);
  }

  if (ph !== null && ph >= 6.2 && ph <= 7.8) {
    addReason("mustard", `pH around ${formatSoilMetricValue(metrics.ph)} is suitable for mustard and reduces the risk of strong acidity stress.`, 16);
    addReason("cotton", `Cotton can fit this pH range better than crops that prefer stronger acidity.`, 10);
  }

  if (ph !== null && ph > 7.8) {
    addReason("mustard", `The slightly alkaline reaction is often easier to manage for mustard than for acid-loving crops.`, 10);
    addReason("gram", `Gram can handle slightly alkaline soil better than crops that are more sensitive to micronutrient lock-up.`, 8);
  }

  if (cec !== null && cec >= 12) {
    addReason("sugarcane", `CEC is around ${formatSoilMetricValue(metrics.cec)}, suggesting better nutrient-holding capacity for a heavy feeder like sugarcane.`, 16);
    addReason("cotton", `This nutrient-holding capacity supports steadier feeding through cotton's longer growing period.`, 14);
    addReason("rice", `Stronger nutrient holding can support rice better where repeated feeding would otherwise be lost.`, 6);
  }

  if (cec !== null && cec < 12) {
    addReason("maize", `Lower CEC means split fertilization will matter, but maize still fits if nutrients are managed in smaller doses.`, 8);
    addReason("mustard", `Mustard is often easier to manage than heavy-feeding crops when nutrient holding is limited.`, 8);
    addReason("gram", `Gram can be a better fit than heavy-feeding crops when the soil holds fewer nutrients.`, 8);
  }

  return candidates
    .map((candidate) => ({
      crop: candidate.crop,
      reason: candidate.reasons.length > 0
        ? `${getSoilRecommendedCropLabel(candidate.crop)} is recommended because ${candidate.reasons.join(" ")}`
        : `${getSoilRecommendedCropLabel(candidate.crop)} is a workable option for ${location}, but a local soil test should still confirm drainage, pH, and nutrient-holding conditions before major planning.`,
      priority: candidate.priority,
    }))
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);
};

const buildFallbackSoilRecommendations = (location: string, crops: string[], metrics: SoilMetrics): SoilRecommendation[] => {
  const recommendations: SoilRecommendation[] = [];
  const cropLabel = crops.length > 0 ? crops.slice(0, 3).join(", ") : "your crops";

  if (Number.isFinite(metrics.ph.value) && (metrics.ph.value as number) < 5.8) {
    recommendations.push({
      title: "Correct acidic soil reaction",
      description: `pH is around ${formatSoilMetricValue(metrics.ph)}. Apply lime only after a local soil-test recommendation and avoid overusing nitrogen so ${cropLabel} can take nutrients better.`,
      priority: 100,
    });
  }

  if (Number.isFinite(metrics.ph.value) && (metrics.ph.value as number) > 7.8) {
    recommendations.push({
      title: "Watch micronutrients in alkaline soil",
      description: `Soil pH is about ${formatSoilMetricValue(metrics.ph)}. Use compost, split fertilizer doses, and monitor zinc/iron deficiency symptoms in ${cropLabel}.`,
      priority: 95,
    });
  }

  if (Number.isFinite(metrics.clay.value) && (metrics.clay.value as number) >= 40) {
    recommendations.push({
      title: "Improve drainage before heavy irrigation",
      description: `Clay is about ${formatSoilMetricValue(metrics.clay)}, so water can stay longer in the root zone. Keep drainage channels open and avoid field operations when soil is sticky.`,
      priority: 90,
    });
  }

  if (Number.isFinite(metrics.sand.value) && (metrics.sand.value as number) >= 60) {
    recommendations.push({
      title: "Use smaller, more frequent irrigation",
      description: `Sand is about ${formatSoilMetricValue(metrics.sand)}, which usually drains fast. Mulch well and split irrigation so moisture stays available to ${cropLabel}.`,
      priority: 88,
    });
  }

  if (Number.isFinite(metrics.cec.value) && (metrics.cec.value as number) < 12) {
    recommendations.push({
      title: "Split nutrients to reduce losses",
      description: `CEC is around ${formatSoilMetricValue(metrics.cec)}, suggesting lower nutrient holding. Prefer smaller split fertilizer doses and combine them with organic matter.`,
      priority: 82,
    });
  }

  if (recommendations.length === 0 && countAvailableSoilMetrics(metrics) > 0) {
    recommendations.push({
      title: "Maintain balanced soil structure",
      description: `The available SoilGrids values for ${location} do not show a single major topsoil stress. Keep organic matter inputs regular and align irrigation with crop stage for ${cropLabel}.`,
      priority: 70,
    });
  }

  recommendations.push({
    title: "Confirm with a field soil test before major input changes",
    description: `Global SoilGrids data is useful for planning, but fertilizer and amendment decisions for ${location} should still be confirmed with a local soil test and crop stage check.`,
    priority: 40,
  });

  if (countAvailableSoilMetrics(metrics) === 0) {
    recommendations.unshift(
      {
        title: "Start with moisture and drainage checks",
        description: `Detailed soil values were unavailable for ${location}, so begin with a simple field check for water stagnation, cracking, or very fast drying before changing inputs.`,
        priority: 80,
      },
      {
        title: "Build soil health with compost or crop residue",
        description: `Add stable organic matter to improve structure, moisture buffering, and nutrient supply for ${cropLabel} while you arrange a local soil test.`,
        priority: 72,
      }
    );
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 4);
};

const buildSoilSummary = (location: string, metrics: SoilMetrics) => {
  if (countAvailableSoilMetrics(metrics) === 0) {
    return `SoilGrids could not return enough measured soil values for ${location} right now, so this advisory uses safe soil-care fallback guidance.`;
  }

  const texture = describeSoilTexture(metrics);
  const phDescription = describeSoilPh(metrics.ph.value);
  const sentences = [
    texture
      ? `Topsoil near ${location} looks ${texture}.`
      : `Topsoil near ${location} has partial SoilGrids coverage.`,
  ];

  if (Number.isFinite(metrics.ph.value)) {
    sentences.push(`Measured pH is about ${formatSoilMetricValue(metrics.ph)}${phDescription ? `, which is ${phDescription}` : ""}.`);
  }

  if (Number.isFinite(metrics.cec.value)) {
    sentences.push(`Estimated nutrient-holding capacity is around ${formatSoilMetricValue(metrics.cec)}.`);
  }

  return sentences.join(" ");
};

const buildSoilAdvisory = (location: string, crops: string[], recommendations: SoilRecommendation[]) => {
  const cropLabel = crops.length > 0 ? crops.slice(0, 3).join(", ") : "your crops";
  const firstRecommendation = recommendations[0];

  if (!firstRecommendation) {
    return `Use a local soil test before major fertilizer or amendment changes in ${location}.`;
  }

  return `Priority for ${cropLabel} near ${location}: ${firstRecommendation.title}. ${firstRecommendation.description}`;
};

const buildFallbackSoilInsights = (
  location: string,
  crops: string[],
  metrics: SoilMetrics = createEmptySoilMetrics(),
  source: SoilInsightSource = "fallback"
): SoilInsights => {
  const normalizedLocation = location || "your area";
  const recommendations = buildFallbackSoilRecommendations(normalizedLocation, crops, metrics);
  const hasMeasuredData = countAvailableSoilMetrics(metrics) > 0;

  return {
    location: normalizedLocation,
    source: hasMeasuredData && source === "fallback" ? "soilgrids" : source,
    summary: buildSoilSummary(normalizedLocation, metrics),
    advisory: buildSoilAdvisory(normalizedLocation, crops, recommendations),
    recommendations,
    recommendedCrops: buildFallbackSoilCropRecommendations(normalizedLocation, metrics),
    metrics,
  };
};

const buildPersonalizationSummary = (profile?: PersonalizedNewsProfile) => {
  const location = profile?.location?.trim();
  const crops = Array.isArray(profile?.crops)
    ? profile.crops.map((crop) => normalizeNewsTopic(String(crop))).filter(Boolean).slice(0, 3)
    : [];

  if (location && crops.length > 0) {
    return `${location} • ${crops.join(", ")}`;
  }

  if (location) {
    return location;
  }

  if (crops.length > 0) {
    return crops.join(", ");
  }

  return "Indian farming";
};

const padDatePart = (value: number) => String(value).padStart(2, "0");

const getIsoWeekPeriodKey = (date: Date) => {
  const workingDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = workingDate.getUTCDay() || 7;
  workingDate.setUTCDate(workingDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(workingDate.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil((((workingDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${workingDate.getUTCFullYear()}-W${padDatePart(weekNumber)}`;
};

const getNewsSectionPeriodKey = (sectionKey: NewsSectionKey, currentDate = new Date()) => {
  const year = currentDate.getUTCFullYear();
  const month = padDatePart(currentDate.getUTCMonth() + 1);
  const day = padDatePart(currentDate.getUTCDate());

  switch (NEWS_SECTION_REFRESH_CADENCE[sectionKey]) {
    case "monthly":
      return `${year}-${month}`;
    case "weekly":
      return getIsoWeekPeriodKey(currentDate);
    case "daily":
    default:
      return `${year}-${month}-${day}`;
  }
};

const getPersonalizedNewsCacheStore = (): PersonalizedNewsCacheStore => {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(PERSONALIZED_NEWS_CACHE_STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed as PersonalizedNewsCacheStore : {};
  } catch {
    return {};
  }
};

const setPersonalizedNewsCacheStore = (store: PersonalizedNewsCacheStore) => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (Object.keys(store).length === 0) {
      window.localStorage.removeItem(PERSONALIZED_NEWS_CACHE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(PERSONALIZED_NEWS_CACHE_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore storage failures and continue without persistent news caching.
  }
};

const clearPersonalizedNewsCacheStore = () => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(PERSONALIZED_NEWS_CACHE_STORAGE_KEY);
  } catch {
    // Ignore storage failures in cleanup flows.
  }
};

const buildPersonalizedNewsCacheScopeKey = (
  profile: PersonalizedNewsProfile | undefined,
  sourceMode: "fallback" | "newsapi"
) => {
  const location = String(profile?.location || "").trim().toLowerCase();
  const language = String(profile?.language || "en").trim().toLowerCase();
  const crops = Array.isArray(profile?.crops)
    ? profile.crops
      .map((crop) => normalizeNewsTopic(String(crop)).toLowerCase())
      .filter(Boolean)
      .sort()
    : [];

  return JSON.stringify({
    sourceMode,
    language,
    location,
    crops,
  });
};

const fetchSoilGridsMetrics = async (coordinates: Coordinates) => {
  const cacheKey = getSoilGridsCacheKey(coordinates);
  const now = Date.now();
  const cached = soilGridsMetricsCache.get(cacheKey);
  const persistentFailureUntil = getSoilGridsPersistentFailureUntil();

  if (persistentFailureUntil && persistentFailureUntil > now) {
    soilGridsMetricsCache.set(cacheKey, {
      status: "failed",
      expiresAt: persistentFailureUntil,
    });

    throw new Error("SoilGrids temporarily unavailable");
  }

  if (cached && cached.expiresAt > now) {
    if (cached.status === "resolved") {
      return cached.metrics;
    }

    if (cached.status === "pending") {
      return cached.promise;
    }

    throw new Error("SoilGrids temporarily unavailable");
  }

  const params = new URLSearchParams({
    lon: String(coordinates.lng),
    lat: String(coordinates.lat),
    value: "mean",
  });

  SOILGRIDS_PROPERTIES.forEach((property) => params.append("property", property));
  SOILGRIDS_DEPTHS.forEach((depth) => params.append("depth", depth));

  const requestPromise = (async () => {
    const response = await fetch(`${SOILGRIDS_API_HOST}/soilgrids/v2.0/properties/query?${params.toString()}`);
    if (!response.ok) {
      const error = new Error(`SoilGrids failed with status ${response.status}`) as Error & { status?: number };
      error.status = response.status;
      throw error;
    }

    const data = (await response.json()) as {
      properties?: {
        layers?: SoilGridsLayer[];
      };
    };

    return normalizeSoilMetrics(Array.isArray(data?.properties?.layers) ? data.properties.layers : []);
  })();

  soilGridsMetricsCache.set(cacheKey, {
    status: "pending",
    promise: requestPromise,
    expiresAt: now + SOILGRIDS_FAILURE_COOLDOWN_MS,
  });

  try {
    const metrics = await requestPromise;
    setSoilGridsPersistentFailureUntil(null);

    soilGridsMetricsCache.set(cacheKey, {
      status: "resolved",
      metrics,
      expiresAt: Date.now() + SOILGRIDS_SUCCESS_CACHE_MS,
    });

    return metrics;
  } catch (error) {
    if (shouldPersistSoilGridsFailure(error)) {
      setSoilGridsPersistentFailureUntil(Date.now() + SOILGRIDS_FAILURE_COOLDOWN_MS);
    }

    soilGridsMetricsCache.set(cacheKey, {
      status: "failed",
      expiresAt: Date.now() + SOILGRIDS_FAILURE_COOLDOWN_MS,
    });

    throw error;
  }
};

export const getSoilInsights = async (request?: SoilInsightRequest): Promise<SoilInsights> => {
  const requestedLocation = request?.location?.trim();
  const location = requestedLocation || "your area";
  const crops = Array.isArray(request?.crops)
    ? request.crops.map((crop) => normalizeNewsTopic(String(crop))).filter(Boolean).slice(0, 6)
    : [];
  const providedCoordinates = request?.coordinates;

  if (!requestedLocation && !hasValidCoordinates(providedCoordinates)) {
    return buildFallbackSoilInsights("your area", crops);
  }

  try {
    const coordinates = hasValidCoordinates(providedCoordinates)
      ? { latitude: providedCoordinates.lat, longitude: providedCoordinates.lng }
      : requestedLocation
        ? await fetchCoordinatesForLocation(requestedLocation)
        : null;

    if (!coordinates) {
      throw new Error("Soil geocoding failed");
    }

    const metrics = await fetchSoilGridsMetrics({ lat: coordinates.latitude, lng: coordinates.longitude });
    return buildFallbackSoilInsights(location, crops, metrics, "soilgrids");
  } catch {
    return buildFallbackSoilInsights(location, crops);
  }
};

const buildFallbackNewsPlans = (profile?: PersonalizedNewsProfile): NewsSectionPlan[] => {
  const summary = buildPersonalizationSummary(profile);
  const location = profile?.location?.trim() || "India";
  const cropTerms = Array.isArray(profile?.crops)
    ? profile.crops.map((crop) => normalizeNewsTopic(String(crop))).filter(Boolean).slice(0, 4)
    : [];
  const cropPhrase = cropTerms.length > 0 ? cropTerms.join(" ") : "crop";

  return [
    {
      key: "highlights",
      label: "Monthly News",
      description: `Monthly agriculture roundups and seasonal planning updates matched to ${summary}.`,
      query: `${location} monthly agriculture farming report ${cropPhrase} India`,
    },
    {
      key: "stories",
      label: "Success News",
      description: `Weekly farmer success stories and innovations relevant to ${summary}.`,
      query: `${location} farmer success story ${cropPhrase} agriculture India`,
    },
    {
      key: "tips",
      label: "Tip News",
      description: `Daily actionable farming advice for ${cropPhrase} near ${location}.`,
      query: `${cropPhrase} farming tips advisory ${location} India`,
    },
    {
      key: "events",
      label: "Daily News",
      description: `Daily agriculture headlines, weather watch, and policy updates for ${location}.`,
      query: `${location} daily agriculture farming weather market update India`,
    },
  ];
};

const buildFallbackPersonalizedNews = (profile?: PersonalizedNewsProfile): PersonalizedNewsSection[] => {
  const summary = buildPersonalizationSummary(profile);
  const location = profile?.location?.trim() || "your area";
  const crops = Array.isArray(profile?.crops)
    ? profile.crops.map((crop) => normalizeNewsTopic(String(crop))).filter(Boolean)
    : [];
  const cropLabel = crops.length > 0 ? crops.slice(0, 3).join(", ") : "your crops";
  const plans = buildFallbackNewsPlans(profile);
  const now = new Date().toISOString();

  const sectionArticles: Record<NewsSectionKey, NewsArticle[]> = {
    highlights: [
      {
        title: `${location}: monthly farming outlook`,
        description: `Track monthly farming conditions, market movement, and crop planning updates for ${summary}.`,
        url: "#",
        imageUrl: "",
        publishedAt: now,
        source: "Farm Companion",
      },
      {
        title: `${cropLabel}: monthly mandi and season watch`,
        description: `A monthly roundup of crop prices, sowing conditions, and agriculture policy signals for ${cropLabel}.`,
        url: "#",
        imageUrl: "",
        publishedAt: now,
        source: "Farm Companion",
      },
    ],
    stories: [
      {
        title: `Weekly farmer success stories near ${location}`,
        description: `See how farmers like you are improving yield, water use, and profits around ${location} this week.`,
        url: "#",
        imageUrl: "",
        publishedAt: now,
        source: "Farm Companion",
      },
      {
        title: `Better income ideas for ${cropLabel}`,
        description: `Learn from farmers who diversified crops, improved storage, or adopted better practices for ${cropLabel}.`,
        url: "#",
        imageUrl: "",
        publishedAt: now,
        source: "Farm Companion",
      },
    ],
    tips: [
      {
        title: `Daily field tips for ${cropLabel}`,
        description: `Daily reminders for irrigation, nutrient timing, and pest monitoring suited to ${summary}.`,
        url: "#",
        imageUrl: "",
        publishedAt: now,
        source: "Farm Companion",
      },
      {
        title: `Today’s farm checklist for ${location}`,
        description: `Use local weather, soil care, and crop-stage planning to make better farming decisions today.`,
        url: "#",
        imageUrl: "",
        publishedAt: now,
        source: "Farm Companion",
      },
    ],
    events: [
      {
        title: `Today’s agriculture headlines for ${location}`,
        description: `Watch daily agriculture headlines, weather risk updates, and government announcements near you.`,
        url: "#",
        imageUrl: "",
        publishedAt: now,
        source: "Farm Companion",
      },
      {
        title: `Daily market and policy watch for ${location}`,
        description: `Track fresh crop-market moves, rainfall developments, and support measures that may affect farmers in ${location}.`,
        url: "#",
        imageUrl: "",
        publishedAt: now,
        source: "Farm Companion",
      },
    ],
  };

  return plans.map((plan) => ({
    ...plan,
    articles: sectionArticles[plan.key],
  }));
};

const mapNewsArticles = (articles: Array<Record<string, any>>): NewsArticle[] => {
  return articles
    .filter((article) => article && typeof article.title === "string")
    .map((article) => ({
      title: String(article.title || "Untitled article"),
      description: String(article.description || article.content || "No description available."),
      url: String(article.url || "#"),
      imageUrl: String(article.urlToImage || ""),
      publishedAt: String(article.publishedAt || new Date().toISOString()),
      source: String(article?.source?.name || "News"),
    }));
};

const fetchNewsArticlesForQuery = async (query: string, apiKey: string) => {
  const response = await fetch(
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&searchIn=title,description&apiKey=${encodeURIComponent(apiKey)}&pageSize=${NEWS_API_PAGE_SIZE}`
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    articles?: Array<Record<string, any>>;
  };

  return Array.isArray(data.articles) ? mapNewsArticles(data.articles) : [];
};

export const getPersonalizedFarmingNews = async (profile?: PersonalizedNewsProfile): Promise<PersonalizedNewsResult> => {
  const personalizationSummary = buildPersonalizationSummary(profile);
  const newsApiKey = getNewsApiKey();
  const fallbackSections = buildFallbackPersonalizedNews(profile);
  const plans = buildFallbackNewsPlans(profile);
  const cacheScopeKey = buildPersonalizedNewsCacheScopeKey(profile, newsApiKey ? "newsapi" : "fallback");
  const cacheStore = getPersonalizedNewsCacheStore();
  let cacheChanged = false;

  const getCachedSection = (sectionKey: NewsSectionKey, periodKey: string) => {
    const entry = cacheStore[cacheScopeKey]?.[sectionKey];
    return entry?.periodKey === periodKey ? entry.section : null;
  };

  const setCachedSection = (sectionKey: NewsSectionKey, periodKey: string, section: PersonalizedNewsSection) => {
    cacheStore[cacheScopeKey] = cacheStore[cacheScopeKey] || {};
    cacheStore[cacheScopeKey]![sectionKey] = {
      periodKey,
      cachedAt: new Date().toISOString(),
      section,
    };
    cacheChanged = true;
  };

  const sections = await Promise.all(
    plans.map(async (plan, index) => {
      const periodKey = getNewsSectionPeriodKey(plan.key);
      const cachedSection = getCachedSection(plan.key, periodKey);
      if (cachedSection) {
        return cachedSection;
      }

      const fallbackSection = fallbackSections[index];

      if (!newsApiKey) {
        setCachedSection(plan.key, periodKey, fallbackSection);
        return fallbackSection;
      }

      try {
        const articles = await fetchNewsArticlesForQuery(plan.query, newsApiKey);
        const nextSection: PersonalizedNewsSection = {
          ...plan,
          articles: articles.length > 0 ? articles : fallbackSection.articles,
        };
        setCachedSection(plan.key, periodKey, nextSection);
        return nextSection;
      } catch {
        setCachedSection(plan.key, periodKey, fallbackSection);
        return fallbackSection;
      }
    })
  );

  if (cacheChanged) {
    setPersonalizedNewsCacheStore(cacheStore);
  }

  const hasLiveArticles = sections.some((section) => section.articles.some((article) => article.url !== "#"));

  return {
    sections,
    source: hasLiveArticles ? "newsapi" : "fallback",
    personalizationSummary,
  };
};

const fetchMarketPage = async (apiKey: string, offset: number) => {
  const response = await fetch(
    `${MARKET_API_HOST}/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=${encodeURIComponent(apiKey)}&format=json&limit=${MARKET_API_PAGE_SIZE}&offset=${offset}`
  );

  if (!response.ok) {
    throw new Error(`Market API failed with status ${response.status}`);
  }

  const data = await response.json();
  const records = Array.isArray(data) ? data : Array.isArray(data?.records) ? data.records : [];

  return transformMarketRecords(records);
};

export const hasValidCoordinates = (coordinates?: Coordinates | null): coordinates is Coordinates => {
  return Boolean(
    coordinates &&
      Number.isFinite(coordinates.lat) &&
      Number.isFinite(coordinates.lng) &&
      !(coordinates.lat === 0 && coordinates.lng === 0)
  );
};

const buildWeatherLocationQueries = (location: string) => {
  const parts = normalizeLocationParts(location);
  const queries = [
    location.trim(),
    parts.slice(0, 3).join(", "),
    parts.slice(0, 2).join(", "),
    parts[0],
  ].filter(Boolean);

  return [...new Set(queries)];
};

export const extractStateFromLocation = (location: string): string | null => {
  const parts = normalizeLocationParts(location);

  for (const part of parts) {
    if (INDIAN_STATES.includes(part)) {
      return part;
    }
  }

  const city = parts[0];
  if (city) {
    for (const [cityKey, stateName] of Object.entries(CITY_TO_STATE)) {
      if (city.includes(cityKey)) {
        return stateName;
      }
    }
  }

  const fallback = [...parts]
    .reverse()
    .find((part) => !/^\d+$/.test(part) && part !== "india" && !part.includes("metropolitan"));

  return fallback ?? null;
};

export const mapWeatherCodeToCondition = (weatherCode?: number): WeatherData["condition"] => {
  if (weatherCode === 0 || weatherCode === 1) return "sunny";
  if (weatherCode === 2 || weatherCode === 3 || weatherCode === 45 || weatherCode === 48) return "cloudy";
  if (weatherCode !== undefined && weatherCode >= 51) return "rainy";
  return "cloudy";
};

const WEATHER_ALERT_MESSAGES: Record<WeatherAlertLanguage, {
  severeStorm: string;
  floodRisk: string;
  heavyRain: string;
  strongWind: string;
  heat: string;
  rainWatch: string;
}> = {
  en: {
    severeStorm: "Severe storm alert: thunderstorms are likely. Avoid field work and secure equipment.",
    floodRisk: "Flood risk alert: intense rain may cause flooding or severe waterlogging. Move equipment, protect seedbeds, and improve drainage urgently.",
    heavyRain: "Heavy rain alert: waterlogging is possible. Improve drainage and avoid spraying for now.",
    strongWind: "Strong wind alert: support tall crops and secure protective covers.",
    heat: "Heat alert: high temperatures may stress crops. Irrigate in the early morning or evening.",
    rainWatch: "Rain watch: showers are likely soon. Plan irrigation and spraying carefully.",
  },
  hi: {
    severeStorm: "गंभीर तूफान चेतावनी: आंधी-तूफान की संभावना है। खेत का काम टालें और उपकरण सुरक्षित रखें।",
    floodRisk: "बाढ़ जोखिम चेतावनी: बहुत तेज़ बारिश से बाढ़ या गंभीर जलभराव हो सकता है। उपकरण सुरक्षित करें, नर्सरी बचाएँ और निकासी तुरंत सुधारें।",
    heavyRain: "भारी बारिश चेतावनी: खेत में जलभराव हो सकता है। निकासी सुधारें और अभी छिड़काव टालें।",
    strongWind: "तेज़ हवा चेतावनी: ऊँची फसलों को सहारा दें और सुरक्षात्मक ढकाव सुरक्षित करें।",
    heat: "गर्मी चेतावनी: अधिक तापमान फसलों पर तनाव डाल सकता है। सुबह या शाम सिंचाई करें।",
    rainWatch: "बारिश की चेतावनी: जल्द वर्षा हो सकती है। सिंचाई और छिड़काव की योजना सावधानी से बनाएं।",
  },
  as: {
    severeStorm: "তীব্ৰ ঝড় সতর্কতা: বজ্ৰ-ধুমুহাৰ সম্ভাৱনা আছে। খেতিৰ কাম পিছুৱাই ৰাখক আৰু সঁজুলি সুৰক্ষিত কৰক।",
    floodRisk: "বানৰ ঝুঁকি সতর্কতা: অতিমাত্ৰা বৰষুণে বান বা তীব্ৰ পানী জমা কৰিব পাৰে। সঁজুলি সুৰক্ষিত কৰক, চারা বচাওক আৰু পানী ওলাই যোৱাৰ ব্যৱস্থা তৎক্ষণাত ভাল কৰক।",
    heavyRain: "ধাৰাসাৰ বৰষুণ সতর্কতা: খেতিত পানী জমা হব পাৰে। নিষ্কাশন ভাল কৰক আৰু এতিয়া স্প্রে নকৰিব।",
    strongWind: "তীব্ৰ বতাহ সতর্কতা: দীঘলীয়া শস্যক সহায় দিয়ক আৰু সুৰক্ষা আৱৰণ সুৰক্ষিত কৰক।",
    heat: "গৰমৰ সতর্কতা: অধিক তাপত শস্য চাপত পৰিব পাৰে। পুৱাতে বা সন্ধিয়াত সেচ দিয়ক।",
    rainWatch: "বৰষুণৰ সতর্কতা: সোনকালে বৰষুণ হব পাৰে। সেচ আৰু স্প্ৰেৰ সময় সাৱধানে ঠিক কৰক।",
  },
};

const normalizeWeatherAlertLanguage = (languageCode?: string): WeatherAlertLanguage => {
  const normalized = String(languageCode || "en").trim().toLowerCase();

  if (normalized.startsWith("hi")) {
    return "hi";
  }

  if (normalized.startsWith("as")) {
    return "as";
  }

  return "en";
};

const buildWeatherAlert = ({
  weatherCode,
  temp,
  humidity,
  wind,
  dailyForecast,
  languageCode,
}: {
  weatherCode?: number;
  temp: number;
  humidity: number;
  wind: number;
  dailyForecast: WeatherForecastDay[];
  languageCode?: string;
}) => {
  const messages = WEATHER_ALERT_MESSAGES[normalizeWeatherAlertLanguage(languageCode)];
  const numericWeatherCode = Number(weatherCode);
  const mappedCondition = mapWeatherCodeToCondition(weatherCode);

  const forecastFloodRisk = dailyForecast.some((day) => {
    const precipitationChance = Number(day.precipitationChance || 0);
    const forecastWind = Number(day.wind || 0);
    const forecastHumidity = Number(day.humidity || 0);
    return day.condition === "rainy" && precipitationChance >= 90 && (forecastWind >= 30 || forecastHumidity >= 85);
  });

  if ([95, 96, 99].includes(numericWeatherCode)) {
    return messages.severeStorm;
  }

  if (
    [82, 86].includes(numericWeatherCode)
    || (mappedCondition === "rainy" && humidity >= 90 && wind >= 30)
    || forecastFloodRisk
  ) {
    return messages.floodRisk;
  }

  if (
    [65, 67].includes(numericWeatherCode)
    || (mappedCondition === "rainy" && (humidity >= 85 || wind >= 25))
  ) {
    return messages.heavyRain;
  }

  if (wind >= 35) {
    return messages.strongWind;
  }

  if (temp >= 39) {
    return messages.heat;
  }

  const forecastRainRisk = dailyForecast.some((day) => {
    const precipitationChance = Number(day.precipitationChance || 0);
    const forecastWind = Number(day.wind || 0);
    return day.condition === "rainy" && (precipitationChance >= 70 || forecastWind >= 30);
  });

  if (forecastRainRisk) {
    return messages.rainWatch;
  }

  return null;
};

const getGoogleMapsApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || "";

type VisionLabelMatch = {
  term: string;
  score: number;
};

type CropIssuePattern = {
  keywords: string[];
  disease: string;
  diseaseHi: string;
  severity: CropDiseaseDetectionSeverity;
};

type CropIdentity = Pick<CropDiseaseDetectionResult, "plantName" | "plantNameHi">;

type CropIdentityPattern = CropIdentity & {
  keywords: string[];
};

const CROP_ISSUE_PATTERNS: CropIssuePattern[] = [
  {
    keywords: ["powdery mildew", "mildew"],
    disease: "Powdery Mildew",
    diseaseHi: "चूर्णिल फफूंदी",
    severity: "high",
  },
  {
    keywords: ["leaf blight", "blight"],
    disease: "Leaf Blight",
    diseaseHi: "पत्ती झुलसा",
    severity: "high",
  },
  {
    keywords: ["rust", "plant rust"],
    disease: "Rust Disease",
    diseaseHi: "रतुआ रोग",
    severity: "high",
  },
  {
    keywords: ["leaf spot", "brown spot", "spot disease"],
    disease: "Leaf Spot",
    diseaseHi: "पत्ती धब्बा",
    severity: "medium",
  },
  {
    keywords: ["aphid", "aphids"],
    disease: "Aphid Attack",
    diseaseHi: "माहू प्रकोप",
    severity: "medium",
  },
  {
    keywords: ["pest", "insect", "caterpillar", "mite"],
    disease: "Pest Attack",
    diseaseHi: "कीट प्रकोप",
    severity: "medium",
  },
  {
    keywords: ["nutrient deficiency", "chlorosis", "yellow leaf", "yellowing", "yellow"],
    disease: "Nutrient Deficiency",
    diseaseHi: "पोषक तत्व की कमी",
    severity: "medium",
  },
  {
    keywords: ["wilt", "wilting"],
    disease: "Wilting Stress",
    diseaseHi: "मुरझाने का तनाव",
    severity: "medium",
  },
  {
    keywords: ["dry leaf", "dry", "dehydrated"],
    disease: "Water Stress",
    diseaseHi: "पानी की कमी का तनाव",
    severity: "medium",
  },
  {
    keywords: ["healthy", "fresh leaf", "green leaf", "leaf", "plant", "crop"],
    disease: "Healthy",
    diseaseHi: "स्वस्थ",
    severity: "low",
  },
];

const DEFAULT_CROP_IDENTITY: CropIdentity = {
  plantName: "Plant",
  plantNameHi: "पौधा",
};

const CROP_IDENTITY_PATTERNS: CropIdentityPattern[] = [
  { plantName: "Rice", plantNameHi: "धान", keywords: ["rice", "paddy"] },
  { plantName: "Wheat", plantNameHi: "गेहूं", keywords: ["wheat"] },
  { plantName: "Maize", plantNameHi: "मक्का", keywords: ["maize", "corn"] },
  { plantName: "Sugarcane", plantNameHi: "गन्ना", keywords: ["sugarcane", "sugar cane"] },
  { plantName: "Mustard", plantNameHi: "सरसों", keywords: ["mustard"] },
  { plantName: "Gram", plantNameHi: "चना", keywords: ["gram", "chickpea", "chana"] },
  { plantName: "Cotton", plantNameHi: "कपास", keywords: ["cotton"] },
  { plantName: "Carrot", plantNameHi: "गाजर", keywords: ["carrot"] },
  { plantName: "Potato", plantNameHi: "आलू", keywords: ["potato"] },
  { plantName: "Tomato", plantNameHi: "टमाटर", keywords: ["tomato"] },
  { plantName: "Onion", plantNameHi: "प्याज", keywords: ["onion"] },
  { plantName: "Chilli", plantNameHi: "मिर्च", keywords: ["chilli", "chili", "pepper"] },
  { plantName: "Brinjal", plantNameHi: "बैंगन", keywords: ["brinjal", "eggplant", "aubergine"] },
];

const GENERIC_PLANT_LABELS = new Set(["leaf", "leaves", "plant", "crop", "flora", "vegetation", "produce"]);

const normalizeCropScanText = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const toTitleCase = (value: string) => value
  .split(" ")
  .filter(Boolean)
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ");

const isUnconfirmedDisease = (disease?: string | null) => {
  const normalized = normalizeCropScanText(String(disease || ""));
  return normalized === "unknown" || normalized === "condition not confirmed";
};

const getDetectionPatternByText = (value?: string | null) => {
  const normalized = normalizeCropScanText(String(value || ""));
  if (!normalized) {
    return null;
  }

  return CROP_ISSUE_PATTERNS.find((pattern) =>
    normalized === normalizeCropScanText(pattern.disease)
    || pattern.keywords.some((keyword) => normalized.includes(keyword) || keyword.includes(normalized))
  ) || null;
};

const resolveCropIdentityFromText = (value?: string | null): CropIdentity | null => {
  const normalized = normalizeCropScanText(String(value || ""));
  if (!normalized) {
    return null;
  }

  const match = CROP_IDENTITY_PATTERNS.find((pattern) =>
    pattern.keywords.some((keyword) => normalized.includes(keyword))
  );

  return match
    ? { plantName: match.plantName, plantNameHi: match.plantNameHi }
    : null;
};

const resolveFirstInformativePlantLabel = (labels: string[]) => {
  for (const label of labels) {
    const normalized = normalizeCropScanText(label);
    if (!normalized || GENERIC_PLANT_LABELS.has(normalized)) {
      continue;
    }

    const cropIdentity = resolveCropIdentityFromText(normalized);
    if (!cropIdentity && getDetectionPatternByText(normalized)) {
      continue;
    }

    const simplified = normalized
      .replace(/\b(leaf|leaves|plant|crop)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return toTitleCase(simplified || normalized);
  }

  return "";
};

const resolveCropIdentityFromLabels = (labels: string[]): CropIdentity | null => {
  for (const label of labels) {
    const match = resolveCropIdentityFromText(label);
    if (match) {
      return match;
    }
  }

  const inferredLabel = resolveFirstInformativePlantLabel(labels);
  return inferredLabel
    ? {
      plantName: inferredLabel,
      plantNameHi: inferredLabel,
    }
    : null;
};

const resolveCropIdentity = (params: {
  plantName?: string | null;
  plantNameHi?: string | null;
  labels?: string[];
  fileHints?: string | null;
}): CropIdentity => {
  const labels = Array.isArray(params.labels) ? params.labels : [];
  const knownIdentity = resolveCropIdentityFromText(`${params.plantName || ""} ${params.fileHints || ""}`)
    || resolveCropIdentityFromLabels(labels)
    || resolveCropIdentityFromText(params.fileHints);

  if (knownIdentity) {
    return knownIdentity;
  }

  const plantName = String(params.plantName || "").trim() || resolveFirstInformativePlantLabel(labels) || DEFAULT_CROP_IDENTITY.plantName;
  const plantNameHi = String(params.plantNameHi || "").trim() || (plantName === DEFAULT_CROP_IDENTITY.plantName ? DEFAULT_CROP_IDENTITY.plantNameHi : plantName);

  return { plantName, plantNameHi };
};

const normalizeDetectionSeverity = (value?: string | null): CropDiseaseDetectionSeverity => {
  const normalized = normalizeCropScanText(String(value || ""));
  if (normalized === "low") return "low";
  if (normalized === "medium") return "medium";
  if (normalized === "high") return "high";
  return "unknown";
};

const getUnconfirmedCropRecommendations = () => [
  "Take a clearer close-up photo of one affected leaf in daylight and scan again.",
  "If the crop still looks stressed, consult a local agriculture expert for a manual field check.",
];

const safeCreateObjectUrl = (file: File) => {
  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    return URL.createObjectURL(file);
  }

  return "";
};

const fileToBase64Content = async (file: File) => {
  if (typeof file.arrayBuffer === "function") {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = "";
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
      const slice = bytes.slice(index, index + chunkSize);
      binary += String.fromCharCode(...slice);
    }

    return btoa(binary);
  }

  if (typeof FileReader === "undefined") {
    throw new Error("Unable to read image content for Google Cloud Vision AI.");
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });

  const commaIndex = dataUrl.indexOf(",");
  return commaIndex >= 0 ? dataUrl.slice(commaIndex + 1) : dataUrl;
};

const readFileAsDataUrl = (file: File) => {
  if (typeof FileReader === "undefined") {
    throw new Error("Unable to read image file.");
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
};

const getPlantNetSupportedMimeType = (file: File) => {
  const mimeType = String(file.type || "").trim().toLowerCase();
  if (mimeType === "image/jpeg" || mimeType === "image/png") {
    return mimeType;
  }

  const extensionMatch = String(file.name || "").trim().toLowerCase().match(/\.([a-z0-9]+)$/);
  const extension = extensionMatch?.[1] || "";
  if (["jpg", "jpeg", "jfif"].includes(extension)) {
    return "image/jpeg";
  }
  if (extension === "png") {
    return "image/png";
  }

  return "";
};

const replaceFileExtension = (fileName: string, nextExtension: string) => {
  const normalizedName = String(fileName || "").trim();
  const baseName = normalizedName ? normalizedName.replace(/\.[^.]+$/, "") : "crop-image";
  return `${baseName}.${nextExtension}`;
};

const createPlantNetUploadFile = async (imageFile: File) => {
  const supportedMimeType = getPlantNetSupportedMimeType(imageFile);
  if (supportedMimeType) {
    if (imageFile.type === supportedMimeType) {
      return imageFile;
    }

    const nextExtension = supportedMimeType === "image/png" ? "png" : "jpg";
    return new File([imageFile], replaceFileExtension(imageFile.name, nextExtension), {
      type: supportedMimeType,
      lastModified: imageFile.lastModified,
    });
  }

  if (typeof document === "undefined" || typeof Image === "undefined") {
    return imageFile;
  }

  try {
    const dataUrl = await readFileAsDataUrl(imageFile);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const nextImage = new Image();
      nextImage.onload = () => resolve(nextImage);
      nextImage.onerror = () => reject(new Error("Unable to decode image file."));
      nextImage.src = dataUrl;
    });

    const canvas = document.createElement("canvas");
    const width = Math.max(1, image.naturalWidth || image.width || 1);
    const height = Math.max(1, image.naturalHeight || image.height || 1);
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context || typeof canvas.toBlob !== "function") {
      return imageFile;
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (value) => {
          if (value) {
            resolve(value);
            return;
          }
          reject(new Error("Unable to convert image file."));
        },
        "image/jpeg",
        0.92
      );
    });

    return new File([blob], replaceFileExtension(imageFile.name, "jpg"), {
      type: "image/jpeg",
      lastModified: imageFile.lastModified,
    });
  } catch {
    return imageFile;
  }
};

const buildCropDetectionResult = (
  imageFile: File,
  values: Omit<CropDiseaseDetectionResult, "imageUrl" | "timestamp">
): CropDiseaseDetectionResult => ({
  ...values,
  confidence: Math.max(0, Math.min(100, Math.round(values.confidence))),
  imageUrl: safeCreateObjectUrl(imageFile),
  timestamp: new Date().toISOString(),
});

const getDetectionPatternByDisease = (disease: string) =>
  CROP_ISSUE_PATTERNS.find((pattern) => pattern.disease === disease);

const buildDetectionSummary = (
  disease: string,
  source: CropDiseaseDetectionSource,
  labels: string[],
  plantName?: string,
  notice?: CropDiseaseDetectionNotice
) => {
  const labelPreview = labels.slice(0, 3).join(", ");
  const cropReference = plantName && plantName !== DEFAULT_CROP_IDENTITY.plantName ? plantName : "this crop";

  if (source === "fallback") {
    const unavailableReason = notice === "plantnet_rate_limited"
      ? "PlantNet image identification is temporarily unavailable because the API limit was reached"
      : notice === "plantnet_no_match"
        ? "PlantNet could not identify a plant species from this photo"
      : notice === "plantnet_unavailable"
        ? "PlantNet image identification was temporarily unavailable"
        : "Advanced image analysis was unavailable";

    if (isUnconfirmedDisease(disease)) {
      return notice === "plantnet_no_match"
        ? `${unavailableReason}, so try a clearer close-up photo of the crop leaves, stem, or whole plant.`
        : `${unavailableReason}, so this scan could not confirm the crop condition from the image.`;
    }

    return `${unavailableReason}, so this result uses a basic fallback estimate${labelPreview ? ` from image hints such as ${labelPreview}` : ""}.`;
  }

  if (source === "plantnet") {
    if (isUnconfirmedDisease(disease)) {
      return plantName && plantName !== DEFAULT_CROP_IDENTITY.plantName
        ? `PlantNet identified ${cropReference}, but could not confirm the crop condition from this photo.`
        : "PlantNet could not confirm the crop condition from this photo.";
    }

    if (disease === "Healthy") {
      return `PlantNet identified ${cropReference}, and the returned labels suggest it looks healthy${labelPreview ? ` with cues such as ${labelPreview}` : ""}.`;
    }

    return `PlantNet identified ${cropReference}, and the returned labels mention signs related to ${disease.toLowerCase()}${labelPreview ? `, including ${labelPreview}` : ""}.`;
  }

  if (disease === "Healthy") {
    return `Google Cloud Vision AI mostly detected healthy plant features on ${cropReference}${labelPreview ? `, such as ${labelPreview}` : ""}.`;
  }

  return `Google Cloud Vision AI found visual signs related to ${disease.toLowerCase()} on ${cropReference}${labelPreview ? `, including ${labelPreview}` : ""}.`;
};

const buildFallbackCropDetection = (
  imageFile: File,
  notice?: CropDiseaseDetectionNotice
): CropDiseaseDetectionResult => {
  const fileHints = normalizeCropScanText(imageFile.name);
  const cropIdentity = resolveCropIdentity({ fileHints });

  const matchedPattern = CROP_ISSUE_PATTERNS.find((pattern) =>
    pattern.keywords.some((keyword) => fileHints.includes(keyword))
  );

  if (!matchedPattern) {
    return buildCropDetectionResult(imageFile, {
      plantName: cropIdentity.plantName,
      plantNameHi: cropIdentity.plantNameHi,
      disease: "Condition not confirmed",
      diseaseHi: "स्थिति की पुष्टि नहीं हुई",
      confidence: 24,
      severity: "unknown",
      recommendations: getUnconfirmedCropRecommendations(),
      source: "fallback",
      summary: buildDetectionSummary("Condition not confirmed", "fallback", [], cropIdentity.plantName, notice),
      labels: [],
      notice,
    });
  }

  const fallbackLabels = [cropIdentity.plantName.toLowerCase(), matchedPattern.keywords[0]]
    .filter((label, index, array) => label && array.indexOf(label) === index && label !== DEFAULT_CROP_IDENTITY.plantName.toLowerCase());

  return buildCropDetectionResult(imageFile, {
    plantName: cropIdentity.plantName,
    plantNameHi: cropIdentity.plantNameHi,
    disease: matchedPattern.disease,
    diseaseHi: matchedPattern.diseaseHi,
    confidence: matchedPattern.severity === "high" ? 72 : matchedPattern.severity === "medium" ? 68 : 70,
    severity: matchedPattern.severity,
    recommendations: getRecommendations(matchedPattern.disease),
    source: "fallback",
    summary: buildDetectionSummary(matchedPattern.disease, "fallback", fallbackLabels, cropIdentity.plantName, notice),
    labels: fallbackLabels,
    notice,
  });
};

const getCropScanErrorStatus = (error: unknown) => {
  if (typeof error !== "object" || error === null || !("status" in error)) {
    return null;
  }

  const status = Number((error as { status?: number }).status);
  return Number.isFinite(status) ? status : null;
};

const isPlantNetNoMatchError = (error: unknown) => {
  if (getCropScanErrorStatus(error) !== 404 || !(error instanceof Error)) {
    return false;
  }

  return normalizeCropScanText(error.message).includes("species not found");
};

const createCropScanRequestError = (message: string, status?: number) => {
  const error = new Error(message) as Error & { status?: number };

  if (Number.isFinite(status)) {
    error.status = status;
  }

  return error;
};

type PlantNetIdentifyResponse = {
  warning?: string;
  bestMatch?: string;
  predictedOrgans?: Array<{
    organ?: string;
    score?: number;
  }>;
  results?: Array<{
    score?: number;
    species?: {
      scientificNameWithoutAuthor?: string;
      scientificName?: string;
      commonNames?: string[];
      genus?: {
        scientificNameWithoutAuthor?: string;
        scientificName?: string;
      };
      family?: {
        scientificNameWithoutAuthor?: string;
        scientificName?: string;
      };
    };
  }>;
};

const collectPlantNetResponseLabels = (data: PlantNetIdentifyResponse) => {
  const labels: string[] = [];
  const seen = new Set<string>();

  const register = (value?: string | null) => {
    const text = String(value || "").trim();
    const normalized = normalizeCropScanText(text);

    if (!text || !normalized || seen.has(normalized)) {
      return;
    }

    seen.add(normalized);
    labels.push(text);
  };

  register(data.bestMatch);
  data.predictedOrgans?.forEach((entry) => register(entry.organ));
  data.results?.slice(0, 3).forEach((result) => {
    const commonNames = Array.isArray(result.species?.commonNames) ? result.species.commonNames : [];
    register(result.species?.scientificNameWithoutAuthor);
    register(result.species?.scientificName);
    commonNames.forEach((name) => register(name));
    register(result.species?.genus?.scientificNameWithoutAuthor);
    register(result.species?.genus?.scientificName);
    register(result.species?.family?.scientificNameWithoutAuthor);
    register(result.species?.family?.scientificName);
  });

  return labels.slice(0, 6);
};

const getPlantNetMatchedPattern = (texts: string[]) => {
  for (const text of texts) {
    const normalized = normalizeCropScanText(text);
    if (!normalized) {
      continue;
    }

    const padded = ` ${normalized} `;
    for (const pattern of CROP_ISSUE_PATTERNS) {
      if (pattern.disease === "Healthy") {
        if (padded.includes(" healthy ")) {
          return pattern;
        }
        continue;
      }

      const matchesPattern = pattern.keywords.some((keyword) => {
        const normalizedKeyword = normalizeCropScanText(keyword);
        return normalizedKeyword && padded.includes(` ${normalizedKeyword} `);
      });

      if (matchesPattern) {
        return pattern;
      }
    }
  }

  return null;
};

const parsePlantNetCropDetectionResponse = (
  data: PlantNetIdentifyResponse,
  imageFile: File
): Omit<CropDiseaseDetectionResult, "imageUrl" | "timestamp"> | null => {
  const responseLabels = collectPlantNetResponseLabels(data);
  const firstResult = Array.isArray(data.results) ? data.results[0] : undefined;
  const commonNames = Array.isArray(firstResult?.species?.commonNames) ? firstResult.species.commonNames : [];
  const fileHints = normalizeCropScanText(imageFile.name);

  if (!data.bestMatch && responseLabels.length === 0 && commonNames.length === 0) {
    return null;
  }

  const cropIdentity = resolveCropIdentity({
    plantName: commonNames[0] || firstResult?.species?.scientificNameWithoutAuthor || firstResult?.species?.scientificName || data.bestMatch,
    labels: responseLabels,
    fileHints,
  });

  const diseasePattern = getPlantNetMatchedPattern([
    data.bestMatch || "",
    firstResult?.species?.scientificNameWithoutAuthor || "",
    firstResult?.species?.scientificName || "",
    ...commonNames,
  ]);
  const topScore = Number(firstResult?.score);
  const disease = diseasePattern?.disease || "Condition not confirmed";
  const confidence = diseasePattern
    ? Number.isFinite(topScore)
      ? Math.max(
        Math.min(Math.round(topScore * 100), 88),
        diseasePattern.severity === "high" ? 74 : diseasePattern.severity === "medium" ? 68 : 70
      )
      : diseasePattern.severity === "high" ? 74 : diseasePattern.severity === "medium" ? 68 : 70
    : Number.isFinite(topScore)
      ? Math.max(42, Math.min(68, Math.round(topScore * 100 * 0.7)))
      : 46;

  return {
    plantName: cropIdentity.plantName,
    plantNameHi: cropIdentity.plantNameHi,
    disease,
    diseaseHi: diseasePattern?.diseaseHi || "स्थिति की पुष्टि नहीं हुई",
    confidence,
    severity: diseasePattern?.severity || "unknown",
    recommendations: diseasePattern ? getRecommendations(disease) : getUnconfirmedCropRecommendations(),
    source: "plantnet",
    summary: buildDetectionSummary(disease, "plantnet", responseLabels, cropIdentity.plantName),
    labels: responseLabels.length > 0 ? responseLabels : [cropIdentity.plantName].filter(Boolean),
  };
};

const fetchPlantNetCropDetection = async (
  imageFile: File
): Promise<Omit<CropDiseaseDetectionResult, "imageUrl" | "timestamp"> | null | "no_match"> => {
  const apiKey = getPlantNetApiKey();
  if (!apiKey) {
    return null;
  }

  const uploadFile = await createPlantNetUploadFile(imageFile);

  const formData = new FormData();
  formData.append("images", uploadFile, uploadFile.name || "crop-image.jpg");
  formData.append("organs", "auto");
  const requestUrl = new URL(
    `${PLANTNET_IDENTIFY_ENDPOINT}/all`,
    typeof window !== "undefined" ? window.location.origin : "http://localhost"
  );
  requestUrl.searchParams.set("api-key", apiKey);
  requestUrl.searchParams.set("lang", "en");
  requestUrl.searchParams.set("nb-results", "3");

  const response = await fetch(requestUrl.toString(), {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let apiMessage = "";

    try {
      const raw = (await response.text()).trim();
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            message?: string;
            detail?: string;
            error?: { message?: string };
          };
          apiMessage = String(parsed.error?.message || parsed.message || parsed.detail || "").trim();
        } catch {
          apiMessage = raw;
        }
      }
    } catch {
      // Ignore response parsing failures and use the HTTP status below.
    }

    const fallbackMessage = response.status === 429
      ? "PlantNet crop scan temporarily unavailable due to quota or rate limit"
      : `PlantNet crop scan failed with status ${response.status}`;
    throw createCropScanRequestError(apiMessage || fallbackMessage, response.status);
  }

  const data = (await response.json()) as PlantNetIdentifyResponse;
  if (data.warning === "species_not_found") {
    return "no_match";
  }

  return parsePlantNetCropDetectionResponse(data, imageFile);
};

const collectVisionLabelMatches = (response?: GoogleCloudVisionAnnotateImageResponse): VisionLabelMatch[] => {
  if (!response) {
    return [];
  }

  const matches = new Map<string, number>();
  const register = (term?: string, score?: number) => {
    const normalized = String(term || "").trim().toLowerCase();
    if (!normalized) {
      return;
    }

    const nextScore = Number.isFinite(score) ? Number(score) : 0;
    const previousScore = matches.get(normalized) || 0;
    matches.set(normalized, Math.max(previousScore, nextScore));
  };

  response.labelAnnotations?.forEach((annotation) => register(annotation.description, annotation.score));
  response.localizedObjectAnnotations?.forEach((annotation) => register(annotation.name, annotation.score));
  response.webDetection?.webEntities?.forEach((annotation) =>
    register(annotation.description, annotation.score ?? annotation.topicality)
  );

  return Array.from(matches.entries())
    .map(([term, score]) => ({ term, score }))
    .sort((left, right) => right.score - left.score);
};

const getVisionColorSignals = (response?: GoogleCloudVisionAnnotateImageResponse) => {
  let greenShare = 0;
  let dryShare = 0;

  response?.imagePropertiesAnnotation?.dominantColors?.colors?.forEach((colorInfo) => {
    const fraction = Number(colorInfo.pixelFraction || 0);
    const red = Number(colorInfo.color?.red || 0);
    const green = Number(colorInfo.color?.green || 0);
    const blue = Number(colorInfo.color?.blue || 0);

    if (green > red * 1.1 && green > blue * 1.1) {
      greenShare += fraction;
    }

    if (red > green * 1.05 && green > blue * 0.9) {
      dryShare += fraction;
    }
  });

  return { greenShare, dryShare };
};

const resolveVisionDetection = (
  response?: GoogleCloudVisionAnnotateImageResponse
): Omit<CropDiseaseDetectionResult, "imageUrl" | "timestamp"> | null => {
  const labelMatches = collectVisionLabelMatches(response);
  const labels = labelMatches.slice(0, 6).map((match) => match.term);
  const combinedTerms = labelMatches.map((match) => match.term).join(" ");
  const cropIdentity = resolveCropIdentity({ labels });

  for (const pattern of CROP_ISSUE_PATTERNS) {
    const matchedLabel = labelMatches.find((match) =>
      pattern.keywords.some((keyword) => match.term.includes(keyword) || combinedTerms.includes(keyword))
    );

    if (!matchedLabel) {
      continue;
    }

    return {
      plantName: cropIdentity.plantName,
      plantNameHi: cropIdentity.plantNameHi,
      disease: pattern.disease,
      diseaseHi: pattern.diseaseHi,
      confidence: Math.max(matchedLabel.score * 100, pattern.severity === "low" ? 75 : 65),
      severity: pattern.severity,
      recommendations: getRecommendations(pattern.disease),
      source: "vision",
      summary: buildDetectionSummary(pattern.disease, "vision", labels, cropIdentity.plantName),
      labels,
    };
  }

  const { greenShare, dryShare } = getVisionColorSignals(response);

  if (dryShare >= 0.3) {
    return {
      plantName: cropIdentity.plantName,
      plantNameHi: cropIdentity.plantNameHi,
      disease: "Water Stress",
      diseaseHi: "पानी की कमी का तनाव",
      confidence: 67,
      severity: "medium",
      recommendations: getRecommendations("Water Stress"),
      source: "vision",
      summary: buildDetectionSummary("Water Stress", "vision", labels, cropIdentity.plantName),
      labels,
    };
  }

  if (greenShare >= 0.18 || labels.some((label) => ["leaf", "plant", "crop"].includes(label))) {
    return {
      plantName: cropIdentity.plantName,
      plantNameHi: cropIdentity.plantNameHi,
      disease: "Healthy",
      diseaseHi: "स्वस्थ",
      confidence: Math.max((labelMatches[0]?.score || 0.72) * 100, 72),
      severity: "low",
      recommendations: getRecommendations("Healthy"),
      source: "vision",
      summary: buildDetectionSummary("Healthy", "vision", labels, cropIdentity.plantName),
      labels,
    };
  }

  return null;
};

const roundIfFinite = (value?: number | null) => (Number.isFinite(value) ? Math.round(value as number) : null);

const humanizeWeatherCondition = (conditionType?: string) => {
  if (!conditionType) {
    return "Forecast";
  }

  return conditionType
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const mapGoogleConditionToWeather = (conditionType?: string, description?: string): WeatherCondition => {
  const normalized = `${conditionType || ""} ${description || ""}`.toLowerCase();

  if (/(rain|shower|storm|snow|sleet|drizzle|thunder|hail|ice)/.test(normalized)) {
    return "rainy";
  }

  if (/(sun|clear)/.test(normalized)) {
    return "sunny";
  }

  return "cloudy";
};

const buildForecastDate = (displayDate?: GoogleWeatherDate) => {
  if (
    Number.isInteger(displayDate?.year) &&
    Number.isInteger(displayDate?.month) &&
    Number.isInteger(displayDate?.day)
  ) {
    const year = String(displayDate?.year);
    const month = String(displayDate?.month).padStart(2, "0");
    const day = String(displayDate?.day).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  return new Date().toISOString().slice(0, 10);
};

const normalizeGoogleForecastDay = (forecastDay: GoogleWeatherForecastDay): WeatherForecastDay => {
  const primaryPart = forecastDay.daytimeForecast || forecastDay.nighttimeForecast;
  const fallbackPart = forecastDay.nighttimeForecast || forecastDay.daytimeForecast;
  const description =
    primaryPart?.weatherCondition?.description?.text ||
    fallbackPart?.weatherCondition?.description?.text ||
    humanizeWeatherCondition(primaryPart?.weatherCondition?.type || fallbackPart?.weatherCondition?.type);

  return {
    date: buildForecastDate(forecastDay.displayDate),
    condition: mapGoogleConditionToWeather(
      primaryPart?.weatherCondition?.type || fallbackPart?.weatherCondition?.type,
      description
    ),
    conditionText: description,
    high: roundIfFinite(forecastDay.maxTemperature?.degrees) ?? DEFAULT_WEATHER.temp,
    low: roundIfFinite(forecastDay.minTemperature?.degrees) ?? DEFAULT_WEATHER.temp,
    precipitationChance:
      roundIfFinite(primaryPart?.precipitation?.probability?.percent) ??
      roundIfFinite(fallbackPart?.precipitation?.probability?.percent),
    humidity: roundIfFinite(primaryPart?.relativeHumidity) ?? roundIfFinite(fallbackPart?.relativeHumidity),
    wind: roundIfFinite(primaryPart?.wind?.speed?.value) ?? roundIfFinite(fallbackPart?.wind?.speed?.value),
  };
};

const fetchGoogleDailyForecast = async (
  coordinates: { latitude: number; longitude: number },
  languageCode = "en"
) => {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    return [];
  }

  const url = new URL(GOOGLE_WEATHER_ENDPOINT);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("location.latitude", String(coordinates.latitude));
  url.searchParams.set("location.longitude", String(coordinates.longitude));
  url.searchParams.set("days", String(GOOGLE_DAILY_FORECAST_DAYS));
  url.searchParams.set("pageSize", String(GOOGLE_DAILY_FORECAST_DAYS));
  url.searchParams.set("unitsSystem", "METRIC");
  url.searchParams.set("languageCode", languageCode || "en");

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Weather daily forecast failed with status ${response.status}`);
  }

  const data = (await response.json()) as GoogleWeatherDailyResponse;
  if (!Array.isArray(data.forecastDays)) {
    throw new Error("Google Weather daily forecast data missing");
  }

  return data.forecastDays.slice(0, GOOGLE_DAILY_FORECAST_DAYS).map(normalizeGoogleForecastDay);
};

const buildDisplayLocation = (result: { name?: string; admin1?: string; country?: string }, fallback: string) => {
  const parts = [result.name, result.admin1, result.country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : fallback;
};

const fetchCoordinatesForLocation = async (location: string) => {
  const queries = buildWeatherLocationQueries(location);

  if (hasGoogleMapsApiKey()) {
    for (const query of queries) {
      try {
        return await geocodeLocationWithGoogleMaps(query, "en");
      } catch {
        // fall through to the next query or fallback provider
      }
    }
  }

  for (const query of queries) {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
    );

    if (!response.ok) {
      continue;
    }

    const data = await response.json();
    const result = data?.results?.[0];
    if (result?.latitude && result?.longitude) {
      return result;
    }
  }

  return null;
};

export const getLocationMatchScore = (item: Pick<MarketItem, "market" | "state">, userLocation: string) => {
  const locationParts = normalizeLocationParts(userLocation);
  const userCity = locationParts[0] ?? "";
  const userState = extractStateFromLocation(userLocation);
  const market = item.market.toLowerCase();
  const state = (item.state || "").toLowerCase();

  let score = 0;

  if (userCity && market.includes(userCity)) {
    score += 3;
  }

  if (userState) {
    const normalizedState = formatStateKey(userState);
    const mappedMarketState = extractStateFromLocation(item.market || "");
    if (state.includes(normalizedState)) {
      score += 2;
    } else if (mappedMarketState === normalizedState) {
      score += 2;
    }
  }

  return score;
};

export const filterAndSortByLocation = (marketData: MarketItem[], userLocation: string) => {
  return [...marketData].sort((a, b) => {
    const scoreDiff = getLocationMatchScore(b, userLocation) - getLocationMatchScore(a, userLocation);
    if (scoreDiff !== 0) {
      return scoreDiff;
    }

    return a.market.localeCompare(b.market);
  });
};

export const getDisasterEventsForLocation = async (request?: DisasterEventRequest): Promise<DisasterEvent[]> => {
  const location = String(request?.location || "").trim();
  const providedCoordinates = request?.coordinates;
  const radiusKm = Number.isFinite(request?.radiusKm) && Number(request?.radiusKm) > 0
    ? Number(request?.radiusKm)
    : EONET_DISASTER_DEFAULT_RADIUS_KM;

  if (!location && !hasValidCoordinates(providedCoordinates)) {
    return [];
  }

  try {
    const coordinateResult = hasValidCoordinates(providedCoordinates)
      ? { latitude: providedCoordinates.lat, longitude: providedCoordinates.lng }
      : location
        ? await fetchCoordinatesForLocation(location)
        : null;

    if (
      !coordinateResult
      || !Number.isFinite(Number(coordinateResult.latitude))
      || !Number.isFinite(Number(coordinateResult.longitude))
    ) {
      return [];
    }

    const target = {
      lat: Number(coordinateResult.latitude),
      lng: Number(coordinateResult.longitude),
    } satisfies Coordinates;

    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);

    const url = new URL(EONET_EVENTS_ENDPOINT);
    url.searchParams.set("status", "all");
    url.searchParams.set("start", formatDateOnly(startDate));
    url.searchParams.set("end", formatDateOnly(endDate));
    url.searchParams.set("limit", String(EONET_DISASTER_MAX_RESULTS));
    url.searchParams.set("bbox", buildRadiusBoundingBox(target, radiusKm));
    url.searchParams.set("category", EONET_DISASTER_CATEGORY_IDS.join(","));

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`NASA EONET request failed with status ${response.status}`);
    }

    const data = (await response.json()) as EonetEventsResponse;
    if (!Array.isArray(data.events)) {
      return [];
    }

    return data.events
      .map((event) => normalizeDisasterEvent(event, target, location, radiusKm))
      .filter((event): event is DisasterEvent => Boolean(event))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.warn("NASA EONET disaster lookup failed", error);
    return [];
  }
};

// Weather API
export const getWeatherData = async (request?: string | WeatherRequest) => {
  const location = typeof request === "string" ? request : request?.location;
  const providedCoordinates = typeof request === "object" ? request?.coordinates : undefined;
  const includeDailyForecast = typeof request === "object" ? request?.includeDailyForecast === true : false;
  const languageCode = typeof request === "object" ? request?.languageCode || "en" : "en";

  if (!location && !hasValidCoordinates(providedCoordinates)) {
    return { ...DEFAULT_WEATHER, location: "No location" };
  }

  try {
    const coordinates = hasValidCoordinates(providedCoordinates)
      ? { latitude: providedCoordinates.lat, longitude: providedCoordinates.lng }
      : location
        ? await fetchCoordinatesForLocation(location)
        : null;

    if (!coordinates) {
      throw new Error("Weather geocoding failed");
    }

    const currentWeatherPromise = fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
    );

    const dailyForecastPromise = includeDailyForecast
      ? fetchGoogleDailyForecast(coordinates, languageCode).catch((error) => {
          console.error("Error fetching Google daily forecast:", error);
          return [];
        })
      : Promise.resolve([]);

    const response = await currentWeatherPromise;

    if (!response.ok) {
      throw new Error('Weather API failed');
    }

    const data = await response.json();
    const current = data?.current;

    if (!current) {
      throw new Error("Weather data missing");
    }

    const dailyForecast = await dailyForecastPromise;
    const temp = Math.round(current.temperature_2m);
    const condition = mapWeatherCodeToCondition(current.weather_code);
    const humidity = Math.round(current.relative_humidity_2m);
    const wind = Math.round(current.wind_speed_10m);

    return {
      temp,
      condition,
      humidity,
      wind,
      location: location || buildDisplayLocation(coordinates, "Unknown location"),
      alert: buildWeatherAlert({
        weatherCode: current.weather_code,
        temp,
        humidity,
        wind,
        dailyForecast,
        languageCode,
      }),
      dailyForecast,
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    return {
      ...DEFAULT_WEATHER,
      location: location || "Unknown location",
      alert: null,
    };
  }
};

// Market Prices API (Government of India Agmarknet)
export const getMarketPrices = async (userLocation?: string) => {
  const fallbackData = buildFallbackMarketData();
  const applyLocationSort = (items: MarketItem[]) => (userLocation ? filterAndSortByLocation(items, userLocation) : items);
  const apiKey = getDataGovApiKey();

  if (!apiKey) {
    return applyLocationSort(fallbackData);
  }

  try {
    let marketData: MarketItem[] = [];

    for (let pageIndex = 0; pageIndex < MARKET_API_MAX_PAGES; pageIndex += 1) {
      const offset = pageIndex * MARKET_API_PAGE_SIZE;
      const pageItems = await fetchMarketPage(apiKey, offset);

      if (pageItems.length === 0) {
        break;
      }

      const previousLength = marketData.length;
      marketData = dedupeMarketItems([...marketData, ...pageItems]);

      if (pageItems.length < MARKET_API_PAGE_SIZE || marketData.length === previousLength) {
        break;
      }
    }

    if (marketData.length === 0) {
      throw new Error('Market API returned no records');
    }

    // If user location is provided, sort data by location relevance
    return applyLocationSort(marketData);
  } catch {
    return applyLocationSort(fallbackData);
  }
};

export const getNearbyMarketPlaces = async (
  request?: NearbyMarketDiscoveryRequest
): Promise<NearbyMarketDiscoveryResult> => {
  const location = request?.location?.trim() || "your area";
  const marketData = Array.isArray(request?.marketData) ? request.marketData : [];
  const fallbackResult = buildFallbackNearbyMarketPlaces(location, marketData);
  const providedCoordinates = request?.coordinates;

  if (!hasGoogleMapsApiKey()) {
    return fallbackResult;
  }

  let coordinates = hasValidCoordinates(providedCoordinates) ? providedCoordinates : undefined;

  if (!coordinates && request?.location) {
    try {
      const geocoded = await fetchCoordinatesForLocation(request.location);
      if (geocoded) {
        coordinates = { lat: geocoded.latitude, lng: geocoded.longitude };
      }
    } catch {
      // fall through to fallback results
    }
  }

  try {
    const googlePlaces = await fetchGoogleMarketPlaceCandidates(request?.location?.trim() || "", coordinates);
    if (googlePlaces.length === 0) {
      return fallbackResult;
    }

    const enrichedPlaces = googlePlaces
      .map((place) => {
        const matchedPrice = pickMatchedMarketPrice(place, marketData, request?.location?.trim() || location);

        return {
          ...place,
          matchedPrice,
          reason: matchedPrice
            ? `Matched with current ${matchedPrice.commodity.toLowerCase()} prices at ${matchedPrice.market}.`
            : place.distanceKm !== null
              ? `Found on Google Maps about ${place.distanceKm} km away.`
              : "Found on Google Maps near your location.",
        };
      })
      .sort((a, b) => {
        const distanceA = a.distanceKm ?? Number.POSITIVE_INFINITY;
        const distanceB = b.distanceKm ?? Number.POSITIVE_INFINITY;
        if (distanceA !== distanceB) {
          return distanceA - distanceB;
        }

        return a.name.localeCompare(b.name);
      })
      .slice(0, MARKET_PLACE_RESULT_LIMIT);

    return {
      location,
      source: "google",
      summary: `Google Maps found nearby market places near ${location}.`,
      places: enrichedPlaces,
    };
  } catch {
    return fallbackResult;
  }
};

// News API (Could use NewsAPI or create custom farming news)
export const getFarmingNews = async () => {
  const apiKey = getNewsApiKey();

  if (!apiKey) {
    return buildFallbackNews();
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=farming+agriculture+india&language=en&sortBy=publishedAt&apiKey=${encodeURIComponent(apiKey)}&pageSize=10`
    );
    
    if (!response.ok) {
      return buildFallbackNews();
    }
    
    const data = await response.json();

    if (!Array.isArray(data?.articles) || data.articles.length === 0) {
      return buildFallbackNews();
    }
    
    return data.articles.map((article: any) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      imageUrl: article.urlToImage,
      publishedAt: article.publishedAt,
      source: article.source.name
    }));
  } catch {
    return buildFallbackNews();
  }
};

export const detectCropDisease = async (imageFile: File): Promise<CropDiseaseDetectionResult> => {
  const visionApiKey = getGoogleCloudVisionApiKey();
  const plantNetApiKey = getPlantNetApiKey();
  let cachedImageContent: string | null = null;
  let fallbackNotice: CropDiseaseDetectionNotice | undefined;

  const getImageContent = async () => {
    if (cachedImageContent !== null) {
      return cachedImageContent;
    }

    cachedImageContent = await fileToBase64Content(imageFile);
    return cachedImageContent;
  };

  if (plantNetApiKey) {
    const plantNetPersistentFailureUntil = getPlantNetCropScanPersistentFailureUntil();
    if (plantNetPersistentFailureUntil && plantNetPersistentFailureUntil > Date.now()) {
      fallbackNotice = "plantnet_rate_limited";
    } else {
      try {
        const detection = await fetchPlantNetCropDetection(imageFile);
        setPlantNetCropScanPersistentFailureUntil(null);
        if (detection === "no_match") {
          fallbackNotice = "plantnet_no_match";
        } else if (detection) {
          return buildCropDetectionResult(imageFile, detection);
        }
      } catch (error) {
        const status = getCropScanErrorStatus(error);
        const noMatch = isPlantNetNoMatchError(error);
        if (status === 429) {
          setPlantNetCropScanPersistentFailureUntil(Date.now() + PLANTNET_CROP_SCAN_FAILURE_COOLDOWN_MS);
        }
        fallbackNotice = noMatch ? "plantnet_no_match" : status === 429 ? "plantnet_rate_limited" : "plantnet_unavailable";
        const message = error instanceof Error ? error.message : "Unknown PlantNet crop scan error";
        if (noMatch) {
          console.info(`PlantNet could not identify a plant species from this photo. Using fallback analysis next. ${message}`);
        } else {
          console.warn(`PlantNet crop scan unavailable. Using fallback analysis next. ${message}`);
        }
      }
    }
  } else if (visionApiKey) {
    try {
      const content = await getImageContent();
      const response = await fetch(`${GOOGLE_CLOUD_VISION_ENDPOINT}?key=${encodeURIComponent(visionApiKey)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: { content },
              features: [
                { type: "LABEL_DETECTION", maxResults: VISION_API_LABEL_LIMIT },
                { type: "OBJECT_LOCALIZATION", maxResults: 6 },
                { type: "WEB_DETECTION", maxResults: 6 },
                { type: "IMAGE_PROPERTIES", maxResults: 1 },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Cloud Vision request failed with status ${response.status}`);
      }

      const data = (await response.json()) as GoogleCloudVisionBatchAnnotateResponse;
      const annotateResponse = data.responses?.[0];

      if (annotateResponse?.error?.message) {
        throw new Error(annotateResponse.error.message);
      }

      const detection = resolveVisionDetection(annotateResponse);
      if (detection) {
        return buildCropDetectionResult(imageFile, detection);
      }
    } catch (error) {
      console.error("Google Cloud Vision crop scan failed:", error);
    }
  }

  return buildFallbackCropDetection(imageFile, fallbackNotice);
};

// Helper function for disease recommendations
export const getRecommendations = (disease: string): string[] => {
  const recommendations: { [key: string]: string[] } = {
    "Healthy": [
      "Continue current farming practices",
      "Monitor regularly for early detection",
      "Maintain proper irrigation and fertilization"
    ],
    "Leaf Blight": [
      "Apply appropriate fungicide",
      "Remove affected leaves to prevent spread",
      "Improve air circulation between plants"
    ],
    "Powdery Mildew": [
      "Apply sulfur-based fungicide",
      "Reduce humidity around plants",
      "Ensure proper spacing between crops"
    ],
    "Aphid Attack": [
      "Use neem oil spray as organic treatment",
      "Introduce ladybugs for natural pest control",
      "Remove heavily infested plants"
    ],
    "Nutrient Deficiency": [
      "Test soil for specific nutrient levels",
      "Apply balanced NPK fertilizer",
      "Consider organic compost for long-term health"
    ],
    "Leaf Spot": [
      "Remove badly affected leaves and keep the canopy dry",
      "Avoid overhead irrigation during humid conditions",
      "Use a suitable fungicide if the spots continue spreading"
    ],
    "Pest Attack": [
      "Inspect the underside of leaves for insects or eggs",
      "Use neem-based or recommended pest-control spray",
      "Separate heavily affected plants to reduce spread"
    ],
    "Wilting Stress": [
      "Check soil moisture near the root zone immediately",
      "Water early in the day and reduce heat stress where possible",
      "Inspect roots for rot or blockage if wilting continues"
    ],
    "Water Stress": [
      "Provide steady irrigation and mulch to reduce moisture loss",
      "Avoid long dry gaps between watering cycles",
      "Check for compacted soil that may block water uptake"
    ],
    "Rust Disease": [
      "Remove severely affected foliage to slow the spread",
      "Use a recommended fungicide if infection is increasing",
      "Improve air circulation and avoid wet leaves late in the day"
    ]
  };
  
  return recommendations[disease] || ["Consult with a local agriculture expert"];
};
