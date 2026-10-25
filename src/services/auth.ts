import {fetchJsonFromSource} from './apiCache';
import {
  clearAuthSession,
  loadAuthSession,
  saveAuthSession,
} from './authStorage';
import {API_URL, type LoginResponse} from '../types/api';
import type {AuthSession, Credentials} from '../types/auth';

export async function loginWithCredentials(
  credentials: Credentials,
): Promise<string | null> {
  const url = `${API_URL}prihlasenie?app`;
  const resJson = await fetchJsonFromSource<LoginResponse>(url, {
    method: 'POST',
    mode: 'cors',
    credentials: 'include',
    headers: {
      'Content-type': 'application/x-www-form-urlencoded',
    },
    body: 'email=' + credentials.email + '&passw=' + credentials.passw,
  });
  return resJson.sid ?? null;
}

let freshSessionPromise: Promise<AuthSession | null> | null = null;

async function refreshStoredAuthSession(): Promise<AuthSession | null> {
  const session = await loadAuthSession();
  if (!session?.credentials?.email) {
    return null;
  }

  try {
    const sid = await loginWithCredentials(session.credentials);
    if (!sid) {
      await clearAuthSession();
      return null;
    }

    const freshSession: AuthSession = {
      sid,
      credentials: session.credentials,
    };
    await saveAuthSession(freshSession);
    return freshSession;
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
}

/** Re-authenticates with stored credentials so PHPSESSID is valid on the backend. */
export function ensureFreshAuthSession(): Promise<AuthSession | null> {
  if (!freshSessionPromise) {
    freshSessionPromise = refreshStoredAuthSession().finally(() => {
      freshSessionPromise = null;
    });
  }
  return freshSessionPromise;
}
