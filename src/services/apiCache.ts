import AsyncStorage from '@react-native-community/async-storage';
import {apiCacheKey} from './storageKeys';

async function fetchAndStoreJson<T>(
  url: string,
  options: RequestInit,
): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  const json = (await response.json()) as T;
  await AsyncStorage.setItem(apiCacheKey(url), JSON.stringify(json));
  return json;
}

/** Always hits the network; updates cache on success. No stale fallback. */
export async function fetchJsonFromSource<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  return fetchAndStoreJson<T>(url, options);
}

export async function fetchJsonWithCache<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const key = apiCacheKey(url);

  try {
    return await fetchAndStoreJson<T>(url, options);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    if (message.includes('status')) {
      throw error;
    }
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    throw error;
  }
}
