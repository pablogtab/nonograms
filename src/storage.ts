import type { Puzzle, SaveData, SavedGame } from "./types";
const KEY = "casilla:progress:v1";
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}
export function loadProgress(
  puzzles: Puzzle[],
  storage: StorageLike,
): SaveData {
  const empty: SaveData = { version: 1, selectedId: puzzles[0].id, games: {} };
  try {
    const data = JSON.parse(storage.getItem(KEY) ?? "null");
    if (
      !data ||
      data.version !== 1 ||
      !data.games ||
      typeof data.games !== "object"
    )
      return empty;
    const games: Record<string, SavedGame> = {};
    for (const p of puzzles) {
      const g = data.games[p.id];
      if (
        !g ||
        !Array.isArray(g.cells) ||
        g.cells.length !== p.width * p.height ||
        !g.cells.every((c: unknown) => c === 0 || c === 1 || c === 2)
      )
        continue;
      games[p.id] = {
        cells: g.cells,
        elapsed: Number.isFinite(g.elapsed) && g.elapsed >= 0 ? g.elapsed : 0,
        crossedClues: Array.isArray(g.crossedClues)
          ? g.crossedClues.filter((v: unknown) => typeof v === "string")
          : [],
      };
    }
    return {
      version: 1,
      selectedId: puzzles.some((p) => p.id === data.selectedId)
        ? data.selectedId
        : puzzles[0].id,
      games,
    };
  } catch {
    return empty;
  }
}
export function saveProgress(data: SaveData, storage: StorageLike): boolean {
  try {
    storage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
