type LocationCoordinates = {
  lat: number;
  lng: number;
};

type GoogleAddressComponent = {
  long_name?: string;
  types?: string[];
};

type GoogleGeocodeResult = {
  address_components?: GoogleAddressComponent[];
  formatted_address?: string;
  geometry?: {
    location?: {
      lat?: number;
      lng?: number;
    };
  };
};

type GoogleGeocodeResponse = {
  status?: string;
  error_message?: string;
  results?: GoogleGeocodeResult[];
};

const GOOGLE_GEOCODE_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";

const getGoogleMapsApiKey = () => import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || "";

const pickAddressComponent = (components: GoogleAddressComponent[] = [], types: string[]) => {
  const match = components.find((component) => component.types?.some((type) => types.includes(type)));
  return match?.long_name?.trim();
};

const dedupeParts = (parts: Array<string | undefined>) => {
  const unique: string[] = [];

  for (const part of parts) {
    if (!part) continue;
    if (!unique.some((value) => value.toLowerCase() === part.toLowerCase())) {
      unique.push(part);
    }
  }

  return unique;
};

const fetchGoogleGeocodeResult = async (params: Record<string, string>) => {
  const apiKey = getGoogleMapsApiKey();

  if (!apiKey) {
    throw new Error("Missing VITE_GOOGLE_MAPS_API_KEY");
  }

  const url = new URL(GOOGLE_GEOCODE_ENDPOINT);
  url.searchParams.set("region", "in");
  url.searchParams.set("key", apiKey);

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`Google Maps geocoding failed with status ${response.status}`);
  }

  const data = (await response.json()) as GoogleGeocodeResponse;
  if (data.status !== "OK" || !data.results?.length) {
    throw new Error(data.error_message || `Google Maps geocoding failed with status ${data.status || "UNKNOWN"}`);
  }

  return data.results[0];
};

export const hasGoogleMapsApiKey = () => getGoogleMapsApiKey().length > 0;

export const formatGoogleGeocodeLocation = (result: GoogleGeocodeResult, fallback: string) => {
  const components = result.address_components || [];
  const parts = dedupeParts([
    pickAddressComponent(components, ["locality", "postal_town", "administrative_area_level_3", "administrative_area_level_2", "sublocality", "sublocality_level_1"]),
    pickAddressComponent(components, ["administrative_area_level_1"]),
    pickAddressComponent(components, ["country"]),
  ]);

  return parts.join(", ") || result.formatted_address || fallback;
};

export const reverseGeocodeCoordinatesWithGoogleMaps = async (
  coordinates: LocationCoordinates,
  language = "en"
) => {
  const result = await fetchGoogleGeocodeResult({
    latlng: `${coordinates.lat},${coordinates.lng}`,
    language,
  });

  return formatGoogleGeocodeLocation(result, `${coordinates.lat}, ${coordinates.lng}`);
};

export const geocodeLocationWithGoogleMaps = async (query: string, language = "en") => {
  const result = await fetchGoogleGeocodeResult({ address: query, language });
  const latitude = result.geometry?.location?.lat;
  const longitude = result.geometry?.location?.lng;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error("Google Maps geocoding returned invalid coordinates");
  }

  return {
    latitude: latitude as number,
    longitude: longitude as number,
  };
};