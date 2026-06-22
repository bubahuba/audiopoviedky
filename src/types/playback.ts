import type {Track} from 'react-native-track-player';
import type {AudioTrack} from './api';

export interface PlaybackTrack extends Track {
  id: string;
  index: number;
  url: string;
  title: string;
  artist: string;
  artwork?: string;
  duration?: number;
  contentType: string;
}

export interface TrackArtworkEntry {
  artwork: string;
  id: string;
}

export interface PlaybackState {
  audio: AudioTrack[];
  trackList: PlaybackTrack[];
  trackListArtworks: TrackArtworkEntry[];
  listKey: string | null;
  nowPlayingId: string | null;
  isPaused: boolean;
}

export interface CurrentTrackInfo {
  track: PlaybackTrack;
  artwork: string | undefined;
  item: AudioTrack | undefined;
  index: number;
}

export interface PersistedPlaybackSession {
  listKey: string | null;
  nowPlayingId: string;
  isPaused: boolean;
  audio: AudioTrack[];
  trackListArtworks: TrackArtworkEntry[];
}

export interface DownloadManifestEntry {
  localPath: string;
  title: string;
  downloadedAt: number;
}

export type DownloadManifest = Record<string, DownloadManifestEntry>;
