export const jsCoreDateCreator = (dateString) => {
  // dateString *HAS* to be in this format "YYYY-MM-DD HH:MM:SS"
  let dateParam = dateString.split(/[\s-:]/);
  //console.log(dateParam);
  dateParam[1] = (parseInt(dateParam[1], 10) - 1).toString();
  return new Date(...dateParam);
};

export function isAudioPlayable(item) {
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

export function formatDurationSk(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const hDisplay = h > 0 ? h + (h === 1 ? ' hodina ' : ' hodiny ') : '';
  const mDisplay =
    m > 0 ? m + (m === 1 ? ' minúta' : m < 5 ? ' minúty' : ' minút') : '';

  if (hDisplay || mDisplay) {
    return hDisplay + mDisplay;
  }

  if (s > 0) {
    return s + (s === 1 ? ' sekunda' : s < 5 ? ' sekundy' : ' sekúnd');
  }

  return '';
}
