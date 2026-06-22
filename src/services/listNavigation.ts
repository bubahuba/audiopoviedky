import type {AudioListScreenParams, PersonDetailScreenParams} from '../types/navigation';

const AUDIO_LIST_SCREENS = {
  audio: 'najnovsie',
  'audio/najpopularnejsie': 'najpopularnejsie',
  'audio/najkratsie': 'najkratsie',
  'audio/najdlhsie': 'najdlhsie',
} as const;

type AudioListScreenName =
  (typeof AUDIO_LIST_SCREENS)[keyof typeof AUDIO_LIST_SCREENS];

export type ListNavigationTarget =
  | {
      screen: AudioListScreenName;
      params: AudioListScreenParams;
    }
  | {
      screen: 'person_detail' | 'category_detail';
      params: PersonDetailScreenParams;
    };

export function getListNavigationTarget(
  listKey: string,
  sid: string | null,
  scrollToIndex: number,
): ListNavigationTarget | null {
  if (!listKey || sid == null) {
    return null;
  }

  const params = {sid, scrollToIndex};

  const audioScreen =
    listKey in AUDIO_LIST_SCREENS
      ? AUDIO_LIST_SCREENS[listKey as keyof typeof AUDIO_LIST_SCREENS]
      : undefined;
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
      params: {
        ...params,
        url: url as PersonDetailScreenParams['url'],
        personId,
      },
    };
  }

  return null;
}
