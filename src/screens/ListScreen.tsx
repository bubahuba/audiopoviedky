/* eslint-disable react-native/no-inline-styles */
import React, {createRef} from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
  type ScaledSize,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AudioItem from '../components/AudioItem';
import {
  getListHorizontalPadding,
  getListSafeAreaEdges,
  isLandscape,
} from '../utils/landscapeLayout';
import {
  createOnScrollToIndexFailed,
  getEstimatedItemLayout,
  scrollFlatListToTop,
  scrollListToIndex,
} from '../utils/listScroll';
import {setScrollToTopHeaderTitle} from '../utils/listHeader';
import ListRefreshControl from '../components/ListRefreshControl';
import {fetchJsonFromSource, fetchJsonWithCache} from '../services/apiCache';
import {cacheImages} from '../services/imageCache';
import {buildTrackLists} from '../services/audioList';
import {
  downloadTrack,
  isTrackDownloaded,
  removeDownloadedTrack,
  subscribeToDownloadRemovals,
} from '../services/trackDownloads';
import {
  getPlaybackState,
  playTrackAtIndex,
  refreshTracks,
  seekTo,
  setList,
  subscribe,
} from '../services/globalPlayback';
import {API_URL, type AudioListResponse, type AudioTrack} from '../types/api';
import type {RootStackScreenProps} from '../types/navigation';
import type {PlaybackState, TrackArtworkEntry} from '../types/playback';

type ListRouteName =
  | 'najkratsie'
  | 'najnovsie'
  | 'najpopularnejsie'
  | 'najdlhsie';

const LIST_SCREEN_TITLES: Record<ListRouteName, string> = {
  najkratsie: 'Najkratšie poviedky',
  najnovsie: 'Najnovšie poviedky',
  najpopularnejsie: 'Najpopulárnejšie poviedky',
  najdlhsie: 'Najdlhšie poviedky',
};

type Props = RootStackScreenProps<ListRouteName>;

interface ListScreenState {
  audio: AudioTrack[];
  trackListArtworks: TrackArtworkEntry[];
  playback: PlaybackState;
  sid: string | null;
  dimensions: ScaledSize;
  getHeight: number;
  downloadedTracks: Record<string, boolean>;
  downloadingTracks: Record<string, boolean>;
  isLoading: boolean;
  refreshing: boolean;
}

export default class ListScreen extends React.Component<
  Props,
  ListScreenState
> {
  private listRef = createRef<FlatList<AudioTrack>>();
  private onScrollToIndexFailed = createOnScrollToIndexFailed(this.listRef);
  private unsubscribePlayback?: () => void;
  private dimensionsSubscription?: {remove: () => void};
  private focusUnsubscribe?: () => void;
  private unsubscribeDownloadRemovals?: () => void;

  constructor(props: Props) {
    super(props);
    const dimensions = Dimensions.get('screen');
    this.state = {
      audio: [],
      trackListArtworks: [],
      playback: getPlaybackState(),
      sid: props.route.params.sid,
      dimensions,
      getHeight: this.getHeight(dimensions),
      downloadedTracks: {},
      downloadingTracks: {},
      isLoading: true,
      refreshing: false,
    };
  }

  componentDidMount = async () => {
    this.updateHeaderTitle(LIST_SCREEN_TITLES[this.props.route.name]);

    this.dimensionsSubscription = Dimensions.addEventListener(
      'change',
      ({screen}) => {
        this.setState({
          dimensions: screen,
          getHeight: this.getHeight(screen),
        });
      },
    );

    this.unsubscribePlayback = subscribe((playback) => {
      this.setState({playback});
      const currentTrack = playback.trackList.find(
        (track) => track.id === playback.nowPlayingId,
      );
      const title =
        currentTrack?.title ?? LIST_SCREEN_TITLES[this.props.route.name];
      this.updateHeaderTitle(title);
    });

    this.focusUnsubscribe = this.props.navigation.addListener('focus', () => {
      this.scrollToRequestedTrack();
    });

    this.unsubscribeDownloadRemovals = subscribeToDownloadRemovals(
      (trackId) => {
        this.setState(({downloadedTracks}) => ({
          downloadedTracks: {...downloadedTracks, [trackId]: false},
        }));
      },
    );

    await this.loadAudio(false);
    this.setState({isLoading: false});
  };

  getRequestOptions = (): RequestInit => {
    const {route} = this.props;
    return {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
        Cookie: 'PHPSESSID=' + route.params.sid,
      },
      credentials: 'omit',
    };
  };

  loadAudio = async (fromSource: boolean) => {
    const {route} = this.props;
    const requestUrl = `${API_URL}${route.params.url}/?app`;
    const fetchJson = fromSource ? fetchJsonFromSource : fetchJsonWithCache;

    try {
      const responseJson = await fetchJson<AudioListResponse>(
        requestUrl,
        this.getRequestOptions(),
      );
      const audio = responseJson.audio || [];
      this.setState({audio});
      await this.loadDownloadStates(audio);
      await this.refreshTrackQueue(audio, !fromSource);
    } catch (error) {
      console.error(error);
    }
  };

  handleRefresh = async () => {
    this.setState({refreshing: true});
    await this.loadAudio(true);
    this.setState({refreshing: false, isLoading: false});
  };

  componentWillUnmount = () => {
    this.unsubscribePlayback?.();
    this.dimensionsSubscription?.remove();
    this.focusUnsubscribe?.();
    this.unsubscribeDownloadRemovals?.();
  };

  scrollToTop = () => {
    scrollFlatListToTop(this.listRef);
  };

  updateHeaderTitle = (title: string) => {
    setScrollToTopHeaderTitle(
      this.props.navigation,
      title,
      this.scrollToTop,
    );
  };

  scrollToRequestedTrack = () => {
    const index = this.props.route.params?.scrollToIndex;
    if (
      index == null ||
      !this.state.audio.length ||
      !this.state.trackListArtworks.length
    ) {
      return;
    }
    scrollListToIndex(this.listRef, index);
  };

  refreshTrackQueue = async (
    audioItems: AudioTrack[],
    scrollAfterLoad = true,
  ) => {
    const {trackList, trackListArtworks} = await buildTrackLists(audioItems);
    const artworkMap = await cacheImages(
      trackListArtworks.map((entry) => entry.artwork),
    );
    const cachedArtworks = trackListArtworks.map((entry) => ({
      ...entry,
      artwork: artworkMap[entry.artwork] || entry.artwork,
    }));

    await setList(
      this.props.route.params.url,
      audioItems,
      trackList,
      cachedArtworks,
      this.props.route.params.sid,
    );

    this.setState(
      {
        trackListArtworks: cachedArtworks,
        playback: getPlaybackState(),
      },
      () => {
        if (scrollAfterLoad) {
          this.scrollToRequestedTrack();
        }
      },
    );
  };

  loadDownloadStates = async (audioItems: AudioTrack[]) => {
    const downloadedTracks: Record<string, boolean> = {};
    await Promise.all(
      audioItems.map(async (item) => {
        downloadedTracks[item.id] = await isTrackDownloaded(item.id);
      }),
    );
    this.setState({downloadedTracks});
  };

  handleDownload = async (item: AudioTrack) => {
    this.setState(({downloadingTracks}) => ({
      downloadingTracks: {...downloadingTracks, [item.id]: true},
    }));

    try {
      await downloadTrack(item);
      const {trackList, trackListArtworks} = await buildTrackLists(
        this.state.audio,
      );
      const artworkMap = await cacheImages(
        trackListArtworks.map((entry) => entry.artwork),
      );
      const cachedArtworks = trackListArtworks.map((entry) => ({
        ...entry,
        artwork: artworkMap[entry.artwork] || entry.artwork,
      }));
      await refreshTracks(this.state.audio, trackList, cachedArtworks);
      this.setState(({downloadedTracks, downloadingTracks}) => ({
        trackListArtworks: cachedArtworks,
        downloadedTracks: {...downloadedTracks, [item.id]: true},
        downloadingTracks: {...downloadingTracks, [item.id]: false},
        playback: getPlaybackState(),
      }));
    } catch (error) {
      console.error(error);
      this.setState(({downloadingTracks}) => ({
        downloadingTracks: {...downloadingTracks, [item.id]: false},
      }));
    }
  };

  handleRemoveDownload = async (item: AudioTrack) => {
    await removeDownloadedTrack(item.id);
    const {trackList, trackListArtworks} = await buildTrackLists(
      this.state.audio,
    );
    const artworkMap = await cacheImages(
      trackListArtworks.map((entry) => entry.artwork),
    );
    const cachedArtworks = trackListArtworks.map((entry) => ({
      ...entry,
      artwork: artworkMap[entry.artwork] || entry.artwork,
    }));
    await refreshTracks(this.state.audio, trackList, cachedArtworks);
    this.setState(({downloadedTracks}) => ({
      trackListArtworks: cachedArtworks,
      downloadedTracks: {...downloadedTracks, [item.id]: false},
      playback: getPlaybackState(),
    }));
  };

  renderItem = (item: AudioTrack, index: number) => {
    if (this.state.trackListArtworks[index]?.artwork) {
      const {playback, dimensions} = this.state;
      const landscape = isLandscape(dimensions);
      return (
        <AudioItem
          item={item}
          artwork={this.state.trackListArtworks[index].artwork}
          onPress={() => playTrackAtIndex(index, this.props.navigation)}
          listKey={index}
          nowPlaying={playback.nowPlayingId === item.id}
          isPaused={playback.isPaused}
          moveTo={seekTo}
          getHeight={this.state.getHeight}
          screenDimensions={dimensions}
          landscapeControls={landscape}
          isDownloaded={!!this.state.downloadedTracks[item.id]}
          isDownloading={!!this.state.downloadingTracks[item.id]}
          onDownload={() => this.handleDownload(item)}
          onRemoveDownload={() => this.handleRemoveDownload(item)}
        />
      );
    }
    return null;
  };

  setDimensions = () => {
    const dimensions = Dimensions.get('screen');
    this.setState({
      dimensions,
      getHeight: this.getHeight(dimensions),
    });
  };

  getHeight = (dimensions: ScaledSize): number => {
    return dimensions.width < 600
      ? dimensions.width - 30
      : dimensions.width * 0.4;
  };

  render() {
    const {dimensions, audio, isLoading, refreshing} = this.state;
    const horizontalPadding = getListHorizontalPadding(dimensions);
    const safeAreaEdges = getListSafeAreaEdges(dimensions);

    if (isLoading && audio.length === 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <ActivityIndicator size="large" color="#261710" style={styles.list} />
        </SafeAreaView>
      );
    }

    if (audio.length > 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <FlatList
            ref={this.listRef}
            style={styles.list}
            data={audio}
            keyExtractor={(item) => item.id}
            renderItem={({item, index}) => this.renderItem(item, index)}
            contentContainerStyle={{paddingHorizontal: horizontalPadding}}
            getItemLayout={getEstimatedItemLayout}
            onScrollToIndexFailed={this.onScrollToIndexFailed}
            refreshControl={
              <ListRefreshControl
                refreshing={refreshing}
                onRefresh={this.handleRefresh}
              />
            }
            onLayout={() => {
              this.setDimensions();
            }}
          />
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.container} edges={safeAreaEdges}>
        <ActivityIndicator size="large" color="#261710" style={styles.list} />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c7a7a2',
  },
  list: {
    flex: 1,
  },
});
