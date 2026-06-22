import AsyncStorage from '@react-native-community/async-storage';
import ReactNativeBlobUtil from 'react-native-blob-util';
import {DOWNLOADED_TRACKS_KEY} from './storageKeys';

const TRACK_DIR = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/tracks`;

async function ensureTrackDir() {
  const exists = await ReactNativeBlobUtil.fs.exists(TRACK_DIR);
  if (!exists) {
    await ReactNativeBlobUtil.fs.mkdir(TRACK_DIR);
  }
}

async function readManifest() {
  const raw = await AsyncStorage.getItem(DOWNLOADED_TRACKS_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

async function writeManifest(manifest) {
  await AsyncStorage.setItem(DOWNLOADED_TRACKS_KEY, JSON.stringify(manifest));
}

export async function isTrackDownloaded(trackId) {
  const manifest = await readManifest();
  const entry = manifest[String(trackId)];
  if (!entry?.localPath) {
    return false;
  }
  return ReactNativeBlobUtil.fs.exists(entry.localPath);
}

export async function getLocalTrackPath(trackId) {
  const manifest = await readManifest();
  const entry = manifest[String(trackId)];
  if (!entry?.localPath) {
    return null;
  }
  const exists = await ReactNativeBlobUtil.fs.exists(entry.localPath);
  return exists ? entry.localPath : null;
}

export async function getDownloadedTrackIds() {
  const manifest = await readManifest();
  const ids = [];
  for (const [trackId, entry] of Object.entries(manifest)) {
    if (entry?.localPath && (await ReactNativeBlobUtil.fs.exists(entry.localPath))) {
      ids.push(trackId);
    }
  }
  return ids;
}

export async function downloadTrack(track) {
  await ensureTrackDir();
  const trackId = String(track.id);
  const localPath = `${TRACK_DIR}/${trackId}.mp3`;

  const result = await ReactNativeBlobUtil.config({
    path: localPath,
    fileCache: true,
  }).fetch('GET', track.file);

  const manifest = await readManifest();
  manifest[trackId] = {
    localPath: result.path(),
    title: track.name,
    downloadedAt: Date.now(),
  };
  await writeManifest(manifest);
  return result.path();
}

export async function removeDownloadedTrack(trackId) {
  const id = String(trackId);
  const manifest = await readManifest();
  const entry = manifest[id];
  if (entry?.localPath) {
    const exists = await ReactNativeBlobUtil.fs.exists(entry.localPath);
    if (exists) {
      await ReactNativeBlobUtil.fs.unlink(entry.localPath);
    }
    delete manifest[id];
    await writeManifest(manifest);
  }
}
