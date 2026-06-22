import TrackPlayer, {Capability} from 'react-native-track-player';

let setupPromise = null;

function isAlreadyInitializedError(error) {
  if (error?.code === 'player_already_initialized') {
    return true;
  }
  const message = error?.message ?? String(error);
  return message.includes('already been initialized');
}

export function setupTrackPlayer() {
  if (!setupPromise) {
    setupPromise = (async () => {
      try {
        await TrackPlayer.setupPlayer();
      } catch (error) {
        if (!isAlreadyInitializedError(error)) {
          throw error;
        }
      }

      await TrackPlayer.updateOptions({
        stopWithApp: false,
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.Stop,
          Capability.SeekTo,
          Capability.Skip,
        ],
      });
    })();
  }

  return setupPromise;
}
