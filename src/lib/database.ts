const PROFILE_STORAGE_KEY = 'farm-companion-profile';
const getCropsStorageKey = (userId: string) => `farm-companion-crops-${userId}`;
const getScansStorageKey = (userId: string) => `farm-companion-scans-${userId}`;
const getDisasterStorageKey = (userId: string) => `farm-companion-disasters-${userId}`;
const MAX_SCAN_HISTORY_ITEMS = 50;
const MAX_DISASTER_HISTORY_ITEMS = 500;
const DISASTER_DUPLICATE_WINDOW_MS = 6 * 60 * 60 * 1000;
const DISASTER_PAST_YEAR_WINDOW_MS = 365 * 24 * 60 * 60 * 1000;

const readStoredProfile = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const writeStoredProfile = (data: any) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors and continue
  }
};

const readStoredCollection = (storageKey: string) => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(storageKey);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStoredCollection = (storageKey: string, data: any[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(data));
  } catch {
    // ignore storage errors and continue
  }
};

const getSortableTimestamp = (value: any) => {
  if (!value) {
    return 0;
  }

  if (typeof value === 'object' && typeof value.seconds === 'number') {
    return value.seconds * 1000;
  }

  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const sortByCreatedAtDesc = <T extends { createdAt?: any }>(items: T[]) => {
  return [...items].sort((a, b) => getSortableTimestamp(b.createdAt) - getSortableTimestamp(a.createdAt));
};

const normalizeLocationText = (value: string) => {
  return String(value || '')
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
};

const isDisasterEntryWithinPastYear = (value: any, nowTimestamp = Date.now()) => {
  const timestamp = getSortableTimestamp(value);
  if (!timestamp || timestamp > nowTimestamp) {
    return false;
  }

  return timestamp >= nowTimestamp - DISASTER_PAST_YEAR_WINDOW_MS;
};

export const filterDisasterHistoryEntries = (entries: any[], locationQuery?: string, nowTimestamp = Date.now()) => {
  const normalizedLocationQuery = normalizeLocationText(locationQuery || '');

  return sortByCreatedAtDesc(entries).filter((entry) => {
    if (!isDisasterEntryWithinPastYear(entry?.createdAt, nowTimestamp)) {
      return false;
    }

    if (!normalizedLocationQuery) {
      return true;
    }

    return normalizeLocationText(entry?.location || '').includes(normalizedLocationQuery);
  });
};

// User Profile Services
export const getUserProfile = async (_userId: string) => {
  return readStoredProfile();
};

export const updateUserProfile = async (_userId: string, data: any) => {
  writeStoredProfile(data);

  // The app is local-first so client-side blockers cannot prevent profile use.
  // Firestore sync is intentionally skipped because some environments block
  // firestore.googleapis.com requests entirely in the browser.
  return true;
};

// Crop Services
export const getUserCrops = async (userId: string) => {
  return sortByCreatedAtDesc(readStoredCollection(getCropsStorageKey(userId)));
};

export const addCrop = async (userId: string, cropData: any) => {
  const id = `local-crop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storageKey = getCropsStorageKey(userId);
  const nextCrop = {
    id,
    ...cropData,
    createdAt: cropData.createdAt ?? new Date(),
    updatedAt: cropData.updatedAt ?? new Date(),
  };

  const existing = readStoredCollection(storageKey);
  writeStoredCollection(storageKey, sortByCreatedAtDesc([nextCrop, ...existing]));
  return id;
};

export const updateCrop = async (userId: string, cropId: string, data: any) => {
  const storageKey = getCropsStorageKey(userId);
  const existing = readStoredCollection(storageKey);
  const updated = existing.map((crop) =>
    crop?.id === cropId ? { ...crop, ...data, updatedAt: new Date() } : crop
  );

  writeStoredCollection(storageKey, sortByCreatedAtDesc(updated));
  return true;
};

export const deleteCrop = async (userId: string, cropId: string) => {
  const storageKey = getCropsStorageKey(userId);
  const existing = readStoredCollection(storageKey);
  const filtered = existing.filter((crop) => crop?.id !== cropId);

  writeStoredCollection(storageKey, sortByCreatedAtDesc(filtered));
  return true;
};

// Scan History Services
export const getUserScanHistory = async (userId: string) => {
  return sortByCreatedAtDesc(readStoredCollection(getScansStorageKey(userId))).slice(0, MAX_SCAN_HISTORY_ITEMS);
};

export const addScanResult = async (userId: string, scanData: any) => {
  const id = `local-scan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const storageKey = getScansStorageKey(userId);
  const nextScan = {
    id,
    ...scanData,
    createdAt: scanData.createdAt ?? new Date(),
  };

  const existing = readStoredCollection(storageKey);
  writeStoredCollection(storageKey, sortByCreatedAtDesc([nextScan, ...existing]).slice(0, MAX_SCAN_HISTORY_ITEMS));
  return id;
};

export const deleteScanResult = async (userId: string, scanId: string) => {
  const storageKey = getScansStorageKey(userId);
  const existing = readStoredCollection(storageKey);
  const filtered = existing.filter((scan) => scan?.id !== scanId);

  writeStoredCollection(storageKey, sortByCreatedAtDesc(filtered).slice(0, MAX_SCAN_HISTORY_ITEMS));
  return true;
};

export const clearUserScanHistory = async (userId: string) => {
  writeStoredCollection(getScansStorageKey(userId), []);
  return true;
};

// Disaster History Services
export const getUserDisasterHistory = async (userId: string) => {
  return sortByCreatedAtDesc(readStoredCollection(getDisasterStorageKey(userId))).slice(0, MAX_DISASTER_HISTORY_ITEMS);
};

export const getUserDisasterHistoryForLocationPastYear = async (
  userId: string,
  locationQuery?: string,
  nowTimestamp = Date.now(),
) => {
  return filterDisasterHistoryEntries(readStoredCollection(getDisasterStorageKey(userId)), locationQuery, nowTimestamp)
    .slice(0, MAX_DISASTER_HISTORY_ITEMS);
};

export const addDisasterAlertHistory = async (userId: string, alertData: any) => {
  const storageKey = getDisasterStorageKey(userId);
  const existing = sortByCreatedAtDesc(readStoredCollection(storageKey));
  const nextEntry = {
    id: `local-disaster-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...alertData,
    createdAt: alertData.createdAt ?? new Date(),
  };

  const latestEntry = existing[0];
  const latestTimestamp = getSortableTimestamp(latestEntry?.createdAt);
  const nextTimestamp = getSortableTimestamp(nextEntry.createdAt);
  const isDuplicateOfLatest = Boolean(
    latestEntry
      && latestEntry?.message === nextEntry.message
      && latestEntry?.location === nextEntry.location
      && Math.abs(nextTimestamp - latestTimestamp) <= DISASTER_DUPLICATE_WINDOW_MS
  );

  if (isDuplicateOfLatest) {
    return latestEntry.id;
  }

  writeStoredCollection(storageKey, sortByCreatedAtDesc([nextEntry, ...existing]).slice(0, MAX_DISASTER_HISTORY_ITEMS));
  return nextEntry.id;
};

// Market Prices Services
export const getMarketPrices = async () => {
  // Legacy compatibility helper.
  // The active app reads market data from src/lib/api.ts instead of Firestore.
  return [];
};

// News Services
export const getNews = async () => {
  // Legacy compatibility helper.
  // The active app reads news from src/lib/api.ts instead of Firestore.
  return [];
};

export default { db: null, auth: null };
