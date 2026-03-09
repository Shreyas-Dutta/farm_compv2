import { beforeEach, describe, expect, it, vi } from "vitest";

const { getDocMock, getDocsMock, setDocMock, addDocMock } = vi.hoisted(() => ({
  getDocMock: vi.fn(),
  getDocsMock: vi.fn(),
  setDocMock: vi.fn(),
  addDocMock: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(),
  doc: vi.fn(() => ({ path: "users/test-user" })),
  getDoc: getDocMock,
  getDocs: getDocsMock,
  setDoc: setDocMock,
  updateDoc: vi.fn(),
  addDoc: addDocMock,
  deleteDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
}));

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({ name: "test-app" })),
  getApp: vi.fn(() => ({ name: "test-app" })),
  getApps: vi.fn(() => []),
}));

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => ({})),
  GoogleAuthProvider: vi.fn(() => ({
    setCustomParameters: vi.fn(),
  })),
}));

import {
  addCrop,
  addDisasterAlertHistory,
  addScanResult,
  clearUserScanHistory,
  deleteCrop,
  deleteScanResult,
  filterDisasterHistoryEntries,
  getUserCrops,
  getUserDisasterHistory,
  getUserProfile,
  getUserScanHistory,
  updateCrop,
  updateUserProfile,
} from "@/lib/database";

describe("database profile storage fallback", () => {
  beforeEach(() => {
    localStorage.clear();
    getDocMock.mockReset();
    getDocsMock.mockReset();
    setDocMock.mockReset();
    addDocMock.mockReset();
  });

  it("returns the stored local profile before attempting Firestore", async () => {
    localStorage.setItem("farm-companion-profile", JSON.stringify({ name: "Riki", location: "Guwahati" }));

    const profile = await getUserProfile("test-user");

    expect(profile).toEqual({ name: "Riki", location: "Guwahati" });
    expect(getDocMock).not.toHaveBeenCalled();
  });

  it("returns null without attempting Firestore when no local profile exists", async () => {
    const profile = await getUserProfile("test-user");

    expect(profile).toBeNull();
    expect(getDocMock).not.toHaveBeenCalled();
  });

  it("stores profile updates locally without making a Firestore write", async () => {
    const success = await updateUserProfile("test-user", { name: "Riki", language: "en" });

    expect(success).toBe(true);
    expect(JSON.parse(localStorage.getItem("farm-companion-profile") || "null")).toEqual({
      name: "Riki",
      language: "en",
    });
    expect(setDocMock).not.toHaveBeenCalled();
  });

  it("returns stored crops locally without attempting a Firestore read", async () => {
    localStorage.setItem(
      "farm-companion-crops-test-user",
      JSON.stringify([{ id: "crop-1", nameEn: "Rice", createdAt: "2026-03-01T00:00:00.000Z" }])
    );

    const crops = await getUserCrops("test-user");

    expect(crops).toEqual([{ id: "crop-1", nameEn: "Rice", createdAt: "2026-03-01T00:00:00.000Z" }]);
    expect(getDocsMock).not.toHaveBeenCalled();
  });

  it("stores new crops locally without making a Firestore write", async () => {
    const cropId = await addCrop("test-user", { nameEn: "Wheat", progress: 25 });
    const stored = JSON.parse(localStorage.getItem("farm-companion-crops-test-user") || "[]");

    expect(cropId).toMatch(/^local-crop-/);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id: cropId, nameEn: "Wheat", progress: 25 });
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("updates an existing stored crop locally without making a Firestore write", async () => {
    localStorage.setItem(
      "farm-companion-crops-test-user",
      JSON.stringify([
        {
          id: "crop-1",
          nameEn: "Rice",
          progress: 25,
          health: "healthy",
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
      ])
    );

    const success = await updateCrop("test-user", "crop-1", {
      progress: 80,
      health: "stressed",
      notes: "Needs water",
    });
    const stored = JSON.parse(localStorage.getItem("farm-companion-crops-test-user") || "[]");

    expect(success).toBe(true);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: "crop-1",
      nameEn: "Rice",
      progress: 80,
      health: "stressed",
      notes: "Needs water",
    });
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("stores crop monitoring history fields locally when a crop is updated", async () => {
    localStorage.setItem(
      "farm-companion-crops-test-user",
      JSON.stringify([
        {
          id: "crop-1",
          nameEn: "Rice",
          health: "healthy",
          monitoringHistory: [],
          createdAt: "2026-03-01T00:00:00.000Z",
          updatedAt: "2026-03-01T00:00:00.000Z",
        },
      ])
    );

    await updateCrop("test-user", "crop-1", {
      health: "diseased",
      lastMonitoringDate: "07/03/2026",
      lastMonitoringSource: "vision",
      monitoringHistory: [
        {
          date: "07/03/2026",
          result: "diseased",
          confidence: 91,
          disease: "Powdery Mildew",
        },
      ],
    });

    const stored = JSON.parse(localStorage.getItem("farm-companion-crops-test-user") || "[]");

    expect(stored[0]).toMatchObject({
      id: "crop-1",
      health: "diseased",
      lastMonitoringDate: "07/03/2026",
      lastMonitoringSource: "vision",
    });
    expect(stored[0].monitoringHistory).toEqual([
      {
        date: "07/03/2026",
        result: "diseased",
        confidence: 91,
        disease: "Powdery Mildew",
      },
    ]);
  });

  it("deletes a stored crop locally without making a Firestore write", async () => {
    localStorage.setItem(
      "farm-companion-crops-test-user",
      JSON.stringify([
        { id: "crop-1", nameEn: "Rice", createdAt: "2026-03-02T00:00:00.000Z" },
        { id: "crop-2", nameEn: "Maize", createdAt: "2026-03-01T00:00:00.000Z" },
      ])
    );

    const success = await deleteCrop("test-user", "crop-1");
    const stored = JSON.parse(localStorage.getItem("farm-companion-crops-test-user") || "[]");

    expect(success).toBe(true);
    expect(stored).toEqual([{ id: "crop-2", nameEn: "Maize", createdAt: "2026-03-01T00:00:00.000Z" }]);
  });

  it("returns stored scan history locally without attempting a Firestore read", async () => {
    localStorage.setItem(
      "farm-companion-scans-test-user",
      JSON.stringify([{ id: "scan-1", cropEn: "Leaf Blight", createdAt: "2026-03-02T00:00:00.000Z" }])
    );

    const scans = await getUserScanHistory("test-user");

    expect(scans).toEqual([{ id: "scan-1", cropEn: "Leaf Blight", createdAt: "2026-03-02T00:00:00.000Z" }]);
    expect(getDocsMock).not.toHaveBeenCalled();
  });

  it("stores new scan results locally without making a Firestore write", async () => {
    const scanId = await addScanResult("test-user", { cropEn: "Powdery Mildew", confidence: 82 });
    const stored = JSON.parse(localStorage.getItem("farm-companion-scans-test-user") || "[]");

    expect(scanId).toMatch(/^local-scan-/);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ id: scanId, cropEn: "Powdery Mildew", confidence: 82 });
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("deletes one stored scan result locally", async () => {
    localStorage.setItem(
      "farm-companion-scans-test-user",
      JSON.stringify([
        { id: "scan-1", cropEn: "Rice", createdAt: "2026-03-02T00:00:00.000Z" },
        { id: "scan-2", cropEn: "Maize", createdAt: "2026-03-01T00:00:00.000Z" },
      ])
    );

    const success = await deleteScanResult("test-user", "scan-1");
    const stored = JSON.parse(localStorage.getItem("farm-companion-scans-test-user") || "[]");

    expect(success).toBe(true);
    expect(stored).toEqual([{ id: "scan-2", cropEn: "Maize", createdAt: "2026-03-01T00:00:00.000Z" }]);
  });

  it("clears stored scan history locally", async () => {
    localStorage.setItem(
      "farm-companion-scans-test-user",
      JSON.stringify([
        { id: "scan-1", cropEn: "Rice", createdAt: "2026-03-02T00:00:00.000Z" },
      ])
    );

    const success = await clearUserScanHistory("test-user");
    const stored = JSON.parse(localStorage.getItem("farm-companion-scans-test-user") || "[]");

    expect(success).toBe(true);
    expect(stored).toEqual([]);
  });

  it("returns stored disaster history locally without attempting a Firestore read", async () => {
    localStorage.setItem(
      "farm-companion-disasters-test-user",
      JSON.stringify([{ id: "alert-1", message: "Strong winds detected nearby.", createdAt: "2026-03-02T00:00:00.000Z" }])
    );

    const history = await getUserDisasterHistory("test-user");

    expect(history).toEqual([{ id: "alert-1", message: "Strong winds detected nearby.", createdAt: "2026-03-02T00:00:00.000Z" }]);
    expect(getDocsMock).not.toHaveBeenCalled();
  });

  it("keeps more than 50 disaster alerts so past-year history is not capped by scan-history limits", async () => {
    const alerts = Array.from({ length: 80 }, (_, index) => ({
      id: `alert-${index + 1}`,
      message: `Alert ${index + 1}`,
      location: "Guwahati, Assam, India",
      createdAt: `2026-01-${String((index % 28) + 1).padStart(2, "0")}T00:00:00.000Z`,
    }));

    localStorage.setItem("farm-companion-disasters-test-user", JSON.stringify(alerts));

    const history = await getUserDisasterHistory("test-user");

    expect(history).toHaveLength(80);
  });

  it("filters disaster history by location and keeps only the last year of entries", () => {
    const filtered = filterDisasterHistoryEntries(
      [
        {
          id: "alert-1",
          message: "Heavy rain likely in the next 24 hours.",
          location: "Guwahati, Assam, India",
          createdAt: "2026-03-08T00:00:00.000Z",
        },
        {
          id: "alert-2",
          message: "Strong winds detected nearby.",
          location: "Barpeta, Assam, India",
          createdAt: "2026-03-07T00:00:00.000Z",
        },
        {
          id: "alert-3",
          message: "Flood warning from previous year.",
          location: "Guwahati, Assam, India",
          createdAt: "2024-02-01T00:00:00.000Z",
        },
      ],
      "  guwahati assam  ",
      Date.parse("2026-03-09T00:00:00.000Z"),
    );

    expect(filtered).toEqual([
      {
        id: "alert-1",
        message: "Heavy rain likely in the next 24 hours.",
        location: "Guwahati, Assam, India",
        createdAt: "2026-03-08T00:00:00.000Z",
      },
    ]);
  });

  it("stores new disaster alerts locally without making a Firestore write", async () => {
    const alertId = await addDisasterAlertHistory("test-user", {
      message: "Heavy rain likely in the next 24 hours.",
      location: "Guwahati, Assam, India",
    });
    const stored = JSON.parse(localStorage.getItem("farm-companion-disasters-test-user") || "[]");

    expect(alertId).toMatch(/^local-disaster-/);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      id: alertId,
      message: "Heavy rain likely in the next 24 hours.",
      location: "Guwahati, Assam, India",
    });
    expect(addDocMock).not.toHaveBeenCalled();
  });

  it("deduplicates the latest disaster alert within the duplicate window", async () => {
    const firstId = await addDisasterAlertHistory("test-user", {
      message: "Strong winds detected nearby.",
      location: "Barpeta, Assam, India",
    });
    const secondId = await addDisasterAlertHistory("test-user", {
      message: "Strong winds detected nearby.",
      location: "Barpeta, Assam, India",
    });
    const stored = JSON.parse(localStorage.getItem("farm-companion-disasters-test-user") || "[]");

    expect(secondId).toBe(firstId);
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      message: "Strong winds detected nearby.",
      location: "Barpeta, Assam, India",
    });
  });
});