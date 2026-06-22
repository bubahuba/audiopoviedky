export const LIST_ITEM_ESTIMATED_HEIGHT = 118;

export function scrollListToIndex(listRef, index) {
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

export function createOnScrollToIndexFailed(listRef) {
  return (info) => {
    setTimeout(() => {
      listRef.current?.scrollToIndex({
        index: info.index,
        animated: true,
        viewPosition: 0.25,
      });
    }, 150);
  };
}

export function getEstimatedItemLayout(_data, index) {
  return {
    length: LIST_ITEM_ESTIMATED_HEIGHT,
    offset: LIST_ITEM_ESTIMATED_HEIGHT * index,
    index,
  };
}
