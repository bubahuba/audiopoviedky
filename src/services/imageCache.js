import {Platform} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

const IMAGE_DIR = `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/images`;

function hashUrl(url) {
  let hash = 0;
  for (let i = 0; i < url.length; i += 1) {
    hash = (hash << 5) - hash + url.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function extensionFromUrl(url) {
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return match ? match[1] : 'png';
}

function toFileUri(path) {
  return Platform.OS === 'android' ? `file://${path}` : path;
}

async function ensureImageDir() {
  const exists = await ReactNativeBlobUtil.fs.exists(IMAGE_DIR);
  if (!exists) {
    await ReactNativeBlobUtil.fs.mkdir(IMAGE_DIR);
  }
}

export async function cacheImage(url) {
  if (!url || url.startsWith('file://') || url.startsWith('/')) {
    return url;
  }

  await ensureImageDir();
  const localPath = `${IMAGE_DIR}/${hashUrl(url)}.${extensionFromUrl(url)}`;
  const exists = await ReactNativeBlobUtil.fs.exists(localPath);
  if (exists) {
    return toFileUri(localPath);
  }

  try {
    const result = await ReactNativeBlobUtil.config({
      path: localPath,
      fileCache: true,
    }).fetch('GET', url);
    return toFileUri(result.path());
  } catch (error) {
    return url;
  }
}

export async function cacheImages(urls) {
  const uniqueUrls = [...new Set(urls.filter(Boolean))];
  const entries = await Promise.all(
    uniqueUrls.map(async (url) => [url, await cacheImage(url)]),
  );
  return Object.fromEntries(entries);
}
