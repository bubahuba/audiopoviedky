import {isAudioPlayable} from './index';
import {getLocalTrackPath} from './trackDownloads';

const API_URL = 'https://audiopoviedky.sk/';

export function getArtworkUrl(trackId) {
  return `${API_URL}data/${trackId}_audio.png`;
}

function toPlaybackUrl(localPath, remoteUrl) {
  if (!localPath) {
    return remoteUrl;
  }
  if (localPath.startsWith('file://')) {
    return localPath;
  }
  return `file://${localPath}`;
}

export async function buildTrackLists(audioItems) {
  const trackList = [];
  const trackListArtworks = [];

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
      const trackEntry = {
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
