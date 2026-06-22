/* eslint-disable react-native/no-inline-styles */
import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TrackSlider from './TrackSlider';
import AudioProgressBar from './AudioProgressBar';
import HTML from 'react-native-render-html';
import {jsCoreDateCreator, formatDurationSk, isAudioPlayable} from '../services';

export default class AudioItem extends Component {
  constructor(props) {
    super(props);
    const dimensions = props.screenDimensions || Dimensions.get('screen');
    this.state = {
      isOpen: typeof props.forceOpen === 'boolean' ? props.forceOpen : false,
      isPlayable: isAudioPlayable(props.item),
      dimensions,
    };
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    const updates = {};

    if (
      typeof nextProps.forceOpen === 'boolean' &&
      nextProps.forceOpen !== prevState.isOpen
    ) {
      updates.isOpen = nextProps.forceOpen;
    }

    if (nextProps.item) {
      const isPlayable = isAudioPlayable(nextProps.item);
      if (isPlayable !== prevState.isPlayable) {
        updates.isPlayable = isPlayable;
      }
    }

    if (nextProps.screenDimensions) {
      const current = prevState.dimensions || {};
      const next = nextProps.screenDimensions;
      if (current.width !== next.width || current.height !== next.height) {
        updates.dimensions = next;
      }
    }

    return Object.keys(updates).length ? updates : null;
  }
  secondsToHms = (d) => formatDurationSk(d);
  dateToRead = (date) => {
    let publishDate = jsCoreDateCreator(date);
    return publishDate.toLocaleDateString('sk-SK', {
      timeZone: 'Europe/Bratislava',
    });
  };
  renderDownloadAction = () => {
    const {isPlayable} = this.state;
    const {isDownloaded, isDownloading, onDownload, onRemoveDownload} =
      this.props;

    if (!isPlayable || (!onDownload && !onRemoveDownload)) {
      return null;
    }

    if (isDownloading) {
      return (
        <View style={styles.downloadAction}>
          <ActivityIndicator size="small" color="#271809" />
        </View>
      );
    }

    if (isDownloaded) {
      return (
        <TouchableOpacity
          style={styles.downloadAction}
          onPress={onRemoveDownload}
          hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
          <Icon name="download-off" size={28} color="#271809" />
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        style={styles.downloadAction}
        onPress={onDownload}
        hitSlop={{top: 8, bottom: 8, left: 8, right: 8}}>
        <Icon name="download" size={28} color="#271809" />
      </TouchableOpacity>
    );
  };
  render() {
    let metaTags = {};
    try {
      metaTags = JSON.parse(this.props.item.meta || '{}');
    } catch (error) {
      metaTags = {};
    }
    const descriptionHtml = metaTags.long_text;
    const contentWidth = Dimensions.get('window').width;
    const iconName =
      this.props.nowPlaying && !this.props.isPaused
        ? 'pause-circle'
        : 'play-circle';
    const {isDownloaded, homeCompact, landscapeControls} = this.props;
    const isLandscapeLayout =
      this.state.dimensions.width > this.state.dimensions.height;
    const playControlPadding = landscapeControls && isLandscapeLayout ? 10 : 4;
    const playControlHitSlop =
      landscapeControls && isLandscapeLayout
        ? {top: 12, bottom: 12, left: 12, right: 12}
        : undefined;
    const isLayoutLocked = typeof this.props.forceOpen === 'boolean';
    const useColumnOpenLayout =
      this.state.isOpen &&
      !homeCompact &&
      this.state.dimensions.width < 600;
    const compactArtworkSize = 120;
    return (
      <View
        style={[
          styles.listItem,
          this.props.nowPlaying ? styles.listItemPlaying : styles.listItemIdle,
        ]}>
        <View style={styles.cardContent}>
        {this.props.nowPlaying ? <AudioProgressBar /> : null}
        <View style={styles.row}>
          <TouchableOpacity
            style={{
              flex: 1,
              flexDirection: this.state.isOpen
                ? useColumnOpenLayout
                  ? 'column'
                  : 'row'
                : 'row',
              minHeight: homeCompact && this.state.isOpen ? compactArtworkSize : 100,
            }}
            onPress={() => {
              if (this.props.onCardPress) {
                this.props.onCardPress();
                return;
              }
              if (isLayoutLocked) {
                return;
              }
              this.setState({isOpen: !this.state.isOpen});
            }}>
            <View
              style={[
                styles.artwork,
                this.state.isOpen
                  ? homeCompact
                    ? {
                        minWidth: compactArtworkSize,
                        minHeight: compactArtworkSize,
                        width: compactArtworkSize,
                        borderBottomLeftRadius: 5,
                        borderTopLeftRadius: 5,
                      }
                    : {
                        minWidth: this.props.getHeight,
                        minHeight: this.props.getHeight,
                        borderBottomLeftRadius: 0,
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                      }
                  : {
                      minHeight: 100,
                      width: 100,
                    },
              ]}>
              <Image
                style={[
                  styles.artwork,
                  {
                    resizeMode: 'cover',
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    opacity: this.props.nowPlaying ? 0.6 : 1,
                  },
                  this.state.isOpen && !homeCompact && this.state.dimensions.width < 600
                    ? {
                        borderBottomLeftRadius: 0,
                        borderTopLeftRadius: 5,
                        borderTopRightRadius: 5,
                      }
                    : {},
                ]}
                source={{uri: this.props.artwork}}
              />
              {isDownloaded && (
                <View style={styles.offlineBadge}>
                  <Text style={styles.offlineBadgeText}>OFFLINE</Text>
                </View>
              )}
              {this.state.isPlayable && (
                <TouchableOpacity
                  onPress={this.props.onPress.bind(this, this.props.listKey)}
                  style={{padding: playControlPadding}}
                  hitSlop={playControlHitSlop}>
                  <Icon
                    name={iconName}
                    size={this.state.isOpen && !homeCompact ? 60 : 30}
                    style={
                      this.props.nowPlaying ? styles.iconPlaying : styles.icon
                    }
                  />
                </TouchableOpacity>
              )}
            </View>
            <View style={{padding: 10, flex: 1, justifyContent: 'center'}}>
              <Text style={{fontWeight: 'bold'}}>{this.props.item.authors}</Text>
              <Text style={styles.header}>{this.props.item.name}</Text>
              <Text>
                Číta:{' '}
                <Text style={{fontWeight: 'bold'}}>
                  {this.props.item.interpreters}
                </Text>
              </Text>
              {!this.state.isPlayable && (
                <Text>
                  Premiéra:{' '}
                  <Text style={{fontWeight: 'bold'}}>
                    {this.dateToRead(this.props.item.date)}
                  </Text>
                </Text>
              )}
              {this.props.item.duration && this.props.item.duration > 0 && (
                <Text>
                  Dĺžka:{' '}
                  <Text style={{fontWeight: 'bold'}}>
                    {this.secondsToHms(this.props.item.duration)}
                  </Text>
                </Text>
              )}
              {this.state.isOpen && descriptionHtml && !homeCompact ? (
                <HTML
                  source={{html: String(descriptionHtml)}}
                  contentWidth={contentWidth}
                />
              ) : null}
            </View>
          </TouchableOpacity>
          {this.renderDownloadAction()}
        </View>
        </View>
        {this.props.nowPlaying && this.state.isPlayable && (
          <TrackSlider
            moveTo={this.props.moveTo.bind(this)}
            fallbackDuration={Number(this.props.item.duration) || 0}
            horizontalInset={landscapeControls && isLandscapeLayout ? 4 : 0}
          />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  cardContent: {
    overflow: 'hidden',
    backgroundColor: 'white',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  downloadAction: {
    width: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 8,
  },
  offlineBadge: {
    position: 'absolute',
    top: 10,
    right: -22,
    backgroundColor: '#271809',
    width: 90,
    paddingVertical: 3,
    zIndex: 2,
    transform: [{rotate: '45deg'}],
    alignItems: 'center',
  },
  offlineBadgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  iconPlaying: {
    position: 'relative',
    color: '#271809',
    textShadowColor: '#c7a7a2',
    textShadowRadius: 5,
  },
  icon: {
    position: 'relative',
    color: '#c7a7a2',
  },
  artwork: {
    backgroundColor: '#00000044',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    borderBottomLeftRadius: 5,
    borderTopLeftRadius: 5,
    overflow: 'hidden',
  },
  listItem: {
    marginVertical: 5,
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
    minHeight: 100,
  },
  listItemIdle: {
    overflow: 'hidden',
  },
  listItemPlaying: {
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    backgroundColor: '#c7a7a2',
    shadowRadius: 0,
    elevation: 0,
    overflow: 'visible',
  },
  header: {
    fontSize: 20,
    paddingVertical: 4,
    fontFamily: 'Comfortaa',
  },
});
