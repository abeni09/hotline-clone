// src/types/index.ts

export type TileType = 'red' | 'fire' | 'black';

export interface Tile {
  id: TileType;
  color: string; // Base color for the tile
  label: string; // Text or emoji for the tile
  multiplier: number;
}
