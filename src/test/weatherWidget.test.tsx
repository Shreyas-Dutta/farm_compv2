import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getWeatherDataMock } = vi.hoisted(() => ({
  getWeatherDataMock: vi.fn(),
}));

vi.mock("@/hooks/useLanguage", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("@/lib/api", () => ({
  getWeatherData: getWeatherDataMock,
}));

import WeatherWidget from "@/components/WeatherWidget";

describe("WeatherWidget", () => {
  it("requests forecast-aware localized weather and reports loaded alerts without rendering a duplicate alert strip", async () => {
    const onWeatherLoaded = vi.fn();

    getWeatherDataMock.mockResolvedValue({
      temp: 29,
      condition: "rainy",
      humidity: 88,
      wind: 18,
      location: "Guwahati, Assam, India",
      alert: "Heavy rain likely in the next 24 hours.",
      dailyForecast: [],
    });

    render(
      <WeatherWidget
        userLocation="Guwahati, Assam, India"
        userCoordinates={{ lat: 26.1445, lng: 91.7362 }}
        onWeatherLoaded={onWeatherLoaded}
      />
    );

    await waitFor(() => {
      expect(getWeatherDataMock).toHaveBeenCalledWith({
        location: "Guwahati, Assam, India",
        coordinates: { lat: 26.1445, lng: 91.7362 },
        includeDailyForecast: true,
        languageCode: "en",
      });
    });

    expect(await screen.findByText("Guwahati, Assam, India")).toBeInTheDocument();
    expect(screen.queryByText("Heavy rain likely in the next 24 hours.")).not.toBeInTheDocument();
    expect(onWeatherLoaded).toHaveBeenCalledWith(expect.objectContaining({
      location: "Guwahati, Assam, India",
      alert: "Heavy rain likely in the next 24 hours.",
    }));
  });
});
