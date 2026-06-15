/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Dimensions,
} from 'react-native';
import AudioItem from '../components/AudioItem';
import TrackPlayer from 'react-native-track-player';

const apiURL = 'https://audiopoviedky.sk/';

const jsCoreDateCreator = (dateString) => {
  // dateString *HAS* to be in this format "YYYY-MM-DD HH:MM:SS"
  let dateParam = dateString.split(/[\s-:]/);
  //console.log(dateParam);
  dateParam[1] = (parseInt(dateParam[1], 10) - 1).toString();
  return new Date(...dateParam);
};
export default class ListScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      audio: [],
      trackList: [],
      trackListArtworks: [],
      nowPlaying: null,
      isPaused: true,
      sid: props.route.params.sid,
      dimensions: Dimensions.get('screen'),
      getHeight: this._getHeight(Dimensions.get('screen')),
    };
  }
  static navigationOptions = {
    title: 'AudioPoviedky.sk',
  };
  playerSetup = async () => {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      stopWithApp: false,
      capabilities: [
        TrackPlayer.CAPABILITY_PLAY,
        TrackPlayer.CAPABILITY_PAUSE,
        TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
        TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
        TrackPlayer.CAPABILITY_STOP,
        TrackPlayer.CAPABILITY_SEEK_TO,
        TrackPlayer.CAPABILITY_SKIP,
      ],
    });
    TrackPlayer.addEventListener('remote-next', this._updateCurrentTrack);
    TrackPlayer.addEventListener('remote-previous', this._updateCurrentTrack);
    TrackPlayer.addEventListener('remote-seek', this._seekCurrentTrack);
    TrackPlayer.addEventListener(
      'playback-track-changed',
      this._updateCurrentTrack,
    );
    TrackPlayer.addEventListener('playback-queue-ended', this._queueEnded);
    TrackPlayer.addEventListener('remote-pause', () => {
      this.setState({isPaused: true});
    });
    TrackPlayer.addEventListener('remote-play', () => {
      this.setState({isPaused: false});
    });
  };
  _updateCurrentTrack = async () => {
    if (!this.state.isPaused) {
      try {
        let playerTrackId = await TrackPlayer.getCurrentTrack();
        let indexTrack = this.state.trackList.filter(function (key) {
          return key.id === playerTrackId;
        })[0].index;
        this.setState({nowPlaying: indexTrack});
        this.props.navigation.setOptions({
          title: this.state.trackList[this.state.nowPlaying].title,
        });
      } catch (error) {}
    }
  };

  _seekCurrentTrack = async (event) => {
    await TrackPlayer.seekTo(event.position);
  };
  componentWillUnmount = async () => {
    await this.setState({isPaused: true, nowPlaying: null});
    await TrackPlayer.reset();
  };

  componentDidMount = () => {
    const {route} = this.props;
    const headers = {
      //method: 'GET', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-store', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'omit', // include, *same-origin, omit
      headers: new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        //Origin: '',
        Host: 'audiopoviedky.sk',
        Expires: 0,
        Cookie: 'PHPSESSID=' + route.params.sid,
      }),
    };
    fetch(apiURL + route.params.url + '/?app', headers)
      .then((response) => response.json())
      .then((responseJson) => {
        this.setState({audio: responseJson.audio});
        const trackList = [];
        const trackListArtworks = [];
        responseJson.audio.map((audioTrack, index) => {
          let publishDate = jsCoreDateCreator(audioTrack.date).getTime();
          let dateNow = Date.now();
          let isPlayable = publishDate < dateNow;

          //console.log(publishDate, dateNow);
          let artwork =
            'https://audiopoviedky.sk/data/' + audioTrack.id + '_audio.png';
          if (isPlayable) {
            trackList.push({
              url: audioTrack.file,
              artist: audioTrack.authors,
              id: audioTrack.id,
              index: index,
              title: audioTrack.name,
              artwork: artwork,
              duration: audioTrack.duration,
              contentType: 'audio/mp3',
            });
          }
          trackListArtworks.push({
            artwork: artwork,
            id: audioTrack.id,
          });
        });
        this.setState(
          {trackList: trackList, trackListArtworks: trackListArtworks},
          () => {
            this.playerSetup();
            TrackPlayer.reset();
            TrackPlayer.add(this.state.trackList);
          },
        );
      })
      .catch((error) => {
        console.error(error);
      });
  };

  renderItem = (item, index) => {
    if (this.state.trackListArtworks[index].artwork) {
      return (
        <AudioItem
          item={item}
          artwork={this.state.trackListArtworks[index].artwork}
          onPress={this.onItemPlayPress}
          listKey={index}
          nowPlaying={this.state.nowPlaying === index ? true : false}
          isPaused={this.state.isPaused}
          moveTo={this.moveTo.bind(this)}
          getHeight={this.state.getHeight}
        />
      );
    }
  };
  moveTo = (sec) => {
    TrackPlayer.seekTo(sec);
  };

  _queueEnded = () => {
    setTimeout(() => {
      this.setState({nowPlaying: null, isPaused: true});
    }, 200);
  };
  onItemPlayPress = (item) => {
    if (this.state.nowPlaying === item) {
      if (this.state.isPaused === true) {
        this.setState({isPaused: false}, () => {
          TrackPlayer.play();
        });
      } else {
        this.setState({isPaused: true}, () => {
          TrackPlayer.pause();
        });
      }
    } else {
      this.setState({nowPlaying: item}, async () => {
        const playingID = this.state.trackList[this.state.nowPlaying].id;
        await TrackPlayer.skip(playingID);
        let refreshPlay = setInterval(async () => {
          let playerState = await TrackPlayer.getState();
          let url = this.state.trackList[this.state.nowPlaying];
          if (playerState === TrackPlayer.STATE_BUFFERING) {
            console.log(
              await TrackPlayer.getBufferedPosition(),
              playerState,
              url,
            );
          } else {
            clearInterval(refreshPlay);
            this.setState({isPaused: false}, () => {
              TrackPlayer.play();
              this.props.navigation.setOptions({
                title: this.state.trackList[this.state.nowPlaying].title,
              });
            });
          }
        }, 1000);
      });
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
    if (this.state.trackList.length > 0) {
      return (
        <FlatList
          style={styles.container}
          data={this.state.audio}
          renderItem={({item, index}) => this.renderItem(item, index)}
          contentContainerStyle={{paddingHorizontal: 10}}
          onLayout={(event) => {
            this._setDimensions(event);
          }}
        />
      );
    } else {
      return (
        <ActivityIndicator
          size="large"
          color="#261710"
          style={styles.container}
        />
      );
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c7a7a2',
  },
  artwork: {
    padding: 5,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
  },
  listItem: {
    marginVertical: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,

    elevation: 6,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
