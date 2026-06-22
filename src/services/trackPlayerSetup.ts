import TrackPlayer, {Capability} from 'react-native-track-player';

let setupPromise: Promise<void> | null = null;

function isAlreadyInitializedError(error: unknown): boolean {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'player_already_initialized'
  ) {
    return true;
  }
  const message =
    error instanceof Error ? error.message : String(error);
  return message.includes('already been initialized');
}

export function setupTrackPlayer(): Promise<void> {
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
