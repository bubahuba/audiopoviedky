export function isLandscape(dimensions) {
  return dimensions.width > dimensions.height;
}

export function getListHorizontalPadding(dimensions) {
  return isLandscape(dimensions) ? 20 : 10;
}

export function getListSafeAreaEdges(dimensions) {
  return isLandscape(dimensions) ? ['left', 'right', 'bottom'] : [];
}
