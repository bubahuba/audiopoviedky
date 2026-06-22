import {API_URL} from '../types/api';
import type {AudioTrack} from '../types/api';
import type {PlaybackTrack, TrackArtworkEntry} from '../types/playback';
import {isAudioPlayable} from './index';
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

  for (let index = 0; index < audioItems.length; index += 1) {
    const audioTrack = audioItems[index];
    const isPlayable = isAudioPlayable(audioTrack);
    const artwork = getArtworkUrl(audioTrack.id);

    trackListArtworks.push({
      artwork,
      id: audioTrack.id,
    });

    if (isPlayable) {
      const localPath = await getLocalTrackPath(audioTrack.id);
      const trackEntry: PlaybackTrack = {
        url: toPlaybackUrl(localPath, audioTrack.file),
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
