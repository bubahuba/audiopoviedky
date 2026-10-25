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
import PersonItem from '../components/PersonItem';
import {
  getListHorizontalPadding,
  getListSafeAreaEdges,
  isLandscape,
} from '../utils/landscapeLayout';
import {
  createOnScrollToIndexFailed,
  scrollFlatListToTop,
  scrollListToIndex,
} from '../utils/listScroll';
import {setScrollToTopHeaderTitle} from '../utils/listHeader';
import ListRefreshControl from '../components/ListRefreshControl';
import {fetchJsonFromSource, fetchJsonWithCache} from '../services/apiCache';
import {cacheImage, cacheImages} from '../services/imageCache';
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
import {
  API_URL,
  type AudioTrack,
  type Person,
  type PersonDetailResponse,
} from '../types/api';
import type {RootStackScreenProps} from '../types/navigation';
import type {PlaybackState, TrackArtworkEntry} from '../types/playback';

type DetailRouteName = 'person_detail' | 'category_detail';

type Props = RootStackScreenProps<DetailRouteName>;

interface PersonDetailScreenState {
  audio: AudioTrack[];
  trackListArtworks: TrackArtworkEntry[];
  playback: PlaybackState;
  persons: Person[] | null;
  dimensions: ScaledSize;
  getHeight: number;
  downloadedTracks: Record<string, boolean>;
  downloadingTracks: Record<string, boolean>;
  headerArtwork: string | null;
  isLoading: boolean;
  refreshing: boolean;
}

export default class PersonDetailScreen extends React.Component<
  Props,
  PersonDetailScreenState
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
      persons: null,
      dimensions,
      getHeight: this.getHeight(dimensions),
      downloadedTracks: {},
      downloadingTracks: {},
      headerArtwork: null,
      isLoading: true,
      refreshing: false,
    };
  }

  getListKey = (): string => {
    const {route} = this.props;
    return `${route.params.url}/${route.params.personId}`;
  };

  componentDidMount = async () => {
    const {route} = this.props;
    if (route.params.title) {
      this.updateHeaderTitle(route.params.title);
    }

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
      if (currentTrack) {
        this.updateHeaderTitle(currentTrack.title);
      }
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

    await this.loadDetail(false);
    this.setState({isLoading: false});
  };

  getRequestOptions = (): RequestInit => {
    const {route} = this.props;
    return {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Cache: 'no-cache',
        Cookie: 'PHPSESSID=' + route.params.sid,
      },
      credentials: 'omit',
    };
  };

  loadDetail = async (fromSource: boolean) => {
    const {route} = this.props;
    const requestUrl = `${API_URL}${route.params.url}/${route.params.personId}/?app`;
    const fetchJson = fromSource ? fetchJsonFromSource : fetchJsonWithCache;

    try {
      const responseJson = await fetchJson<PersonDetailResponse>(
        requestUrl,
        this.getRequestOptions(),
      );

      const audio =
        route.params.url === 'autori'
          ? responseJson.audio
          : [...responseJson.audio].reverse();
      const persons =
        route.params.url === 'autori'
          ? responseJson.authors ?? null
          : responseJson.interpreters ?? null;

      let headerArtwork: string | null = null;
      if (persons?.[0]) {
        const remoteArtwork =
          route.params.url === 'autori'
            ? `${API_URL}data/${persons[0].id}_author.png`
            : `${API_URL}data/${persons[0].id}_interpreter.png`;
        headerArtwork = await cacheImage(remoteArtwork);
      }

      this.setState({
        audio,
        persons,
        headerArtwork,
      });
      await this.loadDownloadStates(audio);
      await this.refreshTrackQueue(audio, !fromSource);
      this.updateHeaderTitle(
        persons ? persons[0].name : route.params.title ?? '',
      );
    } catch (error) {
      console.error(error);
    }
  };

  handleRefresh = async () => {
    this.setState({refreshing: true});
    await this.loadDetail(true);
    this.setState({refreshing: false, isLoading: false});
  };

  scrollToTop = () => {
    scrollFlatListToTop(this.listRef);
  };

  updateHeaderTitle = (title: string) => {
    if (!title) {
      return;
    }
    setScrollToTopHeaderTitle(
      this.props.navigation,
      title,
      this.scrollToTop,
    );
  };

  componentWillUnmount = () => {
    this.unsubscribePlayback?.();
    this.dimensionsSubscription?.remove();
    this.focusUnsubscribe?.();
    this.unsubscribeDownloadRemovals?.();
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
      this.getListKey(),
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
    if (this.state.trackListArtworks[index]) {
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

  personHeader = () => {
    if (this.state.persons) {
      const {playback} = this.state;
      const hasActiveTrackInList = this.state.audio.some(
        (item) => item.id === playback.nowPlayingId,
      );

      return (
        <PersonItem
          item={this.state.persons[0]}
          artwork={this.state.headerArtwork ?? ''}
          isOpen={true}
          listKey={this.state.persons[0].id}
          onPress={() => {
            if (hasActiveTrackInList) {
              const activeIndex = this.state.audio.findIndex(
                (item) => item.id === playback.nowPlayingId,
              );
              playTrackAtIndex(activeIndex, this.props.navigation);
            } else {
              playTrackAtIndex(0, this.props.navigation);
            }
          }}
          isPaused={playback.isPaused}
          nowPlaying={hasActiveTrackInList ? playback.nowPlayingId : null}
          getHeight={this.state.getHeight}
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
    const {dimensions, trackListArtworks, isLoading, refreshing} = this.state;
    const horizontalPadding = getListHorizontalPadding(dimensions);
    const safeAreaEdges = getListSafeAreaEdges(dimensions);

    if (isLoading && trackListArtworks.length === 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <ActivityIndicator size="large" color="#261710" style={styles.list} />
        </SafeAreaView>
      );
    }

    if (trackListArtworks.length > 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <FlatList
            ref={this.listRef}
            style={styles.list}
            data={this.state.audio}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={this.personHeader()}
            renderItem={({item, index}) => this.renderItem(item, index)}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingVertical: 5,
            }}
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
