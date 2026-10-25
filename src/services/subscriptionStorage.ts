import AsyncStorage from './asyncStorage';
import {SUBSCRIPTION_STATUS_KEY} from './storageKeys';

export interface StoredSubscription {
  /** `stream[0].duration` from the nakupy endpoint (subscription expiry). */
  expiryDuration: string;
  savedAt: number;
}

export async function saveStoredSubscription(
  expiryDuration: string,
): Promise<void> {
  const payload: StoredSubscription = {
    expiryDuration,
    savedAt: Date.now(),
  };
  await AsyncStorage.setItem(SUBSCRIPTION_STATUS_KEY, JSON.stringify(payload));
}

export async function loadStoredSubscription(): Promise<StoredSubscription | null> {
  const raw = await AsyncStorage.getItem(SUBSCRIPTION_STATUS_KEY);
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as StoredSubscription;
    if (!parsed?.expiryDuration) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function clearStoredSubscription(): Promise<void> {
  await AsyncStorage.removeItem(SUBSCRIPTION_STATUS_KEY);
}
