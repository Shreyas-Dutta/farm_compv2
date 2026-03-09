import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  navigateMock,
  addScanResultMock,
  updateCropMock,
  detectCropDiseaseMock,
  predictLocalPlantHealthMock,
  getSupportedLocalPlantHealthCropNamesMock,
  authUser,
} = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  addScanResultMock: vi.fn(),
  updateCropMock: vi.fn(),
  detectCropDiseaseMock: vi.fn(),
  predictLocalPlantHealthMock: vi.fn(),
  getSupportedLocalPlantHealthCropNamesMock: vi.fn(),
  authUser: { uid: "test-user" },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useLocation: () => ({
      state: {
        crop: {
          id: "crop-1",
          name: "Rice",
          nameEn: "Rice",
          nameHi: "धान",
          emoji: "🌾",
          monitoringHistory: [],
        },
      },
    }),
    useSearchParams: () => [new URLSearchParams("cropId=crop-1")],
  };
});

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: authUser }),
}));

vi.mock("@/hooks/useLanguage", () => ({
  useLanguage: () => ({ language: "en" }),
}));

vi.mock("@/lib/database", () => ({
  addScanResult: addScanResultMock,
  getUserCrops: vi.fn(),
  updateCrop: updateCropMock,
}));

vi.mock("@/lib/api", () => ({
  detectCropDisease: detectCropDiseaseMock,
  hasCropScanAiConfigured: () => true,
}));

vi.mock("@/lib/localPlantHealthModel", () => ({
  predictLocalPlantHealth: predictLocalPlantHealthMock,
  getSupportedLocalPlantHealthCropNames: getSupportedLocalPlantHealthCropNamesMock,
}));

import Scan from "@/pages/Scan";

describe("Scan page", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    addScanResultMock.mockReset();
    updateCropMock.mockReset();
    detectCropDiseaseMock.mockReset();
    predictLocalPlantHealthMock.mockReset();
    getSupportedLocalPlantHealthCropNamesMock.mockReset();

    detectCropDiseaseMock.mockResolvedValue({
      plantName: "Tomato",
      plantNameHi: "टमाटर",
      disease: "Early Blight",
      diseaseHi: "अर्ली ब्लाइट",
      confidence: 81,
      severity: "medium",
      recommendations: ["Use a suitable fungicide and remove badly affected leaves."],
      imageUrl: "blob:test-image",
      timestamp: "2026-03-09T08:00:00.000Z",
      source: "plantnet",
      summary: "PlantNet identified Tomato and the image shows likely disease symptoms.",
    });
    predictLocalPlantHealthMock.mockResolvedValue(null);
    getSupportedLocalPlantHealthCropNamesMock.mockResolvedValue(["Rice", "Tomato"]);
  });

  it("shows the health status but does not persist monitoring when the identified crop does not match the selected crop", async () => {
    const { container } = render(<Scan />);
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    fireEvent.change(fileInput, {
      target: {
        files: [new File(["leaf-image"], "leaf.jpg", { type: "image/jpeg" })],
      },
    });

    expect(await screen.findByText("Daily monitoring crop")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Analyze" }));

    expect(await screen.findByText("Crop name does not match the photo")).toBeInTheDocument();
    expect(screen.getByText(/photo was identified as Tomato/i)).toBeInTheDocument();
    expect(screen.getByText("Diseased")).toBeInTheDocument();
    expect(screen.getByText("Tomato")).toBeInTheDocument();

    await waitFor(() => {
      expect(addScanResultMock).not.toHaveBeenCalled();
      expect(updateCropMock).not.toHaveBeenCalled();
    });
  });

  it("uses separate gallery and camera file inputs on mobile", () => {
    const { container } = render(<Scan />);
    const fileInputs = Array.from(container.querySelectorAll('input[type="file"]')) as HTMLInputElement[];

    expect(fileInputs).toHaveLength(2);
    expect(fileInputs[0].getAttribute("capture")).toBeNull();
    expect(fileInputs[1].getAttribute("capture")).toBe("environment");
  });
});