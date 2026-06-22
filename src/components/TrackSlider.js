import React, {useState} from 'react';
import {useProgress} from 'react-native-track-player';
import {Text, View, StyleSheet} from 'react-native';
import Slider from '@react-native-community/slider';
import {PLAYBACK_PROGRESS_UPDATE_MS} from '../utils/playbackProgress';

function formatTime(timeInSec) {
  if (!Number.isFinite(timeInSec) || timeInSec < 0) {
    return '00:00';
  }
  let mins = parseInt(timeInSec / 60, 10);
  let secs = parseInt(Math.round(timeInSec % 60), 10);
  if (mins < 10) {
    mins = '0' + mins;
  }
  if (secs < 10) {
    secs = '0' + secs;
  }
  return mins + ':' + secs;
}

export default function TrackSlider({
  moveTo,
  fallbackDuration = 0,
  horizontalInset = 0,
}) {
  const {position, duration} = useProgress(PLAYBACK_PROGRESS_UPDATE_MS);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seek, setSeek] = useState(0);
  const totalDuration = duration > 0 ? duration : fallbackDuration;
  const safeMaximum = totalDuration > 0 ? totalDuration : 1;
  const displayPosition = isSeeking ? seek : position;
  const remaining = Math.max(totalDuration - displayPosition, 0);

  return (
    <View
      style={[
        styles.container,
        horizontalInset > 0 && {paddingHorizontal: 8 + horizontalInset},
      ]}>
      <View style={styles.timeContainer}>
        <Text style={styles.position} numberOfLines={1}>
          {formatTime(displayPosition)}
        </Text>
        <Slider
          style={styles.slider}
          value={Math.min(displayPosition, safeMaximum)}
          thumbTintColor="#271809"
          minimumValue={0}
          maximumValue={safeMaximum}
          minimumTrackTintColor="#271809"
          maximumTrackTintColor="rgba(39, 24, 9, 0.2)"
          onValueChange={(val) => {
            setIsSeeking(true);
            setSeek(val);
          }}
          onSlidingComplete={(val) => {
            moveTo(val);
            setIsSeeking(false);
          }}
        />
        <Text style={styles.duration} numberOfLines={1}>
          {formatTime(remaining)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#c7a7a2',
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 10,
    minHeight: 44,
  },
  position: {
    color: '#271809',
    textAlign: 'left',
    fontFamily: 'Comfortaa',
    fontSize: 12,
    minWidth: 44,
    width: 44,
  },
  duration: {
    color: '#271809',
    textAlign: 'right',
    fontFamily: 'Comfortaa',
    fontSize: 12,
    minWidth: 44,
    width: 44,
  },
  timeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 8,
  },
});
