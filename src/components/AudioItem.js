/* eslint-disable react-native/no-inline-styles */
import React, {Component} from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import TrackSlider from './TrackSlider';
import HTML from 'react-native-render-html';

const jsCoreDateCreator = (dateString) => {
  // dateString *HAS* to be in this format "YYYY-MM-DD HH:MM:SS"
  let dateParam = dateString.split(/[\s-:]/);
  //console.log(dateParam);
  dateParam[1] = (parseInt(dateParam[1], 10) - 1).toString();
  return new Date(...dateParam);
};
export default class AudioItem extends Component {
  constructor(props) {
    super(props);
    let publishDate = jsCoreDateCreator(this.props.item.date);
    let dateNow = Date.now();
    this.state = {
      isOpen: false,
      isPlayable: publishDate < dateNow ? true : false,
      dimensions: Dimensions.get('screen'),
    };
  }
  secondsToHms = (d) => {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor((d % 3600) / 60);
    //var s = Math.floor((d % 3600) % 60);

    var hDisplay = h > 0 ? h + (h === 1 ? ' hodina ' : ' hodiny ') : '';
    var mDisplay =
      m > 0 ? m + (m === 1 ? ' minúta' : m < 5 ? ' minúty' : ' minút') : '';
    //var sDisplay = s > 0 ? s + (s === 1 ? 's' : 's') : '';
    return hDisplay + mDisplay;
  };
  dateToRead = (date) => {
    let publishDate = jsCoreDateCreator(date);
    return publishDate.toLocaleDateString('sk-SK', {
      timeZone: 'Europe/Bratislava',
    });
  };
  render() {
    const metaTags = JSON.parse(this.props.item.meta);
    const contentWidth = Dimensions.get('window');
    const iconName =
      this.props.nowPlaying && !this.props.isPaused
        ? 'pause-circle'
        : 'play-circle';
    return (
      <View
        style={[
          styles.listItem,
          this.props.nowPlaying ? styles.listItemPlaying : {},
        ]}>
        <TouchableOpacity
          style={{
            flexDirection: this.state.isOpen
              ? this.state.dimensions.width < 600
                ? 'column'
                : 'row'
              : 'row',
            minHeight: 100,
          }}
          onPress={() => {
            this.setState({isOpen: !this.state.isOpen});
          }}>
          <View
            style={[
              styles.artwork,
              this.state.isOpen
                ? {
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
                this.state.isOpen && this.state.dimensions.width < 600
                  ? {
                      borderBottomLeftRadius: 0,
                      borderTopLeftRadius: 5,
                      borderTopRightRadius: 5,
                    }
                  : {},
              ]}
              source={{uri: this.props.artwork}}
            />
            {this.state.isPlayable && (
              <TouchableOpacity
                onPress={this.props.onPress.bind(this, this.props.listKey)}
                style={{padding: 4}}>
                <Icon
                  name={iconName}
                  size={this.state.isOpen ? 60 : 30}
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
            {this.state.isOpen && (
              <HTML
                style={{marginTop: 10}}
                html={metaTags.long_text}
                contentWidth={contentWidth}
              />
            )}
          </View>
        </TouchableOpacity>
        {this.props.nowPlaying && this.state.isPlayable && (
          <TrackSlider moveTo={this.props.moveTo.bind(this)} />
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#eaeaea',
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
  listItemPlaying: {
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0,
    backgroundColor: '#c7a7a2',
    shadowRadius: 0,
    elevation: 0,
  },
  header: {
    fontSize: 20,
    paddingVertical: 4,
    fontFamily: 'Comfortaa',
  },
});
