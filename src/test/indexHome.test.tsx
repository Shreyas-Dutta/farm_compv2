import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  navigateMock,
  getUserProfileMock,
  addDisasterAlertHistoryMock,
  getSoilInsightsMock,
  authUser,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  addDisasterAlertHistoryMock: vi.fn(),
  getSoilInsightsMock: vi.fn(),
  authUser: { uid: "test-user" },
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
  addDisasterAlertHistory: addDisasterAlertHistoryMock,
}));

vi.mock("@/lib/api", () => ({
  getSoilInsights: getSoilInsightsMock,
}));

vi.mock("@/components/WeatherWidget", async () => {
  const React = await vi.importActual<typeof import("react")>("react");

  return {
    default: ({ onWeatherLoaded }: { onWeatherLoaded?: (weather: any) => void | Promise<void> }) => {
      React.useEffect(() => {
        void onWeatherLoaded?.({
          temp: 29,
          condition: "rainy",
          humidity: 85,
          wind: 21,
          location: "Guwahati, Assam, India",
          alert: "Heavy rain likely in the next 24 hours.",
          dailyForecast: [],
        });
      }, [onWeatherLoaded]);

      return <div>Weather widget</div>;
    },
  };
});

vi.mock("@/components/QuickActions", () => ({
  default: () => <div>Quick actions</div>,
}));

vi.mock("@/components/CropCarousel", () => ({
  default: () => <div>Crop carousel</div>,
}));

import Index from "@/pages/Index";

describe("Index home page", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getUserProfileMock.mockReset();
    addDisasterAlertHistoryMock.mockReset();
    getSoilInsightsMock.mockReset();

    getUserProfileMock.mockResolvedValue({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
    });
    getSoilInsightsMock.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the current disaster alert and links to the profile page", async () => {
    render(<Index />);

    expect(await screen.findByText("Disaster alert")).toBeInTheDocument();

    await waitFor(() => {
      expect(addDisasterAlertHistoryMock).toHaveBeenCalledWith("test-user", {
        message: "Heavy rain likely in the next 24 hours.",
        location: "Guwahati, Assam, India",
        condition: "rainy",
        temperature: 29,
      });
    });

    expect(screen.getByText("Heavy rain likely in the next 24 hours.")).toBeInTheDocument();
    expect(screen.getAllByText("Guwahati, Assam, India").length).toBeGreaterThan(0);
    expect(screen.queryByText("Strong winds detected nearby.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view history/i }));
    expect(navigateMock).toHaveBeenCalledWith("/profile");
  });
});