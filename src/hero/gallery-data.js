// Tile manifest for the hero grid atlas. Order sets atlas slot order.
export const TILES = Array.from({ length: 14 }, (_, i) =>
  `/shots/shot-${String(i + 1).padStart(2, '0')}.svg`
);

export const ATLAS = { cols: 4, rows: 4, cell: 512, cellH: 320 };
