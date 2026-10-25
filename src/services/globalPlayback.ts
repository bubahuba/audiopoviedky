import {Alert, AppState, type AppStateStatus} from 'react-native';
import TrackPlayer, {Capability, Event, State} from 'react-native-track-player';
import type {NavigationProp} from '@react-navigation/native';
import {API_URL, type AudioListResponse, type AudioTrack} from '../types/api';
import type {
  CurrentTrackInfo,
  PlaybackState,
  PlaybackTrack,
  TrackArtworkEntry,
} from '../types/playback';
import type {RootStackParamList} from '../types/navigation';
import {isAudioPlayable} from './index';
import {fetchJsonFromSource} from './apiCache';
import {buildTrackLists} from './audioList';
import {cacheImages} from './imageCache';
import {isDeviceOffline} from './networkStatus';
import {isStoredSubscriptionActive} from './subscriptionAccess';
import {
  getLocalTrackPath,
  removeDownloadedTrack,
} from './trackDownloads';
import {setupTrackPlayer} from './trackPlayerSetup';
import {
  loadPlaybackPosition,
  savePlaybackPosition,
} from './playbackPosition';
import {
  loadPlaybackSession,
  savePlaybackSession,
} from './playbackSession';

type PlaybackListener = (state: PlaybackState) => void;
type StackNavigation = NavigationProp<RootStackParamList>;

const listeners = new Set<PlaybackListener>();
let initialized = false;
let sessionRestored = false;
let positionSaveTimer: ReturnType<typeof setInterval> | null = null;
let sessionPersistTimer: ReturnType<typeof setTimeout> | null = null;
let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null =
  null;

let state: PlaybackState = {
  audio: [],
  trackList: [],
  trackListArtworks: [],
  listKey: null,
  nowPlayingId: null,
  isPaused: true,
};

let playbackListSid: string | null = null;

function emit(): void {
  const snapshot = {...state};
  listeners.forEach((listener) => listener(snapshot));
}

function setState(partial: Partial<PlaybackState>): void {
  state = {...state, ...partial};
  emit();

  if (
    'nowPlayingId' in partial ||
    'isPaused' in partial ||
    'audio' in partial ||
    'listKey' in partial ||
    'trackListArtworks' in partial
  ) {
    schedulePersistSession();
  }
}

function schedulePersistSession(): void {
  clearTimeout(sessionPersistTimer ?? undefined);
  sessionPersistTimer = setTimeout(() => {
    persistCurrentSession();
  }, 300);
}

async function persistCurrentSession(): Promise<void> {
  if (!state.nowPlayingId || !state.audio.length) {
    await savePlaybackSession(null);
    return;
  }

  await saveCurrentPosition();

  await savePlaybackSession({
    listKey: state.listKey,
    nowPlayingId: state.nowPlayingId,
    isPaused: state.isPaused,
    audio: state.audio,
    trackListArtworks: state.trackListArtworks,
  });
}

function bindAppStatePersistence(): void {
  if (appStateSubscription) {
    return;
  }

  appStateSubscription = AppState.addEventListener(
    'change',
    (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        persistCurrentSession();
      }
    },
  );
}

export function subscribe(listener: PlaybackListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getPlaybackState(): PlaybackState {
  return {...state};
}

export function hasActiveTrack(): boolean {
  return state.nowPlayingId !== null;
}

export function getCurrentTrackInfo(): CurrentTrackInfo | null {
  if (!state.nowPlayingId) {
    return null;
  }

  const track = state.trackList.find(
    (entry) => entry.id === state.nowPlayingId,
  );
  if (!track) {
    return null;
  }

  const artworkEntry = state.trackListArtworks[track.index];
  const item = state.audio[track.index];

  return {
    track,
    artwork: artworkEntry?.artwork,
    item,
    index: track.index,
  };
}

function findTrackByIndex(index: number): PlaybackTrack | undefined {
  return state.trackList.find((entry) => entry.index === index);
}

function findQueueIndex(trackId: string): number {
  return state.trackList.findIndex((entry) => entry.id === trackId);
}

function findNextPlayableIndex(startIndex: number): number | null {
  for (let index = startIndex; index < state.audio.length; index += 1) {
    if (findTrackByIndex(index)) {
      return index;
    }
  }
  return null;
}

function showOfflinePlaybackAlert(): void {
  Alert.alert(
    'Chyba siete',
    'Na prehratie ukážky je potrebné internetové pripojenie.',
  );
}

async function rebuildTrackQueueFromAudio(): Promise<void> {
  const {trackList, trackListArtworks} = await buildTrackLists(state.audio);
  const artworkMap = await cacheImages(
    trackListArtworks.map((entry) => entry.artwork),
  );
  const cachedArtworks = trackListArtworks.map((entry) => ({
    ...entry,
    artwork: artworkMap[entry.artwork] || entry.artwork,
  }));
  await refreshTracks(state.audio, trackList, cachedArtworks);
}

async function refreshAudioFromServerIfOnline(): Promise<boolean> {
  if (await isDeviceOffline() || !state.listKey || !playbackListSid) {
    return false;
  }

  const requestUrl = `${API_URL}${state.listKey}/?app`;
  try {
    const responseJson = await fetchJsonFromSource<AudioListResponse>(
      requestUrl,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Cookie: `PHPSESSID=${playbackListSid}`,
        },
        credentials: 'omit',
      },
    );
    if (!responseJson.audio?.length) {
      return false;
    }
    setState({audio: responseJson.audio});
    return true;
  } catch {
    return false;
  }
}

function trackUsesLocalFile(track: PlaybackTrack): boolean {
  return track.url.startsWith('file://');
}

/**
 * When subscription expired, local full downloads must not play.
 * Deletes the on-device file; caller rebuilds the queue.
 */
async function purgeExpiredLocalDownload(
  trackId: string,
  track?: PlaybackTrack,
): Promise<boolean> {
  if (await isStoredSubscriptionActive()) {
    return false;
  }

  const localPath = await getLocalTrackPath(trackId);
  const queuedAsLocal = track ? trackUsesLocalFile(track) : false;
  if (!localPath && !queuedAsLocal) {
    return false;
  }

  if (localPath) {
    await removeDownloadedTrack(trackId);
  }
  return true;
}

async function handleExpiredSubscriptionPlayAttempt(
  index: number,
  track: PlaybackTrack,
): Promise<PlaybackTrack | null> {
  const purged = await purgeExpiredLocalDownload(track.id, track);
  if (!purged) {
    return track;
  }

  const offline = await isDeviceOffline();
  if (!offline) {
    await refreshAudioFromServerIfOnline();
  }
  await rebuildTrackQueueFromAudio();

  if (offline) {
    showOfflinePlaybackAlert();
    await TrackPlayer.reset();
    setState({nowPlayingId: null, isPaused: true});
    return null;
  }

  const audioItem = state.audio[index];
  if (!audioItem || !isAudioPlayable(audioItem)) {
    showOfflinePlaybackAlert();
    await TrackPlayer.reset();
    setState({nowPlayingId: null, isPaused: true});
    return null;
  }

  return findTrackByIndex(index) ?? null;
}

async function waitUntilReady(): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 5000) {
    const {state: playerState} = await TrackPlayer.getPlaybackState();
    if (
      playerState !== State.Buffering &&
      playerState !== State.Loading &&
      playerState !== State.None
    ) {
      return;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 200));
  }
}

async function saveCurrentPosition(): Promise<void> {
  try {
    const activeTrack = await TrackPlayer.getActiveTrack();
    if (!activeTrack?.id) {
      return;
    }
    const position = await TrackPlayer.getPosition();
    await savePlaybackPosition(String(activeTrack.id), position);
  } catch {
    // Ignore save errors while the player is resetting.
  }
}

function startPositionSaving(): void {
  clearInterval(positionSaveTimer ?? undefined);
  positionSaveTimer = setInterval(() => {
    if (!state.isPaused && state.nowPlayingId) {
      saveCurrentPosition();
    }
  }, 5000);
}

function stopPositionSaving(): void {
  clearInterval(positionSaveTimer ?? undefined);
  positionSaveTimer = null;
}

async function syncNowPlayingFromPlayer(): Promise<void> {
  const activeTrack = await TrackPlayer.getActiveTrack();
  if (!activeTrack?.id) {
    return;
  }

  const track = state.trackList.find(
    (entry) => entry.id === activeTrack.id,
  );
  if (track) {
    setState({nowPlayingId: track.id});
  }
}

async function handleTrackEnded(): Promise<void> {
  if (!state.nowPlayingId) {
    return;
  }

  const currentTrack = state.trackList.find(
    (entry) => entry.id === state.nowPlayingId,
  );
  if (!currentTrack) {
    return;
  }

  await savePlaybackPosition(state.nowPlayingId, 0);

  const nextIndex = findNextPlayableIndex(currentTrack.index + 1);
  if (nextIndex === null) {
    setState({isPaused: true});
    return;
  }

  await playTrackAtIndex(nextIndex);
}

async function bindPlayerEvents(): Promise<void> {
  TrackPlayer.addEventListener(Event.RemotePlay, () => {
    setState({isPaused: false});
    startPositionSaving();
  });

  TrackPlayer.addEventListener(Event.RemotePause, () => {
    setState({isPaused: true});
    stopPositionSaving();
    saveCurrentPosition();
  });

  TrackPlayer.addEventListener(Event.PlaybackState, async (event) => {
    const playerState = event.state;

    if (playerState === State.Playing) {
      setState({isPaused: false});
      startPositionSaving();
      return;
    }

    if (playerState === State.Paused) {
      setState({isPaused: true});
      stopPositionSaving();
      await saveCurrentPosition();
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, async () => {
    await syncNowPlayingFromPlayer();
    if (!state.isPaused) {
      startPositionSaving();
    }
  });

  TrackPlayer.addEventListener(Event.PlaybackQueueEnded, async () => {
    stopPositionSaving();
    await handleTrackEnded();
  });
}

export async function ensureInitialized(): Promise<void> {
  if (initialized) {
    return;
  }

  initialized = true;
  await setupTrackPlayer();
  await bindPlayerEvents();
  bindAppStatePersistence();
}

export async function restoreLastPlaybackSession(): Promise<boolean> {
  if (sessionRestored) {
    return state.nowPlayingId !== null;
  }

  sessionRestored = true;
  const session = await loadPlaybackSession();
  if (
    !session?.nowPlayingId ||
    !Array.isArray(session.audio) ||
    !session.audio.length
  ) {
    return false;
  }

  await ensureInitialized();

  const trackExists = session.audio.some(
    (item) => String(item.id) === String(session.nowPlayingId),
  );
  if (!trackExists) {
    return false;
  }

  const {trackList, trackListArtworks} = await buildTrackLists(session.audio);
  const playableTrack = trackList.find(
    (entry) => String(entry.id) === String(session.nowPlayingId),
  );
  if (!playableTrack) {
    return false;
  }

  const artworkMap = await cacheImages(
    trackListArtworks.map((entry) => entry.artwork),
  );
  const cachedArtworks = trackListArtworks.map((entry) => ({
    ...entry,
    artwork: artworkMap[entry.artwork] || entry.artwork,
  }));

  await TrackPlayer.reset();
  if (trackList.length) {
    await TrackPlayer.add(trackList);
  }

  const queueIndex = trackList.findIndex(
    (entry) => String(entry.id) === String(session.nowPlayingId),
  );
  if (queueIndex < 0) {
    return false;
  }

  const savedPosition = await loadPlaybackPosition(session.nowPlayingId);
  const initialPosition =
    savedPosition > 0 &&
    playableTrack.duration &&
    savedPosition < playableTrack.duration - 5
      ? savedPosition
      : 0;

  await TrackPlayer.skip(queueIndex, initialPosition);

  setState({
    audio: session.audio,
    trackList,
    trackListArtworks: cachedArtworks,
    listKey: session.listKey ?? null,
    nowPlayingId: playableTrack.id,
    isPaused: true,
  });

  return true;
}

export async function setList(
  listKey: string,
  audio: AudioTrack[],
  trackList: PlaybackTrack[],
  trackListArtworks: TrackArtworkEntry[],
  sid?: string | null,
): Promise<void> {
  await ensureInitialized();

  if (sid !== undefined) {
    playbackListSid = sid;
  }

  const previousListKey = state.listKey;
  setState({audio, trackList, trackListArtworks, listKey});

  const queue = await TrackPlayer.getQueue();
  if (queue.length > 0 && previousListKey === listKey) {
    await syncNowPlayingFromPlayer();
    return;
  }

  if (queue.length > 0 && state.nowPlayingId) {
    return;
  }

  await TrackPlayer.reset();
  if (trackList.length) {
    await TrackPlayer.add(trackList);
  }
}

export async function refreshTracks(
  audio: AudioTrack[],
  trackList: PlaybackTrack[],
  trackListArtworks: TrackArtworkEntry[],
): Promise<void> {
  await ensureInitialized();

  const currentTrackId = state.nowPlayingId;
  let currentPosition = 0;
  const wasPlaying = !state.isPaused;

  if (currentTrackId) {
    currentPosition = await TrackPlayer.getPosition();
    await savePlaybackPosition(currentTrackId, currentPosition);
  }

  setState({audio, trackList, trackListArtworks});
  await TrackPlayer.reset();

  if (trackList.length) {
    await TrackPlayer.add(trackList);
  }

  if (!currentTrackId) {
    return;
  }

  const restoredTrack = trackList.find(
    (entry) => entry.id === currentTrackId,
  );
  if (!restoredTrack) {
    setState({nowPlayingId: null, isPaused: true});
    return;
  }

  const queueIndex = findQueueIndex(currentTrackId);
  if (queueIndex < 0) {
    return;
  }

  await TrackPlayer.skip(queueIndex, currentPosition);
  if (wasPlaying) {
    await TrackPlayer.play();
    setState({nowPlayingId: currentTrackId, isPaused: false});
  } else {
    setState({nowPlayingId: currentTrackId, isPaused: true});
  }
}

export async function playTrackAtIndex(
  index: number,
  navigation?: StackNavigation,
): Promise<void> {
  await ensureInitialized();

  let track = findTrackByIndex(index);
  if (!track) {
    return;
  }

  if (!(await isStoredSubscriptionActive())) {
    const hasLocalCopy =
      Boolean(await getLocalTrackPath(track.id)) ||
      trackUsesLocalFile(track);
    if (hasLocalCopy) {
      const resolved = await handleExpiredSubscriptionPlayAttempt(index, track);
      if (!resolved) {
        return;
      }
      track = resolved;
    }
  }

  if (state.nowPlayingId === track.id) {
    if (state.isPaused) {
      await TrackPlayer.play();
      setState({isPaused: false});
      startPositionSaving();
    } else {
      await TrackPlayer.pause();
      setState({isPaused: true});
      stopPositionSaving();
      await saveCurrentPosition();
    }
    return;
  }

  await saveCurrentPosition();

  await TrackPlayer.reset();
  if (state.trackList.length) {
    await TrackPlayer.add(state.trackList);
  }

  const queueIndex = findQueueIndex(track.id);
  if (queueIndex < 0) {
    return;
  }

  const savedPosition = await loadPlaybackPosition(track.id);
  const initialPosition =
    savedPosition > 0 &&
    track.duration &&
    savedPosition < track.duration - 5
      ? savedPosition
      : -1;

  await TrackPlayer.skip(queueIndex, initialPosition);
  await waitUntilReady();

  await TrackPlayer.play();
  setState({nowPlayingId: track.id, isPaused: false});
  startPositionSaving();

  if (navigation && 'setOptions' in navigation) {
    navigation.setOptions({title: track.title});
  }
}

export async function seekTo(seconds: number): Promise<void> {
  await TrackPlayer.seekTo(seconds);
  if (state.nowPlayingId) {
    await savePlaybackPosition(state.nowPlayingId, seconds);
  }
}

export async function togglePlayback(): Promise<void> {
  if (!state.nowPlayingId) {
    return;
  }

  const currentTrack = state.trackList.find(
    (entry) => entry.id === state.nowPlayingId,
  );
  if (
    currentTrack &&
    !(await isStoredSubscriptionActive()) &&
    (Boolean(await getLocalTrackPath(currentTrack.id)) ||
      trackUsesLocalFile(currentTrack))
  ) {
    const resolved = await handleExpiredSubscriptionPlayAttempt(
      currentTrack.index,
      currentTrack,
    );
    if (!resolved) {
      return;
    }
  }

  if (state.isPaused) {
    await TrackPlayer.play();
    setState({isPaused: false});
    startPositionSaving();
  } else {
    await TrackPlayer.pause();
    setState({isPaused: true});
    stopPositionSaving();
    await saveCurrentPosition();
  }
}
