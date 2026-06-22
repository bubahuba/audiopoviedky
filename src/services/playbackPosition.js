import AsyncStorage from '@react-native-community/async-storage';
import {PLAYBACK_POSITION_PREFIX} from './storageKeys';

export async function savePlaybackPosition(trackId, position) {
  if (!trackId || !position || position <= 0) {
    return;
  }
  await AsyncStorage.setItem(
    `${PLAYBACK_POSITION_PREFIX}${trackId}`,
    String(position),
  );
}

export async function loadPlaybackPosition(trackId) {
  if (!trackId) {
    return 0;
  }
  const value = await AsyncStorage.getItem(
    `${PLAYBACK_POSITION_PREFIX}${trackId}`,
  );
  return value ? parseFloat(value) : 0;
}
