export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very_active";

export type UserProfile = {
  heightCm: number | null;
  gender: "male" | "female" | "other";
  age: number | null;
  activity: ActivityLevel;
  goal: "lose" | "maintain" | "gain";
};

const KEY = "nutricare.profile.v1";
const EVENT = "nutricare:profile";

// IMPORTANT: cached server snapshot (stable reference)
const SERVER_SNAPSHOT: UserProfile = {
  heightCm: null,
  gender: "male",
  age: null,
  activity: "moderate",
  goal: "maintain",
};

// Cache for client-side snapshot
let cachedSnapshot: UserProfile | null = null;
let lastRawValue: string | null = null;

export function defaultProfile(): UserProfile {
  return { ...SERVER_SNAPSHOT };
}

export function readProfileFromStorage(): UserProfile {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return { ...SERVER_SNAPSHOT };

    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return { ...SERVER_SNAPSHOT, ...parsed };
  } catch {
    return { ...SERVER_SNAPSHOT };
  }
}

export function saveProfile(profile: UserProfile) {
  if (typeof window === "undefined") return;

  const json = JSON.stringify(profile);
  window.localStorage.setItem(KEY, json);
  window.dispatchEvent(new Event(EVENT));

  // Optional: update our own cache immediately after save
  // (helps in the current tab without waiting for event)
  cachedSnapshot = { ...profile };
  lastRawValue = json;
}

export function subscribeProfile(callback: () => void) {
  if (typeof window === "undefined") return () => {};

  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      // Clear cache when storage changes from another tab
      cachedSnapshot = null;
      lastRawValue = null;
      callback();
    }
  };

  const onCustom = () => {
    // Clear cache on our own save event too
    // (we already updated it in saveProfile, but this is safer)
    cachedSnapshot = null;
    lastRawValue = null;
    callback();
  };

  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onCustom);

  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onCustom);
  };
}

export function getProfileSnapshot(): UserProfile {
  if (typeof window === "undefined") {
    return SERVER_SNAPSHOT;
  }

  const raw = window.localStorage.getItem(KEY);

  // Fast path: nothing changed → return cached stable reference
  if (raw === lastRawValue && cachedSnapshot !== null) {
    return cachedSnapshot;
  }

  // Data changed or first read
  let profile: UserProfile;

  if (!raw) {
    profile = { ...SERVER_SNAPSHOT };
  } else {
    try {
      const parsed = JSON.parse(raw) as Partial<UserProfile>;
      profile = { ...SERVER_SNAPSHOT, ...parsed };
    } catch {
      profile = { ...SERVER_SNAPSHOT };
    }
  }

  // Update cache
  cachedSnapshot = profile;
  lastRawValue = raw;

  return cachedSnapshot;
}

export function getProfileServerSnapshot(): UserProfile {
  // Always the same stable reference
  return SERVER_SNAPSHOT;
}