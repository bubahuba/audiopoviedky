import AsyncStorage from '@react-native-async-storage/async-storage';

const MANIFEST_ERROR = 'manifest.json';

async function withStorageRetry<T>(
  operation: () => Promise<T>,
  retries = 2,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!message.includes(MANIFEST_ERROR) || attempt === retries) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
    }
  }

  throw lastError;
}

export default {
  getItem: (key: string) => withStorageRetry(() => AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    withStorageRetry(() => AsyncStorage.setItem(key, value)),
  removeItem: (key: string) =>
    withStorageRetry(() => AsyncStorage.removeItem(key)),
  multiGet: (keys: readonly string[]) =>
    withStorageRetry(() => AsyncStorage.multiGet(keys)),
  multiSet: (keyValuePairs: readonly [string, string][]) =>
    withStorageRetry(() => AsyncStorage.multiSet(keyValuePairs)),
  multiRemove: (keys: readonly string[]) =>
    withStorageRetry(() => AsyncStorage.multiRemove(keys)),
};
