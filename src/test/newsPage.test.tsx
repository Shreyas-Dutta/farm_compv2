import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  navigateMock,
  getUserProfileMock,
  getUserCropsMock,
  getPersonalizedFarmingNewsMock,
  getSoilInsightsMock,
  authUser,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getUserProfileMock: vi.fn(),
  getUserCropsMock: vi.fn(),
  getPersonalizedFarmingNewsMock: vi.fn(),
  getSoilInsightsMock: vi.fn(),
  authUser: { uid: "test-user" },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams()],
  };
});

vi.mock("@/hooks/useLanguage", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: authUser, loading: false }),
}));

vi.mock("@/lib/database", () => ({
  getUserProfile: getUserProfileMock,
  getUserCrops: getUserCropsMock,
}));

vi.mock("@/lib/api", () => ({
  getPersonalizedFarmingNews: getPersonalizedFarmingNewsMock,
  getSoilInsights: getSoilInsightsMock,
}));

import News from "@/pages/News";

describe("News page", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    getUserProfileMock.mockReset();
    getUserCropsMock.mockReset();
    getPersonalizedFarmingNewsMock.mockReset();
    getSoilInsightsMock.mockReset();

    getUserProfileMock.mockResolvedValue({
      location: "Guwahati, Assam, India",
      coordinates: { lat: 26.1445, lng: 91.7362 },
      language: "hi",
    });
    getUserCropsMock.mockResolvedValue([{ type: "rice" }]);
    getPersonalizedFarmingNewsMock.mockResolvedValue({
      personalizationSummary: "Guwahati, Assam, India • rice",
      source: "fallback",
      sections: [
        {
          key: "events",
          label: "Daily",
          description: "Local fallback updates",
          articles: [],
        },
        {
          key: "highlights",
          label: "Monthly",
          description: "Monthly summary",
          articles: [],
        },
        {
          key: "stories",
          label: "Success",
          description: "Success stories",
          articles: [],
        },
        {
          key: "tips",
          label: "Tips",
          description: "Farming tips",
          articles: [],
        },
      ],
    });
    getSoilInsightsMock.mockResolvedValue({
      location: "Guwahati, Assam, India",
      source: "fallback",
      summary: "Fallback soil summary",
      advisory: "Fallback soil advisory",
      recommendations: [
        { title: "Maintain drainage", description: "Keep channels open.", priority: 80 },
      ],
      recommendedCrops: [
        { crop: "rice", reason: "Suitable for current fallback conditions.", priority: 80 },
      ],
      metrics: {
        ph: { label: "pH", value: null, unit: "", depthLabel: "" },
        clay: { label: "Clay", value: null, unit: "%", depthLabel: "" },
        sand: { label: "Sand", value: null, unit: "%", depthLabel: "" },
        silt: { label: "Silt", value: null, unit: "%", depthLabel: "" },
        organicCarbon: { label: "Organic carbon", value: null, unit: "", depthLabel: "" },
        cec: { label: "CEC", value: null, unit: "cmol(c)/kg", depthLabel: "" },
      },
    });
  });

  it("shows a visible fallback soil notice when live soil data is unavailable", async () => {
    render(<News />);

    await waitFor(() => {
      expect(getPersonalizedFarmingNewsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "en",
          location: "Guwahati, Assam, India",
          crops: ["rice"],
        })
      );
      expect(getSoilInsightsMock).toHaveBeenCalledWith({
        location: "Guwahati, Assam, India",
        coordinates: { lat: 26.1445, lng: 91.7362 },
        crops: ["rice"],
        language: "en",
      });
    });

    expect(await screen.findByText("Live soil service is temporarily unavailable. Showing fallback soil guidance.")).toBeInTheDocument();
    expect(screen.getByText("Soil source: Fallback soil guidance")).toBeInTheDocument();
  });
});