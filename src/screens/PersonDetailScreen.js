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
import PersonItem from '../components/PersonItem';
import {
  getListHorizontalPadding,
  getListSafeAreaEdges,
  isLandscape,
} from '../utils/landscapeLayout';
import {
  createOnScrollToIndexFailed,
  scrollListToIndex,
} from '../utils/listScroll';
import {fetchJsonWithCache} from '../services/apiCache';
import {cacheImage, cacheImages} from '../services/imageCache';
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

export default class PersonDetailScreen extends React.Component {
  constructor(props) {
    super(props);
    this.listRef = React.createRef();
    this.onScrollToIndexFailed = createOnScrollToIndexFailed(this.listRef);
    this.state = {
      audio: [],
      trackListArtworks: [],
      playback: getPlaybackState(),
      persons: null,
      dimensions: Dimensions.get('screen'),
      getHeight: this._getHeight(Dimensions.get('screen')),
      downloadedTracks: {},
      downloadingTracks: {},
      headerArtwork: null,
    };
  }

  getListKey = () => {
    const {route} = this.props;
    return `${route.params.url}/${route.params.personId}`;
  };

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
    const requestUrl =
      apiURL + route.params.url + '/' + route.params.personId + '/?app';

    try {
      const responseJson = await fetchJsonWithCache(requestUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Cache: 'no-cache',
          Cookie: 'PHPSESSID=' + route.params.sid,
        },
        credentials: 'omit',
      });

      const audio =
        route.params.url === 'autori'
          ? responseJson.audio
          : responseJson.audio.reverse();
      const persons =
        route.params.url === 'autori'
          ? responseJson.authors
          : responseJson.interpreters;

      let headerArtwork = null;
      if (persons?.[0]) {
        const remoteArtwork =
          route.params.url === 'autori'
            ? apiURL + 'data/' + persons[0].id + '_author.png'
            : apiURL + 'data/' + persons[0].id + '_interpreter.png';
        headerArtwork = await cacheImage(remoteArtwork);
      }

      this.setState({
        audio,
        persons,
        headerArtwork,
      });
      await this.loadDownloadStates(audio);
      await this.refreshTrackQueue(audio);
      this.props.navigation.setOptions({
        title: persons ? persons[0].name : route.params.title,
      });
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

    await setList(this.getListKey(), audioItems, trackList, cachedArtworks);

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
          artwork={this.state.headerArtwork}
          isOpen={true}
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
    } else {
      return null;
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
    const {dimensions, trackListArtworks} = this.state;
    const horizontalPadding = getListHorizontalPadding(dimensions);
    const safeAreaEdges = getListSafeAreaEdges(dimensions);

    if (trackListArtworks.length > 0) {
      return (
        <SafeAreaView style={styles.container} edges={safeAreaEdges}>
          <FlatList
            ref={this.listRef}
            style={styles.list}
            data={this.state.audio}
            ListHeaderComponent={this.personHeader()}
            renderItem={({item, index}) => this.renderItem(item, index)}
            contentContainerStyle={{
              paddingHorizontal: horizontalPadding,
              paddingVertical: 5,
            }}
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
