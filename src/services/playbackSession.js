import AsyncStorage from '@react-native-community/async-storage';
import {PLAYBACK_SESSION_KEY} from './storageKeys';

export async function savePlaybackSession(session) {
  if (!session?.nowPlayingId || !session.audio?.length) {
    await AsyncStorage.removeItem(PLAYBACK_SESSION_KEY);
    return;
  }

  await AsyncStorage.setItem(
    PLAYBACK_SESSION_KEY,
    JSON.stringify({
      listKey: session.listKey ?? null,
      nowPlayingId: session.nowPlayingId,
      isPaused: session.isPaused !== false,
      audio: session.audio,
      trackListArtworks: session.trackListArtworks ?? [],
    }),
  );
}

export async function loadPlaybackSession() {
  const raw = await AsyncStorage.getItem(PLAYBACK_SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

export async function clearPlaybackSession() {
  await AsyncStorage.removeItem(PLAYBACK_SESSION_KEY);
}
