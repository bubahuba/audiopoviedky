// Hermes can SIGSEGV when DevTools attaches while JS timers are firing
// (react-native#55571). Keep dev polling coarse; production stays responsive.
export const PLAYBACK_PROGRESS_UPDATE_MS = __DEV__ ? 2000 : 250;
