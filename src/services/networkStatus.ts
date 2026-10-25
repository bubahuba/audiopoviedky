import {API_URL} from '../types/api';

const OFFLINE_CHECK_TIMEOUT_MS = 3000;

/** Best-effort reachability check (no extra native dependencies). */
export async function isDeviceOffline(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      OFFLINE_CHECK_TIMEOUT_MS,
    );
    await fetch(API_URL, {
      method: 'HEAD',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return false;
  } catch {
    return true;
  }
}
