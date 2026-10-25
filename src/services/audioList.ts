import {API_URL} from '../types/api';
import type {AudioTrack} from '../types/api';
import type {PlaybackTrack, TrackArtworkEntry} from '../types/playback';
import {isAudioPlayable} from './index';
import {isStoredSubscriptionActive} from './subscriptionAccess';
import {getLocalTrackPath} from './trackDownloads';

export function getArtworkUrl(trackId: string): string {
  return `${API_URL}data/${trackId}_audio.png`;
}

function toPlaybackUrl(
  localPath: string | null,
  remoteUrl: string,
): string {
  if (!localPath) {
    return remoteUrl;
  }
  if (localPath.startsWith('file://')) {
    return localPath;
  }
  return `file://${localPath}`;
}

export interface BuiltTrackLists {
  trackList: PlaybackTrack[];
  trackListArtworks: TrackArtworkEntry[];
}

export async function buildTrackLists(
  audioItems: AudioTrack[],
): Promise<BuiltTrackLists> {
  const trackList: PlaybackTrack[] = [];
  const trackListArtworks: TrackArtworkEntry[] = [];
  const subscriptionActive = await isStoredSubscriptionActive();

  for (let index = 0; index < audioItems.length; index += 1) {
    const audioTrack = audioItems[index];
    const localPath = subscriptionActive
      ? await getLocalTrackPath(audioTrack.id)
      : null;
    const isPlayable =
      isAudioPlayable(audioTrack) ||
      (subscriptionActive && Boolean(localPath));
    const artwork = getArtworkUrl(audioTrack.id);

    trackListArtworks.push({
      artwork,
      id: audioTrack.id,
    });

    if (isPlayable) {
      const remoteUrl = audioTrack.file || '';
      if (!localPath && !remoteUrl) {
        continue;
      }
      const trackEntry: PlaybackTrack = {
        url: toPlaybackUrl(localPath, remoteUrl),
        artist: audioTrack.authors,
        id: audioTrack.id,
        index,
        title: audioTrack.name,
        artwork,
        contentType: 'audio/mp3',
      };
      const duration = Number(audioTrack.duration);
      if (duration > 0) {
        trackEntry.duration = duration;
      }
      trackList.push(trackEntry);
    }
  }

  return {trackList, trackListArtworks};
}
