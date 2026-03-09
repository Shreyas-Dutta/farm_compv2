import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  authUser,
  navigateMock,
  getUserProfileMock,
  getUserCropsMock,
  getMarketPricesMock,
  getNearbyMarketPlacesMock,
} = vi.hoisted(() => ({
  authUser: { uid: "test-user" },
  navigateMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  getUserCropsMock: vi.fn(),
  getMarketPricesMock: vi.fn(),
  getNearbyMarketPlacesMock: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/hooks/useLanguage", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock("@/lib/database", () => ({
  getUserProfile: getUserProfileMock,
  getUserCrops: getUserCropsMock,
}));

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    getMarketPrices: getMarketPricesMock,
    getNearbyMarketPlaces: getNearbyMarketPlacesMock,
  };
});

import Market from "@/pages/Market";

describe("Market page", () => {
  beforeEach(() => {
    localStorage.clear();
    navigateMock.mockReset();
    getUserProfileMock.mockReset();
    getUserCropsMock.mockReset();
    getMarketPricesMock.mockReset();
    getNearbyMarketPlacesMock.mockReset();

    getUserProfileMock.mockResolvedValue({
      location: "Jaipur, Rajasthan, India",
      coordinates: { lat: 26.9124, lng: 75.7873 },
    });

    getUserCropsMock.mockResolvedValue([
      {
        id: "crop-1",
        type: "rice",
        nameEn: "Rice",
      },
    ]);

    getMarketPricesMock.mockResolvedValue([
      {
        commodity: "Rice",
        price: "2800",
        unit: "Quintal",
        market: "Jaipur",
        date: "1/1/2026",
        trend: "up",
        state: "Rajasthan",
      },
      {
        commodity: "Mustard",
        price: "5400",
        unit: "Quintal",
        market: "Jaipur",
        date: "1/1/2026",
        trend: "up",
        state: "Rajasthan",
      },
      {
        commodity: "Coconut",
        price: "3900",
        unit: "Quintal",
        market: "Kochi",
        date: "1/1/2026",
        trend: "down",
        state: "Kerala",
      },
    ]);

    getNearbyMarketPlacesMock.mockResolvedValue({
      source: "fallback",
      summary: "Nearby crop markets near Jaipur.",
      places: [
        {
          id: "place-1",
          name: "Jaipur Agri Market",
          address: "Jaipur, Rajasthan, India",
          distanceKm: 2.4,
          mapsUrl: "https://maps.google.com/?q=jaipur-agri-market",
          reason: "Matched with current rice prices at Jaipur.",
          matchedPrice: {
            commodity: "Rice",
            price: "2800",
            unit: "Quintal",
            market: "Jaipur",
            date: "1/1/2026",
            trend: "up",
            state: "Rajasthan",
          },
        },
        {
          id: "place-2",
          name: "Generic Store",
          address: "Somewhere else",
          distanceKm: 7.8,
          mapsUrl: "https://maps.google.com/?q=generic-store",
          reason: "No live price match available.",
          matchedPrice: null,
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("shows only the user's added market crops and keeps nearby suggestions tied to filtered prices", async () => {
    render(<Market />);

    expect(await screen.findByText("My Crop Market")).toBeInTheDocument();
    expect(await screen.findByText("Your crops in this market view")).toBeInTheDocument();
    expect(screen.getByText("Showing only crops you have added to your farm.")).toBeInTheDocument();
    expect(screen.getByText("Current prices for your crops")).toBeInTheDocument();

    await waitFor(() => {
      expect(getNearbyMarketPlacesMock).toHaveBeenCalled();
    });

    const nearbyCall = getNearbyMarketPlacesMock.mock.calls.at(-1)?.[0];
    expect(nearbyCall.location).toBe("Jaipur, Rajasthan, India");
    expect(nearbyCall.coordinates).toEqual({ lat: 26.9124, lng: 75.7873 });
    expect(nearbyCall.marketData.map((item: { commodity: string }) => item.commodity)).toEqual(["Rice"]);

    expect(screen.getAllByText("Rice").length).toBeGreaterThan(0);
    expect(screen.queryByText("Mustard")).not.toBeInTheDocument();
    expect(screen.queryByText("Coconut")).not.toBeInTheDocument();

    expect(screen.getByText("Jaipur Agri Market")).toBeInTheDocument();
    expect(screen.queryByText("Generic Store")).not.toBeInTheDocument();
  });

  it("shows an add-crop empty state and skips market fetches when the user has no crops", async () => {
    getUserCropsMock.mockResolvedValue([]);

    render(<Market />);

    expect(await screen.findByText("My Crop Market")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add Crop" })).toBeInTheDocument();
    expect(screen.getAllByText("Add crops to your profile to see only those market prices here.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Current prices for your crops")).not.toBeInTheDocument();
    expect(getMarketPricesMock).not.toHaveBeenCalled();
    expect(getNearbyMarketPlacesMock).not.toHaveBeenCalled();
  });

  it("shows added custom crops when the market API has a direct commodity match", async () => {
    getUserCropsMock.mockResolvedValue([
      {
        id: "crop-custom",
        type: "dragon fruit",
        nameEn: "Dragon Fruit",
      },
    ]);

    getMarketPricesMock.mockResolvedValue([
      {
        commodity: "Dragon Fruit",
        price: "6200",
        unit: "Quintal",
        market: "Jaipur",
        date: "1/1/2026",
        trend: "up",
        state: "Rajasthan",
      },
      {
        commodity: "Mustard",
        price: "5400",
        unit: "Quintal",
        market: "Jaipur",
        date: "1/1/2026",
        trend: "up",
        state: "Rajasthan",
      },
    ]);

    getNearbyMarketPlacesMock.mockResolvedValue({
      source: "fallback",
      summary: "Nearby crop markets near Jaipur.",
      places: [
        {
          id: "place-dragon-fruit",
          name: "Jaipur Fruit Market",
          address: "Jaipur, Rajasthan, India",
          distanceKm: 3.1,
          mapsUrl: "https://maps.google.com/?q=jaipur-fruit-market",
          reason: "Matched with current dragon fruit prices at Jaipur.",
          matchedPrice: {
            commodity: "Dragon Fruit",
            price: "6200",
            unit: "Quintal",
            market: "Jaipur",
            date: "1/1/2026",
            trend: "up",
            state: "Rajasthan",
          },
        },
      ],
    });

    render(<Market />);

    expect(await screen.findByText("My Crop Market")).toBeInTheDocument();
    expect(screen.getAllByText("Dragon Fruit").length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(getNearbyMarketPlacesMock).toHaveBeenCalled();
    });

    const nearbyCall = getNearbyMarketPlacesMock.mock.calls.at(-1)?.[0];
    expect(nearbyCall.marketData.map((item: { commodity: string }) => item.commodity)).toEqual(["Dragon Fruit"]);

    expect(screen.getByText("Current prices for your crops")).toBeInTheDocument();
    expect(screen.getAllByText("Dragon Fruit").length).toBeGreaterThan(0);
    expect(screen.queryByText("Mustard")).not.toBeInTheDocument();
    expect(screen.getByText("Jaipur Fruit Market")).toBeInTheDocument();
  });

  it("shows a no-match state when added crops are not found in current market data", async () => {
    getUserCropsMock.mockResolvedValue([
      {
        id: "crop-unmatched",
        type: "lotus",
        nameEn: "Lotus",
      },
    ]);

    render(<Market />);

    expect(await screen.findByText("My Crop Market")).toBeInTheDocument();
    expect(screen.getByText("Lotus")).toBeInTheDocument();

    await waitFor(() => {
      expect(getMarketPricesMock).toHaveBeenCalled();
    });

    expect(screen.getAllByText("No current market prices matched your added crops yet.").length).toBeGreaterThan(0);
    expect(screen.queryByText("Current prices for your crops")).not.toBeInTheDocument();
    expect(getNearbyMarketPlacesMock).not.toHaveBeenCalled();
  });
});