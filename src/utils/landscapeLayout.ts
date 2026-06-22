export interface ScreenDimensions {
  width: number;
  height: number;
}

export function isLandscape(dimensions: ScreenDimensions): boolean {
  return dimensions.width > dimensions.height;
}

export function getListHorizontalPadding(dimensions: ScreenDimensions): number {
  return isLandscape(dimensions) ? 20 : 10;
}

/** Width reserved for the A–Z side index on person lists. */
export const ALPHABET_RAIL_WIDTH = 28;

export function getPersonListContentPadding(dimensions: ScreenDimensions): {
  left: number;
  right: number;
} {
  const horizontal = getListHorizontalPadding(dimensions);
  return {
    left: horizontal,
    right: horizontal + ALPHABET_RAIL_WIDTH,
  };
}

export function getListSafeAreaEdges(
  dimensions: ScreenDimensions,
): ('left' | 'right' | 'bottom')[] {
  return isLandscape(dimensions) ? ['left', 'right', 'bottom'] : [];
}
