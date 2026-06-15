import React from 'react';
import TrackPlayer from 'react-native-track-player';
import {Text, View, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider';
export default class TrackSlider extends TrackPlayer.ProgressComponent {
  state = {
    duration: 0,
    position: 0,
    isSeeking: false,
    seek: 0,
  };
  shouldComponentUpdate(nextProps, nextState) {
    const {
      duration: prevDuration,
      position: prevPosition,
      bufferedPosition: prevBufferedPosition,
    } = this.state;
    const {
      duration: nextDuration,
      position: nextPosition,
      bufferedPosition: nextBufferedPosition,
    } = nextState;
    if (
      prevDuration !== nextDuration ||
      prevPosition !== nextPosition ||
      prevBufferedPosition !== nextBufferedPosition
    ) {
      return true;
    }
    return false;
  }
  formatTime = (timeInSec) => {
    let mins = parseInt(timeInSec / 60, 10);
    let secs = parseInt(Math.round((timeInSec % 60) * 100) / 100, 10);
    if (mins < 10) {
      mins = '0' + mins;
    }
    if (secs < 10) {
      secs = '0' + secs;
    }
    return mins + ':' + secs;
  };

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.timeContainer}>
          <Text style={styles.position} numberOfLines={1}>
            {this.formatTime(this.state.position)}
          </Text>
          <Slider
            style={styles.slider}
            value={this.state.isSeeking ? this.seek : this.state.position}
            thumbTintColor="black"
            minimumValue={0}
            thumbStyle={styles.thumbStyle}
            animationType="timing"
            maximumValue={this.state.duration}
            minimumTrackTintColor={'black'}
            maximumTrackTintColor={'rgba(0,0,0,0.2)'}
            onValueChange={(val) => {
              //TrackPlayer.pause();
              this.setState({isSeeking: true, seek: val});
            }}
            onSlidingComplete={(val) => {
              //console.log(val);
              this.props.moveTo(val);
              this.setState({value: val});
            }}
          />
          <Text style={styles.duration} numberOfLines={1}>
            {this.formatTime(this.state.duration - this.state.position)}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#c7a7a2',
    justifyContent: 'center',
    color: 'black',
  },
  thumbStyle: {
    width: 10,
    height: 10,
  },
  position: {
    color: 'black',
    textAlign: 'left',
  },
  duration: {
    color: 'black',
    textAlign: 'right',
  },
  timeContainer: {
    alignItems: 'center',
    color: 'black',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 5,
  },
  slider: {
    marginLeft: 10,
    marginRight: 10,
    flex: 1,
  },
});
