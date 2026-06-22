/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
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
  scrollListToIndex,
} from '../utils/listScroll';
import {fetchJsonWithCache} from '../services/apiCache';
import {cacheImages} from '../services/imageCache';
import {buildTrackLists} from '../services/audioList';
import {
  downloadTrack,
  isTrackDownloaded,
  removeDownloadedTrack,
} from '../services/trackDownloads';
import {
  getPlaybackState,
  playTrackAtIndex,
  refreshTracks,
  seekTo,
  setList,
  subscribe,
} from '../services/globalPlayback';

const apiURL = 'https://audiopoviedky.sk/';

export default class ListScreen extends React.Component {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
    this.onScrollToIndexFailed = createOnScrollToIndexFailed(this.listRef);
    this.state = {
      audio: [],
      trackListArtworks: [],
      playback: getPlaybackState(),
      sid: props.route.params.sid,
      dimensions: Dimensions.get('screen'),
      getHeight: this._getHeight(Dimensions.get('screen')),
      downloadedTracks: {},
      downloadingTracks: {},
    };
  }

  componentDidMount = async () => {
    this.dimensionsSubscription = Dimensions.addEventListener('change', ({screen}) => {
      this.setState({
        dimensions: screen,
        getHeight: this._getHeight(screen),
      });
    });

    this.unsubscribePlayback = subscribe((playback) => {
      this.setState({playback});
      const currentTrack = playback.trackList.find(
        (track) => track.id === playback.nowPlayingId,
      );
      if (currentTrack) {
        this.props.navigation.setOptions({title: currentTrack.title});
      }
    });

    this._focusUnsubscribe = this.props.navigation.addListener('focus', () => {
      this.scrollToRequestedTrack();
    });

    const {route} = this.props;
    const requestUrl = apiURL + route.params.url + '/?app';
    const headers = {
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Host: 'audiopoviedky.sk',
        Expires: 0,
        Cookie: 'PHPSESSID=' + route.params.sid,
      }),
    };

    try {
      const responseJson = await fetchJsonWithCache(requestUrl, headers);
      const audio = responseJson.audio || [];
      this.setState({audio});
      await this.loadDownloadStates(audio);
      await this.refreshTrackQueue(audio);
    } catch (error) {
      console.error(error);
    }
  };

  componentWillUnmount = () => {
    this.unsubscribePlayback?.();
    this.dimensionsSubscription?.remove();
    this._focusUnsubscribe?.();
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

  refreshTrackQueue = async (audioItems) => {
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
    );

    this.setState({
      trackListArtworks: cachedArtworks,
      playback: getPlaybackState(),
    }, () => {
      this.scrollToRequestedTrack();
    });
  };

  loadDownloadStates = async (audioItems) => {
    const downloadedTracks = {};
    await Promise.all(
      audioItems.map(async (item) => {
        downloadedTracks[item.id] = await isTrackDownloaded(item.id);
      }),
    );
    this.setState({downloadedTracks});
  };

  handleDownload = async (item) => {
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

  handleRemoveDownload = async (item) => {
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

  renderItem = (item, index) => {
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
  };

  _setDimensions = () => {
    let dimensions = Dimensions.get('screen');
    this.setState({
      dimensions: dimensions,
      getHeight: this._getHeight(dimensions),
    });
  };

  _getHeight = (dimensions) => {
    let ret =
      dimensions.width < 600 ? dimensions.width - 30 : dimensions.width * 0.4;
    return ret;
  };

  render() {
    const {dimensions, audio} = this.state;
    const horizontalPadding = getListHorizontalPadding(dimensions);
    const safeAreaEdges = getListSafeAreaEdges(dimensions);

    if (audio.length > 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <FlatList
            ref={this.listRef}
            style={styles.list}
            data={audio}
            renderItem={({item, index}) => this.renderItem(item, index)}
            contentContainerStyle={{paddingHorizontal: horizontalPadding}}
            getItemLayout={getEstimatedItemLayout}
            onScrollToIndexFailed={this.onScrollToIndexFailed}
            onLayout={() => {
              this._setDimensions();
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
