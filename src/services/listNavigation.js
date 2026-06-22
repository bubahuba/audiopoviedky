const AUDIO_LIST_SCREENS = {
  audio: 'najnovsie',
  'audio/najpopularnejsie': 'najpopularnejsie',
  'audio/najkratsie': 'najkratsie',
  'audio/najdlhsie': 'najdlhsie',
};

export function getListNavigationTarget(listKey, sid, scrollToIndex) {
  if (!listKey || sid == null) {
    return null;
  }

  const params = {sid, scrollToIndex};

  const audioScreen = AUDIO_LIST_SCREENS[listKey];
  if (audioScreen) {
    return {
      screen: audioScreen,
      params: {...params, url: listKey},
    };
  }

  const detailMatch = listKey.match(/^(autori|interpreti|kategorie)\/(.+)$/);
  if (detailMatch) {
    const [, url, personId] = detailMatch;
    return {
      screen: url === 'kategorie' ? 'category_detail' : 'person_detail',
      params: {...params, url, personId},
    };
  }

  return null;
}
