import AsyncStorage from '@react-native-community/async-storage';
import {apiCacheKey} from './storageKeys';

export async function fetchJsonWithCache(url, options = {}) {
  const key = apiCacheKey(url);

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }
    const json = await response.json();
    await AsyncStorage.setItem(key, JSON.stringify(json));
    return json;
  } catch (error) {
    if (String(error?.message || error).includes('status')) {
      throw error;
    }
    const cached = await AsyncStorage.getItem(key);
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
}
