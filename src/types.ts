export type Cell = 0 | 1 | 2; // empty, filled, crossed
export type Tool = "fill" | "cross" | "erase" | "pan";
export interface Puzzle {
  id: string;
  title: string;
  width: number;
  height: number;
  solution: (0 | 1)[];
  collection: string;
  /** Row-major original artwork colors, including the background. */
  colors?: string[];
}
export interface Move {
  indices: number[];
  before: Cell[];
  after: Cell[];
}
export interface Game {
  cells: Cell[];
  elapsed: number;
  past: Move[];
  future: Move[];
  crossedClues: string[];
}
export interface SavedGame {
  cells: Cell[];
  elapsed: number;
  crossedClues: string[];
}
export interface SaveData {
  version: 1;
  selectedId: string;
  games: Record<string, SavedGame>;
}
