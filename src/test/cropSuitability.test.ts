import { afterEach, describe, expect, it, vi } from "vitest";

import {
  clearCropSuitabilityCache,
  filterMarketPricesBySuitableCrops,
  getStateFromMarket,
  getSuitableCropsForLocation,
} from "@/lib/cropSuitability";

const originalFetch = global.fetch;

afterEach(() => {
  clearCropSuitabilityCache();
  global.fetch = originalFetch;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("crop suitability helpers", () => {
  it("uses the built-in fallback mapping for matched regions", async () => {
    const result = await getSuitableCropsForLocation("Jaipur, Rajasthan, India");

    expect(result.source).toBe("fallback");
    expect(result.regionKey).toBe("rajasthan");
    expect(result.crops.map((crop) => crop.value)).toEqual(["wheat", "mustard", "cotton", "gram", "maize"]);
  });

  it("returns all crops when there is no saved location", async () => {
    const result = await getSuitableCropsForLocation("");

    expect(result.source).toBe("all");
    expect(result.crops).toHaveLength(7);
  });

  it("uses the fallback mapping without making network requests", async () => {
    global.fetch = vi.fn() as unknown as typeof fetch;

    const result = await getSuitableCropsForLocation("Guwahati, Assam, India");

    expect(global.fetch).not.toHaveBeenCalled();
    expect(result.source).toBe("fallback");
    expect(result.regionKey).toBe("assam");
    expect(result.crops.map((crop) => crop.value)).toEqual(["rice", "mustard", "maize", "sugarcane"]);
  });

  it("filters market prices down to suitable crops only", () => {
    const filtered = filterMarketPricesBySuitableCrops(
      [
        { commodity: "Wheat", market: "Delhi" },
        { commodity: "Mustard", market: "Jaipur" },
        { commodity: "Gram", market: "Kota" },
      ],
      [
        { value: "mustard", label: { en: "Mustard", hi: "सरसों", as: "সৰিয়হ" }, emoji: "🌻", aliases: ["mustard"] },
        { value: "gram", label: { en: "Gram", hi: "चना", as: "বুট" }, emoji: "🫘", aliases: ["gram"] },
      ]
    );

    expect(filtered).toEqual([
      { commodity: "Mustard", market: "Jaipur" },
      { commodity: "Gram", market: "Kota" },
    ]);
  });

  it("returns no market rows when no crops are allowed", () => {
    const filtered = filterMarketPricesBySuitableCrops(
      [{ commodity: "Wheat", market: "Delhi" }],
      []
    );

    expect(filtered).toEqual([]);
  });

  it("maps market names or explicit state names into filter values", () => {
    expect(getStateFromMarket("Kota Mandi")).toBe("rajasthan");
    expect(getStateFromMarket("Some Market", "Madhya Pradesh")).toBe("madhya-pradesh");
  });
});