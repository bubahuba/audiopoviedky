import type {RefObject} from 'react';
import type {FlatList, SectionList} from 'react-native';

export const LIST_ITEM_ESTIMATED_HEIGHT = 118;
export const SECTION_HEADER_ESTIMATED_HEIGHT = 34;
export const SECTION_FOOTER_ESTIMATED_HEIGHT = 0;

export interface SectionListLayoutSection {
  data: unknown[];
}

export function getPersonSectionListItemLayout(
  sections: SectionListLayoutSection[],
  index: number,
) {
  let offset = 0;
  let flatIndex = 0;

  for (const section of sections) {
    if (flatIndex === index) {
      return {
        length: SECTION_HEADER_ESTIMATED_HEIGHT,
        offset,
        index,
      };
    }
    offset += SECTION_HEADER_ESTIMATED_HEIGHT;
    flatIndex += 1;

    for (let itemIndex = 0; itemIndex < section.data.length; itemIndex += 1) {
      if (flatIndex === index) {
        return {
          length: LIST_ITEM_ESTIMATED_HEIGHT,
          offset,
          index,
        };
      }
      offset += LIST_ITEM_ESTIMATED_HEIGHT;
      flatIndex += 1;
    }

    if (flatIndex === index) {
      return {
        length: SECTION_FOOTER_ESTIMATED_HEIGHT,
        offset,
        index,
      };
    }
    offset += SECTION_FOOTER_ESTIMATED_HEIGHT;
    flatIndex += 1;
  }

  return {
    length: LIST_ITEM_ESTIMATED_HEIGHT,
    offset,
    index,
  };
}

export function scrollFlatListToTop<T>(
  listRef: RefObject<FlatList<T> | null>,
): void {
  listRef.current?.scrollToOffset({offset: 0, animated: true});
}

export function scrollSectionListToTop<T, S>(
  listRef: RefObject<SectionList<T, S> | null>,
): void {
  if (!listRef.current) {
    return;
  }

  listRef.current.scrollToLocation({
    sectionIndex: 0,
    itemIndex: 0,
    viewOffset: 0,
    animated: true,
  });
}

export function scrollListToIndex<T>(
  listRef: RefObject<FlatList<T> | null>,
  index: number,
): void {
  if (index == null || index < 0 || !listRef?.current) {
    return;
  }

  requestAnimationFrame(() => {
    listRef.current?.scrollToIndex({
      index,
      animated: true,
      viewPosition: 0.25,
    });
  });
}

export function createOnScrollToIndexFailed<T>(
  listRef: RefObject<FlatList<T> | null>,
) {
  return (info: {index: number}) => {
    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0.25,
      });
    }, 150);
  };
}

export function getEstimatedItemLayout<T>(
  _data: ArrayLike<T> | null | undefined,
  index: number,
) {
  return {
    length: LIST_ITEM_ESTIMATED_HEIGHT,
    offset: LIST_ITEM_ESTIMATED_HEIGHT * index,
    index,
  };
}
