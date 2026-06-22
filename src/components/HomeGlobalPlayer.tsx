import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import type {NavigationProp} from '@react-navigation/native';
import AudioItem from './AudioItem';
import {buildTrackLists} from '../services/audioList';
import {cacheImages} from '../services/imageCache';
import {
  downloadTrack,
  isTrackDownloaded,
  removeDownloadedTrack,
} from '../services/trackDownloads';
import {
  getCurrentTrackInfo,
  getPlaybackState,
  playTrackAtIndex,
  refreshTracks,
  seekTo,
  subscribe,
} from '../services/globalPlayback';
import {getListNavigationTarget} from '../services/listNavigation';
import type {AudioTrack} from '../types/api';
import type {RootStackParamList} from '../types/navigation';
import type {PlaybackState} from '../types/playback';
import type {ScreenDimensions} from '../utils/landscapeLayout';

function getArtworkHeight(dimensions: ScreenDimensions): number {
  return dimensions.width < 600
    ? dimensions.width - 30
    : dimensions.width * 0.4;
}

interface HomeGlobalPlayerProps {
  navigation: NavigationProp<RootStackParamList>;
  sid: string;
}

export default function HomeGlobalPlayer({
  navigation,
  sid,
}: HomeGlobalPlayerProps) {
  const [playback, setPlayback] = useState<PlaybackState>(getPlaybackState());
  const [windowDimensions, setWindowDimensions] = useState<ScreenDimensions>(
    Dimensions.get('window'),
  );
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const info = getCurrentTrackInfo();
  const trackId = info?.track?.id;

  useEffect(() => subscribe(setPlayback), []);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      setWindowDimensions(window);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!trackId) {
      setIsDownloaded(false);
      return undefined;
    }

    isTrackDownloaded(trackId).then((downloaded) => {
      if (!cancelled) {
        setIsDownloaded(downloaded);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [trackId]);

  const refreshPlaybackQueue = useCallback(async () => {
    const currentPlayback = getPlaybackState();
    if (!currentPlayback.audio.length) {
      return;
    }

    const {trackList, trackListArtworks} = await buildTrackLists(
      currentPlayback.audio,
    );
    const artworkMap = await cacheImages(
      trackListArtworks.map((entry) => entry.artwork),
    );
    const cachedArtworks = trackListArtworks.map((entry) => ({
      ...entry,
      artwork: artworkMap[entry.artwork] || entry.artwork,
    }));

    await refreshTracks(currentPlayback.audio, trackList, cachedArtworks);
    setPlayback(getPlaybackState());
  }, []);

  const handleDownload = useCallback(async () => {
    if (!info) {
      return;
    }

    const item: AudioTrack =
      info.item ?? {
        id: String(info.track.id),
        name: info.track.title,
        file: info.track.url,
        type: 'A',
        date: new Date().toISOString().slice(0, 10),
        meta: '{}',
        authors: info.track.artist ?? '',
        interpreters: '',
        categories: '',
        visited: '0',
        downloads: '0',
        duration: String(info.track.duration ?? 0),
        tags: '',
        serie: '',
        soon: '0',
        ispaid: null,
        isfav: null,
      };

    setIsDownloading(true);

    try {
      await downloadTrack(item);
      await refreshPlaybackQueue();
      setIsDownloaded(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  }, [info, refreshPlaybackQueue]);

  const handleRemoveDownload = useCallback(async () => {
    if (!trackId) {
      return;
    }

    await removeDownloadedTrack(trackId);
    await refreshPlaybackQueue();
    setIsDownloaded(false);
  }, [trackId, refreshPlaybackQueue]);

  const handleOpenSourceList = useCallback(() => {
    const currentPlayback = getPlaybackState();
    const trackInfo = getCurrentTrackInfo();
    if (!navigation || !currentPlayback.listKey || trackInfo == null) {
      return;
    }

    const target = getListNavigationTarget(
      currentPlayback.listKey,
      sid,
      trackInfo.index,
    );
    if (target) {
      switch (target.screen) {
        case 'najnovsie':
        case 'najpopularnejsie':
        case 'najkratsie':
        case 'najdlhsie':
          navigation.navigate(target.screen, target.params);
          break;
        case 'person_detail':
          navigation.navigate('person_detail', target.params);
          break;
        case 'category_detail':
          navigation.navigate('category_detail', target.params);
          break;
        default:
          break;
      }
    }
  }, [navigation, sid]);

  const isLandscape = windowDimensions.width > windowDimensions.height;
  const artworkHeight = useMemo(
    () => getArtworkHeight(windowDimensions),
    [windowDimensions],
  );

  if (!info) {
    return null;
  }

  const displayItem: AudioTrack =
    info.item ?? {
      id: String(info.track.id),
      name: info.track.title,
      authors: info.track.artist ?? '',
      interpreters: '',
      meta: '{}',
      date: new Date().toISOString().slice(0, 10),
      duration: String(info.track.duration ?? 0),
      file: info.track.url,
      type: 'A',
      categories: '',
      visited: '0',
      downloads: '0',
      tags: '',
      serie: '',
      soon: '0',
      ispaid: null,
      isfav: null,
    };

  return (
    <SafeAreaView
      edges={isLandscape ? ['top', 'left', 'right'] : ['top']}
      style={[styles.container, isLandscape && styles.containerLandscape]}>
      <View
        style={[
          styles.playerWrapper,
          isLandscape && styles.playerWrapperLandscape,
        ]}>
        <AudioItem
          item={displayItem}
          artwork={info.artwork ?? ''}
          onPress={() => playTrackAtIndex(info.index)}
          listKey={info.index}
          nowPlaying={true}
          isPaused={playback.isPaused}
          moveTo={seekTo}
          getHeight={artworkHeight}
          forceOpen={!isLandscape}
          homeCompact={!isLandscape}
          landscapeControls={isLandscape}
          screenDimensions={windowDimensions}
          isDownloaded={isDownloaded}
          isDownloading={isDownloading}
          onDownload={handleDownload}
          onRemoveDownload={handleRemoveDownload}
          onCardPress={handleOpenSourceList}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#c7a7a2',
  },
  containerLandscape: {
    alignSelf: 'stretch',
  },
  playerWrapper: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  playerWrapperLandscape: {
    paddingBottom: 4,
    paddingHorizontal: 20,
  },
});
