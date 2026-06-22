import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useProgress} from 'react-native-track-player';
import {PLAYBACK_PROGRESS_UPDATE_MS} from '../utils/playbackProgress';

export default function AudioProgressBar() {
  const {position, duration} = useProgress(PLAYBACK_PROGRESS_UPDATE_MS);

  if (!duration) {
    return null;
  }

  const ratio = Math.min(Math.max(position / duration, 0), 1);

  return (
    <View style={styles.track} pointerEvents="none">
      <View style={[styles.fill, {flex: ratio}]} />
      <View style={{flex: 1 - ratio}} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    flexDirection: 'row',
    zIndex: 10,
  },
  fill: {
    backgroundColor: '#fff',
    height: 1,
  },
});
