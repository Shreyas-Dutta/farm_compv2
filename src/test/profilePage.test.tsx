import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  navigateMock,
  logoutMock,
  getUserProfileMock,
  getUserCropsMock,
  getDisasterEventsForLocationMock,
  getUserScanHistoryMock,
  authUser,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  logoutMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  getUserCropsMock: vi.fn(),
  getDisasterEventsForLocationMock: vi.fn(),
  getUserScanHistoryMock: vi.fn(),
  authUser: { uid: "test-user", email: "farmer@example.com" },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    user: authUser,
    logout: logoutMock,
  }),
}));

vi.mock("@/hooks/useLanguage", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("@/lib/voiceCommands", () => ({
  VOICE_COMMAND_CROPS_UPDATED_EVENT: "voice-command-crops-updated",
}));

vi.mock("@/lib/api", () => ({
  getDisasterEventsForLocation: getDisasterEventsForLocationMock,
  hasValidCoordinates: (value: any) => Number.isFinite(value?.lat) && Number.isFinite(value?.lng),
}));

vi.mock("@/lib/database", () => {
  return {
    clearUserScanHistory: vi.fn(),
    deleteCrop: vi.fn(),
    deleteScanResult: vi.fn(),
    getUserProfile: getUserProfileMock,
    getUserCrops: getUserCropsMock,
    getUserScanHistory: getUserScanHistoryMock,
  };
});

import Profile from "@/pages/Profile";

describe("Profile page", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    logoutMock.mockReset();
    getUserProfileMock.mockReset();
    getUserCropsMock.mockReset();
    getDisasterEventsForLocationMock.mockReset();
    getUserScanHistoryMock.mockReset();

    getUserProfileMock.mockResolvedValue({
      name: "Riki",
      age: 27,
      sex: "male",
      location: "Guwahati",
      coordinates: { lat: 26.1445, lng: 91.7362 },
    });
    getUserCropsMock.mockResolvedValue([]);
    getDisasterEventsForLocationMock.mockImplementation(async (request?: { location?: string }) => {
      if (request?.location === "Barpeta") {
        return [{
          id: "event-2",
          title: "Barpeta storm",
          description: "High winds expected across the district.",
          link: "https://example.com/barpeta-storm",
          date: "2026-03-07T08:00:00.000Z",
          closedAt: null,
          location: "18 km from Barpeta",
          distanceKm: 18,
          categoryIds: ["severeStorms"],
          categoryLabels: ["Severe Storms"],
          sourceIds: ["GDACS"],
          magnitudeLabel: null,
        }];
      }

      return [
        {
          id: "event-1",
          title: "Assam floods",
          description: "River overflow affected nearby fields.",
          link: "https://example.com/assam-floods",
          date: "2026-03-08T08:00:00.000Z",
          closedAt: null,
          location: "12.4 km from Guwahati",
          distanceKm: 12.4,
          categoryIds: ["floods"],
          categoryLabels: ["Floods"],
          sourceIds: ["GDACS"],
          magnitudeLabel: "4.2 m",
        },
        {
          id: "event-2",
          title: "Earthquake near Guwahati",
          description: "Moderate seismic activity detected.",
          link: "https://example.com/quake",
          date: "2026-03-07T08:00:00.000Z",
          closedAt: null,
          location: "5.1 km from Guwahati",
          distanceKm: 5.1,
          categoryIds: ["earthquakes"],
          categoryLabels: ["Earthquakes"],
          sourceIds: ["USGS"],
          magnitudeLabel: "5.8 Mw",
        },
        {
          id: "event-3",
          title: "Landslide warning",
          description: "Slope instability reported nearby.",
          link: "https://example.com/landslide",
          date: "2026-03-06T08:00:00.000Z",
          closedAt: null,
          location: "8.7 km from Guwahati",
          distanceKm: 8.7,
          categoryIds: ["landslides"],
          categoryLabels: ["Landslides"],
          sourceIds: ["GDACS"],
          magnitudeLabel: null,
        },
        {
          id: "event-4",
          title: "Severe storm across Assam",
          description: "Damaging wind bands moving east.",
          link: "https://example.com/storm",
          date: "2026-03-05T08:00:00.000Z",
          closedAt: null,
          location: "14 km from Guwahati",
          distanceKm: 14,
          categoryIds: ["severeStorms"],
          categoryLabels: ["Severe Storms"],
          sourceIds: ["GDACS"],
          magnitudeLabel: null,
        },
        {
          id: "event-5",
          title: "Drought conditions developing",
          description: "Rainfall deficits are increasing.",
          link: "https://example.com/drought",
          date: "2026-03-04T08:00:00.000Z",
          closedAt: null,
          location: "22 km from Guwahati",
          distanceKm: 22,
          categoryIds: ["drought"],
          categoryLabels: ["Drought"],
          sourceIds: ["NASA"],
          magnitudeLabel: null,
        },
        {
          id: "event-6",
          title: "Wildfire hotspot",
          description: "Thermal anomaly identified in the wider area.",
          link: "https://example.com/wildfire",
          date: "2026-03-03T08:00:00.000Z",
          closedAt: null,
          location: "35 km from Guwahati",
          distanceKm: 35,
          categoryIds: ["wildfires"],
          categoryLabels: ["Wildfires"],
          sourceIds: ["NASA"],
          magnitudeLabel: null,
        },
      ];
    });
    getUserScanHistoryMock.mockResolvedValue([
      {
        id: "scan-1",
        cropEn: "Rice",
        date: "3/8/2026",
        result: "healthy",
        confidence: 82,
        source: "vision",
      },
    ]);
  });

  it("defaults the disaster filter to the saved profile location and shows only matching alerts from the past year", async () => {
    render(<Profile />);

    expect(await screen.findByDisplayValue("Guwahati")).toBeInTheDocument();
    expect(await screen.findByText("Assam floods")).toBeInTheDocument();

    await waitFor(() => {
      expect(getDisasterEventsForLocationMock).toHaveBeenCalledWith({
        location: "Guwahati",
        coordinates: { lat: 26.1445, lng: 91.7362 },
      });
      expect(getUserScanHistoryMock).toHaveBeenCalledWith("test-user");
    });

    expect(screen.getByText("Disaster History")).toBeInTheDocument();
    expect(screen.getByText("Floods • 4.2 m • Source: GDACS")).toBeInTheDocument();
    expect(screen.getByText("12.4 km from Guwahati")).toBeInTheDocument();
    expect(screen.getByText("River overflow affected nearby fields.")).toBeInTheDocument();
    expect(screen.getByText("6 disaster events from the past year for Guwahati")).toBeInTheDocument();
    expect(screen.getByText("Scan History")).toBeInTheDocument();
    expect(screen.getByText("Rice")).toBeInTheDocument();
  });

  it("shows only five disaster events by default and expands when see more is pressed", async () => {
    render(<Profile />);

    expect(await screen.findByText("Assam floods")).toBeInTheDocument();
    expect(screen.getByText("Drought conditions developing")).toBeInTheDocument();
    expect(screen.queryByText("Wildfire hotspot")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "See more" }));

    expect(await screen.findByText("Wildfire hotspot")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show less" })).toBeInTheDocument();
  });

  it("updates the disaster list when the location filter changes", async () => {
    render(<Profile />);

    const locationInput = await screen.findByLabelText("Location");
    fireEvent.change(locationInput, { target: { value: "Barpeta" } });

    expect(await screen.findByText("Barpeta storm")).toBeInTheDocument();
    expect(screen.queryByText("Assam floods")).not.toBeInTheDocument();
    expect(screen.getByText("1 disaster events from the past year for Barpeta")).toBeInTheDocument();

    await waitFor(() => {
      expect(getDisasterEventsForLocationMock).toHaveBeenNthCalledWith(1, {
        location: "Guwahati",
        coordinates: { lat: 26.1445, lng: 91.7362 },
      });
      expect(getDisasterEventsForLocationMock).toHaveBeenNthCalledWith(2, {
        location: "Barpeta",
      });
    });
  });
});