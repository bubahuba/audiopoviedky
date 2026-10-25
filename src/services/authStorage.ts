import AsyncStorage from './asyncStorage';
import type {AuthSession, Credentials} from '../types/auth';
import {
  AUTH_EMAIL_KEY,
  AUTH_PASS_KEY,
  AUTH_SESSION_KEY,
  AUTH_SID_KEY,
} from './storageKeys';

interface SaveAuthSessionInput {
  sid: string;
  credentials: Credentials;
}

export async function saveAuthSession({
  sid,
  credentials,
}: SaveAuthSessionInput): Promise<void> {
  const items: [string, string][] = [
    [AUTH_EMAIL_KEY, credentials.email],
    [AUTH_PASS_KEY, credentials.passw],
    [AUTH_SID_KEY, sid || ''],
    [
      AUTH_SESSION_KEY,
      JSON.stringify({
        sid,
        credentials,
      }),
    ],
  ];
  await AsyncStorage.multiSet(items);
}

export async function loadAuthSession(): Promise<AuthSession | null> {
  const [[, email], [, passw], [, sid], [, sessionJson]] =
    await AsyncStorage.multiGet([
      AUTH_EMAIL_KEY,
      AUTH_PASS_KEY,
      AUTH_SID_KEY,
      AUTH_SESSION_KEY,
    ]);

  if (sessionJson) {
    try {
      return JSON.parse(sessionJson) as AuthSession;
    } catch {
      // Fall through to legacy keys.
    }
  }

  if (email && sid) {
    return {
      sid,
      credentials: {
        email,
        passw: passw || '',
      },
    };
  }

  return null;
}

export async function clearAuthSession(): Promise<void> {
  await AsyncStorage.multiRemove([
    AUTH_EMAIL_KEY,
    AUTH_PASS_KEY,
    AUTH_SID_KEY,
    AUTH_SESSION_KEY,
  ]);
}
