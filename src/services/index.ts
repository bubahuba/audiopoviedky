import type {AudioTrack} from '../types/api';

export const jsCoreDateCreator = (dateString: string): Date => {
  const dateParam = dateString.split(/[\s-:]/);
  const year = Number(dateParam[0]);
  const month = Number(dateParam[1]) - 1;
  const day = Number(dateParam[2]);
  const hour = Number(dateParam[3] ?? 0);
  const minute = Number(dateParam[4] ?? 0);
  const second = Number(dateParam[5] ?? 0);
  return new Date(year, month, day, hour, minute, second);
};

export function isSubscriptionActive(
  duration: string,
  now = new Date(),
): boolean {
  const expiry = jsCoreDateCreator(duration);
  if (Number.isNaN(expiry.getTime())) {
    return false;
  }

  const hasTime = duration.split(/[\s-:]/).length > 3;
  const expiryMoment = hasTime
    ? expiry
    : new Date(
        expiry.getFullYear(),
        expiry.getMonth(),
        expiry.getDate(),
        23,
        59,
        59,
        999,
      );
  return expiryMoment >= now;
}

export function isAudioPlayable(
  item: Pick<AudioTrack, 'file' | 'duration' | 'date'> | null | undefined,
): boolean {
  if (!item?.file) {
    return false;
  }

  const duration = Number(item.duration);
  if (duration === 0) {
    return true;
  }

  if (!item.date) {
    return true;
  }

  const publishDate = jsCoreDateCreator(item.date);
  if (Number.isNaN(publishDate.getTime())) {
    return true;
  }

  return publishDate.getTime() < Date.now();
}

export function formatDurationSk(seconds: number | string): string {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const hDisplay =
    h > 0 ? h + (h === 1 ? ' hodina ' : ' hodiny ') : '';
  const mDisplay =
    m > 0
      ? m + (m === 1 ? ' minúta' : m < 5 ? ' minúty' : ' minút')
      : '';

  if (hDisplay || mDisplay) {
    return hDisplay + mDisplay;
  }

  if (s > 0) {
    return s + (s === 1 ? ' sekunda' : s < 5 ? ' sekundy' : ' sekúnd');
  }

  return '';
}
