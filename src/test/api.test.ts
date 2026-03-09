import { afterEach, describe, expect, it, vi } from "vitest";
import {
  __resetApiCachesForTests,
  detectCropDisease,
  extractStateFromLocation,
  filterAndSortByLocation,
  hasCropScanAiConfigured,
  getFarmingNews,
  getDisasterEventsForLocation,
  getLocationMatchScore,
  getNearbyMarketPlaces,
  getMarketPrices,
  getPersonalizedFarmingNews,
  getSoilInsights,
  getWeatherData,
  INDIAN_STATES,
  mapWeatherCodeToCondition,
} from "@/lib/api";

const originalFetch = global.fetch;

afterEach(() => {
  __resetApiCachesForTests();
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

beforeEach(() => {
  vi.stubEnv("VITE_DATA_GOV_API_KEY", "");
  vi.stubEnv("VITE_NEWS_API_KEY", "");
  vi.stubEnv("VITE_PLANTNET_API_KEY", "");
  vi.stubEnv("VITE_GOOGLE_CLOUD_VISION_API_KEY", "");
  vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");

  if (typeof URL.createObjectURL !== "function") {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: vi.fn(() => "blob:test-image"),
    });
  } else {
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test-image");
  }
});

describe("api helpers", () => {
  it("extracts the state from a detailed Indian location", () => {
    expect(extractStateFromLocation("Chandrapur, Kamrup Metropolitan, Assam, 781026, India")).toBe("assam");
  });

  it("maps Open-Meteo weather codes to app conditions", () => {
    expect(mapWeatherCodeToCondition(0)).toBe("sunny");
    expect(mapWeatherCodeToCondition(3)).toBe("cloudy");
    expect(mapWeatherCodeToCondition(61)).toBe("rainy");
  });

  it("scores and sorts market items by location relevance", () => {
    const location = "Jaipur, Rajasthan, India";
    const markets = [
      { commodity: "Rice", price: 1, unit: "Q", market: "Delhi", date: "1/1/2026", trend: "up", state: "Delhi" },
      { commodity: "Mustard", price: 1, unit: "Q", market: "Jaipur", date: "1/1/2026", trend: "up", state: "Rajasthan" },
      { commodity: "Gram", price: 1, unit: "Q", market: "Kota", date: "1/1/2026", trend: "up", state: "Rajasthan" },
    ];

    expect(getLocationMatchScore(markets[1], location)).toBeGreaterThan(getLocationMatchScore(markets[0], location));
    expect(filterAndSortByLocation(markets, location)[0].market).toBe("Jaipur");
  });

  it("loads multiple API pages so all market crops can be shown", async () => {
    vi.stubEnv("VITE_DATA_GOV_API_KEY", "test-data-gov-key");

    const firstPageRecords = Array.from({ length: 200 }, (_, index) => ({
      commodity: `Crop ${index + 1}`,
      modal_price: String(2000 + index),
      unit: "Quintal",
      market: index === 0 ? "Jaipur" : `Market ${index + 1}`,
      arrival_date: "1/1/2026",
      price_change: "stable",
      state: index === 0 ? "Rajasthan" : "Delhi",
    }));

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ records: firstPageRecords }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          records: [
            { commodity: "Gram", modal_price: "4800", unit: "Quintal", market: "Kota", arrival_date: "1/1/2026", price_change: "stable", state: "Rajasthan" },
          ],
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getMarketPrices("Jaipur, Rajasthan, India");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("api-key=test-data-gov-key");
    expect(String(fetchMock.mock.calls[0][0])).toContain("limit=200&offset=0");
    expect(String(fetchMock.mock.calls[1][0])).toContain("limit=200&offset=200");
    expect(result).toHaveLength(201);
    expect(result[0].market).toBe("Jaipur");
    expect(result.some((item) => item.market === "Kota")).toBe(true);
    expect(result.some((item) => item.state === "Assam")).toBe(false);
  });

  it("returns fallback market rows for all states when the live API fails", async () => {
    vi.stubEnv("VITE_DATA_GOV_API_KEY", "test-data-gov-key");

    global.fetch = vi.fn().mockResolvedValue({ ok: false }) as unknown as typeof fetch;

    const result = await getMarketPrices();

    expect(result).toHaveLength(INDIAN_STATES.length);
    expect(new Set(result.map((item) => String(item.state).toLowerCase())).size).toBe(INDIAN_STATES.length);
  });

  it("returns fallback market rows without calling the API when no data.gov key is configured", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getMarketPrices();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toHaveLength(INDIAN_STATES.length);
  });

  it("returns nearby market fallback results without calling external services when Google Maps key is missing", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getNearbyMarketPlaces({
      location: "Jaipur, Rajasthan, India",
      coordinates: { lat: 26.9124, lng: 75.7873 },
      marketData: [
        {
          commodity: "Mustard",
          price: "5400",
          unit: "Quintal",
          market: "Jaipur",
          date: "1/1/2026",
          trend: "up",
          state: "Rajasthan",
        },
      ],
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.source).toBe("fallback");
    expect(result.places[0].matchedPrice?.market).toBe("Jaipur");
  });

  it("returns Google Maps market places with matched live prices", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-google-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        places: [
          {
            id: "place-1",
            displayName: { text: "Muhana Mandi" },
            formattedAddress: "Muhana Mandi, Jaipur, Rajasthan, India",
            location: { latitude: 26.82, longitude: 75.72 },
            googleMapsUri: "https://maps.google.com/?q=muhana",
          },
          {
            id: "place-2",
            displayName: { text: "Azadpur Mandi" },
            formattedAddress: "Azadpur, Delhi, India",
            location: { latitude: 28.72, longitude: 77.17 },
            googleMapsUri: "https://maps.google.com/?q=azadpur",
          },
        ],
      }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getNearbyMarketPlaces({
      location: "Jaipur, Rajasthan, India",
      coordinates: { lat: 26.9124, lng: 75.7873 },
      language: "hi",
      marketData: [
        {
          commodity: "Mustard",
          price: "5400",
          unit: "Quintal",
          market: "Jaipur",
          date: "1/1/2026",
          trend: "up",
          state: "Rajasthan",
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("places.googleapis.com/v1/places:searchText");
    expect(fetchMock.mock.calls[0][1]).toMatchObject({
      method: "POST",
      headers: {
        "X-Goog-Api-Key": "test-google-key",
      },
    });
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      languageCode: "hi",
    });
    expect(result.source).toBe("google");
    expect(result.places[0].name).toBe("Muhana Mandi");
    expect(result.places[0].matchedPrice?.commodity).toBe("Mustard");
    expect(result.places[0].reason).toContain("मौजूदा भाव");
    expect(result.places[0].distanceKm).not.toBeNull();
  });

  it("uses deterministic Google ranking for nearby market places when configured", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-google-key");

    const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          places: [
            {
              id: "place-1",
              displayName: { text: "Market One" },
              formattedAddress: "Market One, Jaipur, Rajasthan, India",
              location: { latitude: 26.91, longitude: 75.79 },
              googleMapsUri: "https://maps.google.com/?q=one",
            },
            {
              id: "place-2",
              displayName: { text: "Market Two" },
              formattedAddress: "Market Two, Jaipur, Rajasthan, India",
              location: { latitude: 26.9, longitude: 75.78 },
              googleMapsUri: "https://maps.google.com/?q=two",
            },
          ],
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getNearbyMarketPlaces({
      location: "Jaipur, Rajasthan, India",
      coordinates: { lat: 26.9124, lng: 75.7873 },
      language: "hi",
      marketData: [],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.source).toBe("google");
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({
      languageCode: "hi",
    });
    expect(result.summary).toBe("Google Maps ने Jaipur, Rajasthan, India के पास बाजार स्थान ढूंढे।");
    expect(result.places.map((place) => place.id)).toEqual(["place-1", "place-2"]);
  });

  it("falls back to market-price suggestions when Google Maps market discovery fails", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-google-key");

    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    const result = await getNearbyMarketPlaces({
      location: "Jaipur, Rajasthan, India",
      coordinates: { lat: 26.9124, lng: 75.7873 },
      marketData: [
        {
          commodity: "Mustard",
          price: "5400",
          unit: "Quintal",
          market: "Jaipur",
          date: "1/1/2026",
          trend: "up",
          state: "Rajasthan",
        },
      ],
    });

    expect(result.source).toBe("fallback");
    expect(result.places[0].name).toBe("Jaipur");
  });

  it("uses Google Cloud Vision AI labels for crop disease detection when configured", async () => {
    vi.stubEnv("VITE_GOOGLE_CLOUD_VISION_API_KEY", "test-vision-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        responses: [
          {
            labelAnnotations: [
              { description: "Rice", score: 0.93 },
              { description: "Powdery mildew", score: 0.91 },
              { description: "Leaf", score: 0.88 },
            ],
            localizedObjectAnnotations: [{ name: "Plant", score: 0.84 }],
          },
        ],
      }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await detectCropDisease(new File(["leaf-image"], "mildew-leaf.jpg", { type: "image/jpeg" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("vision.googleapis.com/v1/images:annotate?key=test-vision-key");
    expect(result.source).toBe("vision");
    expect(result.plantName).toBe("Rice");
    expect(result.plantNameHi).toBe("धान");
    expect(result.disease).toBe("Powdery Mildew");
    expect(result.severity).toBe("high");
    expect(result.summary).toContain("Google Cloud Vision AI");
  });

  it("reports crop scan AI as configured when a scan key exists", () => {
    vi.stubEnv("VITE_PLANTNET_API_KEY", "test-plantnet-key");

    expect(hasCropScanAiConfigured()).toBe(true);
  });

  it("reports crop scan AI as not configured when scan keys are missing", () => {
    expect(hasCropScanAiConfigured()).toBe(false);
  });

  it("uses Google Cloud Vision AI labels for crop disease detection when configured", async () => {
    vi.stubEnv("VITE_GOOGLE_CLOUD_VISION_API_KEY", "test-vision-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        responses: [
          {
            labelAnnotations: [
              { description: "Rice", score: 0.93 },
              { description: "Powdery mildew", score: 0.91 },
              { description: "Leaf", score: 0.88 },
            ],
            localizedObjectAnnotations: [{ name: "Plant", score: 0.84 }],
          },
        ],
      }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await detectCropDisease(new File(["leaf-image"], "mildew-leaf.jpg", { type: "image/jpeg" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("vision.googleapis.com/v1/images:annotate?key=test-vision-key");
    expect(result.source).toBe("vision");
    expect(result.plantName).toBe("Rice");
    expect(result.plantNameHi).toBe("धान");
    expect(result.disease).toBe("Powdery Mildew");
    expect(result.severity).toBe("high");
    expect(result.summary).toContain("Google Cloud Vision AI");
  });

  it("uses PlantNet identification when Vision AI is unavailable", async () => {
    vi.stubEnv("VITE_PLANTNET_API_KEY", "test-plantnet-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bestMatch: "Oryza sativa L.",
        predictedOrgans: [
          {
            organ: "leaf",
            score: 0.88,
          },
        ],
        results: [
          {
            score: 0.92,
            species: {
              scientificNameWithoutAuthor: "Oryza sativa",
              scientificName: "Oryza sativa L.",
              commonNames: ["Rice"],
              genus: { scientificName: "Oryza" },
              family: { scientificName: "Poaceae" },
            },
          },
        ],
      }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await detectCropDisease(new File(["leaf-image"], "field-photo.jpg", { type: "image/jpeg" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
    const requestBody = fetchMock.mock.calls[0][1]?.body as FormData;

    expect(requestUrl.pathname.endsWith("/v2/identify/all")).toBe(true);
    expect(requestUrl.searchParams.get("api-key")).toBe("test-plantnet-key");
    expect(requestUrl.searchParams.get("lang")).toBe("en");
    expect(requestUrl.searchParams.get("nb-results")).toBe("3");
    expect(requestBody.get("images")).toBeInstanceOf(File);
    expect(requestBody.get("organs")).toBe("auto");
    expect(requestBody.get("lang")).toBeNull();
    expect(requestBody.get("nb-results")).toBeNull();
    expect(result.source).toBe("plantnet");
    expect(result.plantName).toBe("Rice");
    expect(result.plantNameHi).toBe("धान");
    expect(result.disease).toBe("Condition not confirmed");
    expect(result.severity).toBe("unknown");
    expect(result.summary).toContain("PlantNet identified Rice");
  });

  it("prefers PlantNet when both scan providers are configured", async () => {
    vi.stubEnv("VITE_PLANTNET_API_KEY", "test-plantnet-key");
    vi.stubEnv("VITE_GOOGLE_CLOUD_VISION_API_KEY", "test-vision-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bestMatch: "Oryza sativa L.",
        results: [
          {
            score: 0.92,
            species: {
              scientificNameWithoutAuthor: "Oryza sativa",
              scientificName: "Oryza sativa L.",
              commonNames: ["Rice"],
              genus: { scientificName: "Oryza" },
              family: { scientificName: "Poaceae" },
            },
          },
        ],
      }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await detectCropDisease(new File(["leaf-image"], "field-photo.jpg", { type: "image/jpeg" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
    expect(requestUrl.pathname.endsWith("/v2/identify/all")).toBe(true);
    expect(requestUrl.searchParams.get("api-key")).toBe("test-plantnet-key");
    expect(String(fetchMock.mock.calls[0][0])).not.toContain("vision.googleapis.com");
    expect(result.source).toBe("plantnet");
  });

  it("converts unsupported PlantNet image formats to jpeg before upload", async () => {
    vi.stubEnv("VITE_PLANTNET_API_KEY", "test-plantnet-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        bestMatch: "Zea mays L.",
        results: [
          {
            score: 0.91,
            species: {
              scientificNameWithoutAuthor: "Zea mays",
              scientificName: "Zea mays L.",
              commonNames: ["Maize"],
              genus: { scientificName: "Zea" },
              family: { scientificName: "Poaceae" },
            },
          },
        ],
      }),
    });

    const drawImage = vi.fn();
    const originalImage = global.Image;
    const originalToBlob = HTMLCanvasElement.prototype.toBlob;

    global.fetch = fetchMock as unknown as typeof fetch;
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage,
    } as unknown as CanvasRenderingContext2D);
    Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
      configurable: true,
      writable: true,
      value: vi.fn((callback: BlobCallback, type?: string) => {
        callback(new Blob(["jpeg-image"], { type: type || "image/jpeg" }));
      }),
    });

    class MockImage {
      width = 640;
      height = 480;
      naturalWidth = 640;
      naturalHeight = 480;
      onload: null | (() => void) = null;
      onerror: null | (() => void) = null;

      set src(_value: string) {
        Promise.resolve().then(() => this.onload?.());
      }
    }

    Object.defineProperty(global, "Image", {
      configurable: true,
      writable: true,
      value: MockImage,
    });

    try {
      await detectCropDisease(new File(["webp-image"], "field-photo.webp", { type: "image/webp" }));

      const requestBody = fetchMock.mock.calls[0][1]?.body as FormData;
      const uploadedImage = requestBody.get("images") as File;

      expect(drawImage).toHaveBeenCalled();
      expect(uploadedImage).toBeInstanceOf(File);
      expect(uploadedImage.type).toBe("image/jpeg");
      expect(uploadedImage.name).toBe("field-photo.jpg");
    } finally {
      Object.defineProperty(global, "Image", {
        configurable: true,
        writable: true,
        value: originalImage,
      });
      Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
        configurable: true,
        writable: true,
        value: originalToBlob,
      });
    }
  });

  it("returns a fallback crop scan when PlantNet is rate limited", async () => {
    vi.stubEnv("VITE_PLANTNET_API_KEY", "test-plantnet-key");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ message: "Too many PlantNet requests." }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await detectCropDisease(new File(["leaf-image"], "rice-suspected-aphid-attack.jpg", { type: "image/jpeg" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.source).toBe("fallback");
    expect(result.notice).toBe("plantnet_rate_limited");
    expect(result.plantName).toBe("Rice");
    expect(result.disease).toBe("Aphid Attack");
    expect(result.summary).toContain("API limit was reached");
  });

  it("treats PlantNet species-not-found payloads as a no-match fallback instead of an outage", async () => {
    vi.stubEnv("VITE_PLANTNET_API_KEY", "test-plantnet-key");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ warning: "species_not_found", results: [] }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await detectCropDisease(new File(["leaf-image"], "field-photo.jpg", { type: "image/jpeg" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.source).toBe("fallback");
    expect(result.notice).toBe("plantnet_no_match");
    expect(result.summary).toContain("could not identify a plant species from this photo");
    expect(warnSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("skips repeated PlantNet crop scan requests during the rate-limit cooldown", async () => {
    vi.stubEnv("VITE_PLANTNET_API_KEY", "test-plantnet-key");
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      text: async () => JSON.stringify({ message: "Too many PlantNet requests." }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const firstResult = await detectCropDisease(new File(["leaf-image"], "rice-suspected-aphid-attack.jpg", { type: "image/jpeg" }));
    const secondResult = await detectCropDisease(new File(["leaf-image"], "rice-suspected-aphid-attack.jpg", { type: "image/jpeg" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult.source).toBe("fallback");
    expect(firstResult.notice).toBe("plantnet_rate_limited");
    expect(secondResult.source).toBe("fallback");
    expect(secondResult.notice).toBe("plantnet_rate_limited");
    expect(secondResult.summary).toContain("API limit was reached");
  });

  it("returns a deterministic fallback crop scan when Vision AI is unavailable", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await detectCropDisease(new File(["leaf-image"], "rice-suspected-aphid-attack.jpg", { type: "image/jpeg" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.source).toBe("fallback");
    expect(result.plantName).toBe("Rice");
    expect(result.plantNameHi).toBe("धान");
    expect(result.disease).toBe("Aphid Attack");
    expect(result.severity).toBe("medium");
  });

  it("returns an unconfirmed fallback scan instead of Unknown 0% when no issue can be inferred", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await detectCropDisease(new File(["leaf-image"], "field-photo.jpg", { type: "image/jpeg" }));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.source).toBe("fallback");
    expect(result.plantName).toBe("Plant");
    expect(result.plantNameHi).toBe("पौधा");
    expect(result.disease).toBe("Condition not confirmed");
    expect(result.severity).toBe("unknown");
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.summary).toContain("could not confirm the crop condition");
  });

  it("returns fallback farming news without calling the API when no news key is configured", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getFarmingNews();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
    expect(result[0].source).toBe("IMD");
  });

  it("fetches farming news when a news API key is configured", async () => {
    vi.stubEnv("VITE_NEWS_API_KEY", "test-news-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        articles: [
          {
            title: "Farm update",
            description: "Good rainfall expected",
            url: "https://example.com/news",
            urlToImage: "https://example.com/image.jpg",
            publishedAt: "2026-03-07T00:00:00.000Z",
            source: { name: "Example News" },
          },
        ],
      }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getFarmingNews();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("apiKey=test-news-key");
    expect(result).toEqual([
      {
        title: "Farm update",
        description: "Good rainfall expected",
        url: "https://example.com/news",
        imageUrl: "https://example.com/image.jpg",
        publishedAt: "2026-03-07T00:00:00.000Z",
        source: "Example News",
      },
    ]);
  });

  it("returns personalized fallback sections without calling external APIs when news keys are missing", async () => {
    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "hi",
      crops: ["rice", "tea"],
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.source).toBe("fallback");
    expect(result.sections).toHaveLength(4);
    expect(result.personalizationSummary).toContain("Assam, India");
    expect(result.personalizationSummary).toContain("rice");
    expect(result.sections[0].articles.length).toBeGreaterThan(0);
    expect(result.sections[0].label).toBe("मासिक समाचार");
    expect(result.sections[0].articles[0].title).toBe("Assam, India: मासिक खेती दृष्टिकोण");
    expect(result.sections[0].articles[0].source).toBe("फार्म कंपेनियन");
  });

  it("uses deterministic personalized section queries when the news key is configured", async () => {
    vi.stubEnv("VITE_NEWS_API_KEY", "test-news-key");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          articles: [
            {
              title: "Assam rice headline",
              description: "Important update for rice growers.",
              url: "https://example.com/highlights",
              urlToImage: "https://example.com/highlights.jpg",
              publishedAt: "2026-03-07T00:00:00.000Z",
              source: { name: "Highlights News" },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          articles: [
            {
              title: "Assam farmer success",
              description: "A local success story.",
              url: "https://example.com/stories",
              urlToImage: "https://example.com/stories.jpg",
              publishedAt: "2026-03-06T00:00:00.000Z",
              source: { name: "Stories News" },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          articles: [
            {
              title: "Rice field tip",
              description: "Tip for better crop care.",
              url: "https://example.com/tips",
              urlToImage: "https://example.com/tips.jpg",
              publishedAt: "2026-03-05T00:00:00.000Z",
              source: { name: "Tips News" },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          articles: [
            {
              title: "Assam agriculture event",
              description: "Upcoming agriculture event.",
              url: "https://example.com/events",
              urlToImage: "https://example.com/events.jpg",
              publishedAt: "2026-03-04T00:00:00.000Z",
              source: { name: "Events News" },
            },
          ],
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "hi",
      crops: ["rice"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(String(fetchMock.mock.calls[0][0])).toContain("q=Assam%2C%20India%20monthly%20agriculture%20farming%20report%20rice%20India");
    expect(String(fetchMock.mock.calls[1][0])).toContain("q=Assam%2C%20India%20farmer%20success%20story%20rice%20agriculture%20India");
    expect(result.source).toBe("newsapi");
    expect(result.sections[0].label).toBe("मासिक समाचार");
    expect(result.sections[0].articles[0].title).toBe("Assam rice headline");
    expect(result.sections[3].articles[0].source).toBe("Events News");
  });

  it("refreshes only stale personalized news sections based on their cadence", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T08:00:00.000Z"));
    vi.stubEnv("VITE_NEWS_API_KEY", "test-news-key");

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        articles: [
          {
            title: "Fresh farm update",
            description: "Latest agriculture news.",
            url: "https://example.com/fresh-news",
            urlToImage: "https://example.com/fresh-news.jpg",
            publishedAt: new Date().toISOString(),
            source: { name: "Fresh News" },
          },
        ],
      }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);

    await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);

    vi.setSystemTime(new Date("2026-03-10T08:00:00.000Z"));
    await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(String(fetchMock.mock.calls[4][0])).toContain("q=rice%20farming%20tips%20advisory%20Assam%2C%20India%20India");
    expect(String(fetchMock.mock.calls[5][0])).toContain("q=Assam%2C%20India%20daily%20agriculture%20farming%20weather%20market%20update%20India");

    vi.setSystemTime(new Date("2026-03-16T08:00:00.000Z"));
    await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });
    expect(fetchMock).toHaveBeenCalledTimes(9);
    expect(String(fetchMock.mock.calls[6][0])).toContain("q=Assam%2C%20India%20farmer%20success%20story%20rice%20agriculture%20India");

    vi.setSystemTime(new Date("2026-04-01T08:00:00.000Z"));
    await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });
    expect(fetchMock).toHaveBeenCalledTimes(13);
    expect(String(fetchMock.mock.calls[9][0])).toContain("q=Assam%2C%20India%20monthly%20agriculture%20farming%20report%20rice%20India");
  });

  it("applies the same daily, weekly, and monthly cadence to fallback personalized news", async () => {
    vi.useFakeTimers();

    const fetchMock = vi.fn();
    global.fetch = fetchMock as unknown as typeof fetch;

    vi.setSystemTime(new Date("2026-03-09T08:00:00.000Z"));
    const firstResult = await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });

    vi.setSystemTime(new Date("2026-03-09T20:00:00.000Z"));
    const sameDayResult = await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(sameDayResult.sections.find((section) => section.key === "events")?.articles[0].publishedAt)
      .toBe(firstResult.sections.find((section) => section.key === "events")?.articles[0].publishedAt);
    expect(sameDayResult.sections.find((section) => section.key === "stories")?.articles[0].publishedAt)
      .toBe(firstResult.sections.find((section) => section.key === "stories")?.articles[0].publishedAt);

    vi.setSystemTime(new Date("2026-03-10T08:00:00.000Z"));
    const nextDayResult = await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });

    expect(nextDayResult.sections.find((section) => section.key === "events")?.articles[0].publishedAt)
      .not.toBe(firstResult.sections.find((section) => section.key === "events")?.articles[0].publishedAt);
    expect(nextDayResult.sections.find((section) => section.key === "tips")?.articles[0].publishedAt)
      .not.toBe(firstResult.sections.find((section) => section.key === "tips")?.articles[0].publishedAt);
    expect(nextDayResult.sections.find((section) => section.key === "stories")?.articles[0].publishedAt)
      .toBe(firstResult.sections.find((section) => section.key === "stories")?.articles[0].publishedAt);
    expect(nextDayResult.sections.find((section) => section.key === "highlights")?.articles[0].publishedAt)
      .toBe(firstResult.sections.find((section) => section.key === "highlights")?.articles[0].publishedAt);

    vi.setSystemTime(new Date("2026-03-16T08:00:00.000Z"));
    const nextWeekResult = await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });

    expect(nextWeekResult.sections.find((section) => section.key === "stories")?.articles[0].publishedAt)
      .not.toBe(firstResult.sections.find((section) => section.key === "stories")?.articles[0].publishedAt);
    expect(nextWeekResult.sections.find((section) => section.key === "highlights")?.articles[0].publishedAt)
      .toBe(firstResult.sections.find((section) => section.key === "highlights")?.articles[0].publishedAt);

    vi.setSystemTime(new Date("2026-04-01T08:00:00.000Z"));
    const nextMonthResult = await getPersonalizedFarmingNews({
      location: "Assam, India",
      language: "en",
      crops: ["rice"],
    });

    expect(nextMonthResult.sections.find((section) => section.key === "highlights")?.articles[0].publishedAt)
      .not.toBe(firstResult.sections.find((section) => section.key === "highlights")?.articles[0].publishedAt);
  });

  it("normalizes SoilGrids metrics from provided coordinates", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        properties: {
          layers: [
            {
              name: "phh2o",
              unit_measure: { d_factor: 10, target_units: "pH" },
              depths: [
                { label: "0-5cm", values: { mean: 65 } },
                { label: "5-15cm", values: { mean: 71 } },
              ],
            },
            {
              name: "clay",
              unit_measure: { d_factor: 10, target_units: "%" },
              depths: [
                { label: "0-5cm", values: { mean: 450 } },
                { label: "5-15cm", values: { mean: 350 } },
              ],
            },
            {
              name: "sand",
              unit_measure: { d_factor: 10, target_units: "%" },
              depths: [
                { label: "0-5cm", values: { mean: 220 } },
                { label: "5-15cm", values: { mean: 180 } },
              ],
            },
            {
              name: "cec",
              unit_measure: { d_factor: 10, target_units: "cmol(c)/kg" },
              depths: [
                { label: "0-5cm", values: { mean: 160 } },
                { label: "5-15cm", values: { mean: 140 } },
              ],
            },
          ],
        },
      }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getSoilInsights({
      location: "Jaipur, Rajasthan, India",
      coordinates: { lat: 26.9124, lng: 75.7873 },
      language: "as",
      crops: ["wheat"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("https://rest.isric.org/soilgrids/v2.0/properties/query?");
    expect(String(fetchMock.mock.calls[0][0])).toContain("lon=75.7873");
    expect(String(fetchMock.mock.calls[0][0])).toContain("lat=26.9124");
    expect(result.source).toBe("soilgrids");
    expect(result.metrics.ph.value).toBe(6.8);
    expect(result.metrics.clay.label).toBe("কেঁচা মাটি");
    expect(result.metrics.clay.value).toBe(40);
    expect(result.summary).toContain("কেঁচা মাটি অধিক");
    expect(result.recommendations[0].title).toBe("ভাৰী সেচৰ আগতে নিকাশী উন্নত কৰক");
  });

  it("returns fallback soil guidance when SoilGrids is unavailable", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getSoilInsights({
      location: "Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      language: "hi",
      crops: ["rice"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.source).toBe("fallback");
    expect(result.summary).toContain("अभी Assam, India के लिए SoilGrids पर्याप्त मापी गई मृदा जानकारी नहीं दे सका");
    expect(result.recommendations.length).toBeGreaterThan(0);
    expect(result.recommendedCrops).toHaveLength(2);
    expect(result.recommendedCrops[0].crop).toBe("rice");
    expect(result.recommendedCrops[1].crop).toBe("maize");
    expect(result.recommendedCrops[0].reason).toContain("Assam, India");
    expect(result.recommendations[0].title).toBe("नमी और जलनिकास की जांच से शुरुआत करें");
    expect(result.metrics.clay.label).toBe("चिकनी मिट्टी");
    expect(result.metrics.ph.value).toBeNull();
  });

  it("reuses the SoilGrids failure cooldown for repeated soil lookups", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const firstResult = await getSoilInsights({
      location: "Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      crops: ["rice"],
    });

    const secondResult = await getSoilInsights({
      location: "Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      crops: ["rice", "tea"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult.source).toBe("fallback");
    expect(secondResult.source).toBe("fallback");
    expect(secondResult.summary).toContain("Assam, India");
  });

  it("keeps the SoilGrids failure cooldown across a cache reset that simulates refresh", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T00:00:00.000Z"));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    global.fetch = fetchMock as unknown as typeof fetch;
    const expectedFailureUntil = Date.now() + 30 * 60 * 1000;

    const firstResult = await getSoilInsights({
      location: "Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      crops: ["rice"],
    });

    expect(window.localStorage.getItem("farm-companion-soilgrids-failure-until")).toBe(String(expectedFailureUntil));
    expect(window.sessionStorage.getItem("farm-companion-soilgrids-failure-until")).toBeNull();

    __resetApiCachesForTests({ includePersistent: false });

    const secondResult = await getSoilInsights({
      location: "Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      crops: ["tea"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(firstResult.source).toBe("fallback");
    expect(secondResult.source).toBe("fallback");
    expect(secondResult.summary).toContain("Assam, India");
  });

  it("uses SoilGrids-based soil recommendations when metrics are available", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          properties: {
            layers: [
              {
                name: "phh2o",
                unit_measure: { d_factor: 10, target_units: "pH" },
                depths: [{ label: "0-5cm", values: { mean: 54 } }],
              },
              {
                name: "sand",
                unit_measure: { d_factor: 10, target_units: "%" },
                depths: [{ label: "0-5cm", values: { mean: 680 } }],
              },
            ],
          },
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getSoilInsights({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      language: "hi",
      crops: ["rice", "tea"],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("https://rest.isric.org/soilgrids/v2.0/properties/query?");
    expect(result.source).toBe("soilgrids");
    expect(result.summary).toContain("Guwahati, Assam, India");
    expect(result.summary).toContain("रेतीली");
    expect(result.metrics.ph.value).toBe(5.4);
    expect(result.metrics.sand.value).toBe(68);
    expect(result.recommendedCrops).toHaveLength(2);
    expect(result.recommendations[0].title).not.toBe("");
  });

  it("uses provided coordinates directly for weather requests", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 29,
          relative_humidity_2m: 72,
          wind_speed_10m: 8,
          weather_code: 3,
        },
      }),
    }) as unknown as typeof fetch;

    const result = await getWeatherData({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
    });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("latitude=26.1445"));
    expect(result.location).toBe("Guwahati, Assam, India");
    expect(result.humidity).toBe(72);
  });

  it("uses Google Maps geocoding for weather when a Google key is configured", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [{ geometry: { location: { lat: 26.1445, lng: 91.7362 } } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 31,
            relative_humidity_2m: 70,
            wind_speed_10m: 6,
            weather_code: 1,
          },
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getWeatherData("Guwahati, Assam, India");

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("maps.googleapis.com/maps/api/geocode/json");
    expect(String(fetchMock.mock.calls[0][0])).toContain("address=Guwahati%2C+Assam%2C+India");
    expect(result.location).toBe("Guwahati, Assam, India");
    expect(result.wind).toBe(6);
  });

  it("fetches and normalizes NASA disaster events using provided coordinates", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T08:00:00.000Z"));

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [
          {
            id: "flood-1",
            title: "Assam floods",
            description: "River overflow affected nearby fields.",
            link: "https://example.com/flood-1",
            closed: null,
            categories: [{ id: "floods", title: "Floods" }],
            sources: [{ id: "GDACS", url: "https://example.com/gdacs" }],
            geometry: [
              {
                date: "2026-03-01T00:00:00.000Z",
                type: "Point",
                coordinates: [100, 30],
                magnitudeValue: 9,
                magnitudeUnit: "m",
              },
              {
                date: "2026-02-11T00:00:00.000Z",
                type: "Polygon",
                coordinates: [[
                  [91.70, 26.10],
                  [91.80, 26.10],
                  [91.80, 26.20],
                  [91.70, 26.20],
                  [91.70, 26.10],
                ]],
                magnitudeValue: 4.2,
                magnitudeUnit: "m",
              },
            ],
          },
          {
            id: "quake-1",
            title: "Earthquake near Assam",
            description: "Moderate seismic activity detected.",
            link: "https://example.com/quake-1",
            closed: null,
            categories: [{ id: "earthquakes", title: "Earthquakes" }],
            sources: [{ id: "USGS", url: "https://example.com/usgs" }],
            geometry: [{
              date: "2026-03-05T12:30:00.000Z",
              type: "Point",
              coordinates: [91.7362, 26.1445],
              magnitudeValue: 5.8,
              magnitudeUnit: "Mw",
            }],
          },
          {
            id: "wildfire-1",
            title: "Remote wildfire",
            categories: [{ id: "wildfires", title: "Wildfires" }],
            sources: [{ id: "NASA" }],
            geometry: [{
              date: "2026-03-08T00:00:00.000Z",
              type: "Point",
              coordinates: [120, 5],
            }],
          },
        ],
      }),
    });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getDisasterEventsForLocation({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      radiusKm: 300,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);

    const requestUrl = new URL(String(fetchMock.mock.calls[0][0]));
    expect(requestUrl.origin).toBe("https://eonet.gsfc.nasa.gov");
    expect(requestUrl.pathname).toBe("/api/v3/events");
    expect(requestUrl.searchParams.get("status")).toBe("all");
    expect(requestUrl.searchParams.get("start")).toBe("2025-03-09");
    expect(requestUrl.searchParams.get("end")).toBe("2026-03-09");
    expect(requestUrl.searchParams.get("limit")).toBe("200");
    expect(requestUrl.searchParams.get("bbox")).toContain(",");
    expect(requestUrl.searchParams.get("category")).toContain("earthquakes");
    expect(requestUrl.searchParams.get("category")).toContain("floods");

    expect(result.source).toBe("live");
    expect(result.serviceUnavailable).toBe(false);
    expect(result.events.map((event) => event.title)).toEqual([
      "Earthquake near Assam",
      "Assam floods",
    ]);
    expect(result.events[0]).toMatchObject({
      categoryIds: ["earthquakes"],
      categoryLabels: ["Earthquakes"],
      sourceIds: ["USGS"],
      magnitudeLabel: "5.8 Mw",
      date: "2026-03-05T12:30:00.000Z",
    });
    expect(result.events[0]?.location).toContain("Guwahati, Assam, India");
    expect(result.events[1]).toMatchObject({
      categoryIds: ["floods"],
      categoryLabels: ["Floods"],
      sourceIds: ["GDACS"],
      magnitudeLabel: "4.2 m",
      date: "2026-02-11T00:00:00.000Z",
    });
    expect(result.events[1]?.location).toContain("Guwahati, Assam, India");
  });

  it("geocodes the location before requesting NASA disaster events when coordinates are missing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T08:00:00.000Z"));
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          status: "OK",
          results: [{ geometry: { location: { lat: 26.322, lng: 91.001 } } }],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [{
            id: "flood-2",
            title: "Flood near Barpeta",
            categories: [{ id: "floods", title: "Floods" }],
            sources: [{ id: "GDACS" }],
            geometry: [{
              date: "2026-03-08T10:00:00.000Z",
              type: "Point",
              coordinates: [91.001, 26.322],
            }],
          }],
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getDisasterEventsForLocation({
      location: "Barpeta, Assam, India",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toContain("maps.googleapis.com/maps/api/geocode/json");
    expect(String(fetchMock.mock.calls[0][0])).toContain("address=Barpeta%2C+Assam%2C+India");

    const requestUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(requestUrl.origin).toBe("https://eonet.gsfc.nasa.gov");
    expect(requestUrl.pathname).toBe("/api/v3/events");
    expect(result.source).toBe("live");
    expect(result.serviceUnavailable).toBe(false);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.title).toBe("Flood near Barpeta");
    expect(result.events[0]?.location).toContain("Barpeta, Assam, India");
  });

  it("retries NASA disaster requests when the service returns a transient 503", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T08:00:00.000Z"));

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          events: [{
            id: "storm-1",
            title: "Storm near Guwahati",
            categories: [{ id: "severeStorms", title: "Severe Storms" }],
            sources: [{ id: "GDACS" }],
            geometry: [{
              date: "2026-03-08T10:00:00.000Z",
              type: "Point",
              coordinates: [91.7362, 26.1445],
            }],
          }],
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const resultPromise = getDisasterEventsForLocation({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
    });

    await vi.advanceTimersByTimeAsync(750);
    const result = await resultPromise;

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.source).toBe("live");
    expect(result.serviceUnavailable).toBe(false);
    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.title).toBe("Storm near Guwahati");
  });

  it("returns cached NASA disaster events when a later lookup hits a 503", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T08:00:00.000Z"));

    const request = {
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        events: [{
          id: "flood-cache-1",
          title: "Cached Assam floods",
          categories: [{ id: "floods", title: "Floods" }],
          sources: [{ id: "GDACS" }],
          geometry: [{
            date: "2026-03-08T10:00:00.000Z",
            type: "Point",
            coordinates: [91.7362, 26.1445],
          }],
        }],
      }),
    }) as unknown as typeof fetch;

    const liveResult = await getDisasterEventsForLocation(request);
    expect(liveResult.source).toBe("live");
    expect(liveResult.serviceUnavailable).toBe(false);
    expect(liveResult.events[0]?.title).toBe("Cached Assam floods");

    __resetApiCachesForTests({ includePersistent: false });

    const outageFetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 });
    global.fetch = outageFetchMock as unknown as typeof fetch;

    const cachedResultPromise = getDisasterEventsForLocation(request);
    await vi.advanceTimersByTimeAsync(750);
    const cachedResult = await cachedResultPromise;

    expect(outageFetchMock).toHaveBeenCalledTimes(2);
    expect(cachedResult.source).toBe("cache");
    expect(cachedResult.serviceUnavailable).toBe(true);
    expect(cachedResult.events.map((event) => event.title)).toEqual(["Cached Assam floods"]);
    expect(window.localStorage.getItem("farm-companion-eonet-failure-until")).not.toBeNull();
  });

  it("uses the persisted NASA outage cooldown to avoid repeated live requests", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-09T08:00:00.000Z"));

    const request = {
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
    };

    const outageFetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({ ok: false, status: 503 });
    global.fetch = outageFetchMock as unknown as typeof fetch;

    const firstResultPromise = getDisasterEventsForLocation(request);
    await vi.advanceTimersByTimeAsync(750);
    const firstResult = await firstResultPromise;

    expect(outageFetchMock).toHaveBeenCalledTimes(2);
    expect(firstResult).toEqual({
      events: [],
      source: "live",
      serviceUnavailable: true,
    });

    __resetApiCachesForTests({ includePersistent: false });

    const cooldownFetchMock = vi.fn();
    global.fetch = cooldownFetchMock as unknown as typeof fetch;

    const secondResult = await getDisasterEventsForLocation(request);

    expect(cooldownFetchMock).not.toHaveBeenCalled();
    expect(secondResult).toEqual({
      events: [],
      source: "live",
      serviceUnavailable: true,
    });
  });

  it("returns a localized severe weather alert when storm conditions are detected", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 31,
          relative_humidity_2m: 84,
          wind_speed_10m: 28,
          weather_code: 95,
        },
      }),
    }) as unknown as typeof fetch;

    const result = await getWeatherData({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      languageCode: "hi",
    });

    expect(result.alert).toContain("गंभीर तूफान चेतावनी");
  });

  it("returns a flood-risk alert when intense rain conditions are detected", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 27,
          relative_humidity_2m: 92,
          wind_speed_10m: 31,
          weather_code: 82,
        },
      }),
    }) as unknown as typeof fetch;

    const result = await getWeatherData({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
    });

    expect(result.alert).toContain("Flood risk alert");
  });

  it("uses the daily forecast to raise a rain watch when upcoming rain looks risky", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 29,
            relative_humidity_2m: 68,
            wind_speed_10m: 9,
            weather_code: 1,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          forecastDays: [
            {
              displayDate: { year: 2026, month: 3, day: 8 },
              daytimeForecast: {
                weatherCondition: {
                  type: "SCATTERED_SHOWERS",
                  description: { text: "Scattered showers" },
                },
                precipitation: {
                  probability: { percent: 80 },
                },
                relativeHumidity: 79,
                wind: {
                  speed: { value: 18 },
                },
              },
              maxTemperature: { degrees: 31 },
              minTemperature: { degrees: 22 },
            },
          ],
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getWeatherData({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      includeDailyForecast: true,
    });

    expect(result.alert).toContain("Rain watch");
  });

  it("fetches and normalizes Google daily forecast data when requested", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 30,
            relative_humidity_2m: 68,
            wind_speed_10m: 9,
            weather_code: 1,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          forecastDays: [
            {
              displayDate: { year: 2026, month: 3, day: 7 },
              daytimeForecast: {
                weatherCondition: {
                  type: "SCATTERED_SHOWERS",
                  description: { text: "Scattered showers" },
                },
                precipitation: {
                  probability: { percent: 55 },
                },
                relativeHumidity: 74,
                wind: {
                  speed: { value: 14 },
                },
              },
              maxTemperature: { degrees: 32.4 },
              minTemperature: { degrees: 23.1 },
            },
          ],
        }),
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getWeatherData({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      includeDailyForecast: true,
      languageCode: "hi",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1][0])).toContain("weather.googleapis.com/v1/forecast/days:lookup");
    expect(String(fetchMock.mock.calls[1][0])).toContain("location.latitude=26.1445");
    expect(String(fetchMock.mock.calls[1][0])).toContain("languageCode=hi");
    expect(result.dailyForecast).toEqual([
      {
        date: "2026-03-07",
        condition: "rainy",
        conditionText: "Scattered showers",
        high: 32,
        low: 23,
        precipitationChance: 55,
        humidity: 74,
        wind: 14,
      },
    ]);
  });

  it("keeps current weather when the Google daily forecast request fails", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 27,
            relative_humidity_2m: 66,
            wind_speed_10m: 5,
            weather_code: 2,
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 403,
      });

    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await getWeatherData({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      includeDailyForecast: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.temp).toBe(27);
    expect(result.condition).toBe("cloudy");
    expect(result.dailyForecast).toEqual([]);
  });
});