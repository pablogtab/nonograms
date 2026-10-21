import { expect, it } from "vitest";
import { catalog } from "../src/catalog";
import { loadProgress, saveProgress } from "../src/storage";
import { createGame } from "../src/engine";
import type { SaveData } from "../src/types";
function store(initial: string | null = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => {
      value = next;
    },
  };
}
it("round-trips selection, marks, time and crossed clues", () => {
  const p = catalog[6],
    cells = createGame(p).cells;
  cells[2] = 1;
  cells[3] = 2;
  const data: SaveData = {
    version: 1,
    selectedId: p.id,
    games: { [p.id]: { cells, elapsed: 72, crossedClues: ["r:0:0"] } },
  };
  const storage = store();
  expect(saveProgress(data, storage)).toBe(true);
  expect(loadProgress(catalog, storage)).toEqual(data);
  const resumed = createGame(p, loadProgress(catalog, storage).games[p.id]);
  expect(resumed.elapsed).toBe(72);
  expect(resumed.past).toEqual([]);
  expect(resumed.cells[3]).toBe(2);
});
it("ignores corrupted JSON, unknown versions and malformed boards", () => {
  for (const value of [
    "{",
    "null",
    '{"version":2,"games":{}}',
    '{"version":1,"games":{"primer-brote":{"cells":[8]}}}',
  ]) {
    const loaded = loadProgress(catalog, store(value));
    expect(loaded.games).toEqual({});
    expect(loaded.selectedId).toBe(catalog[0].id);
  }
});
it("normalizes invalid times and clue records", () => {
  const p = catalog[0],
    storage = store(
      JSON.stringify({
        version: 1,
        selectedId: "missing",
        games: {
          [p.id]: {
            cells: createGame(p).cells,
            elapsed: -5,
            crossedClues: [2, "r:0:0"],
          },
        },
      }),
    );
  const result = loadProgress(catalog, storage);
  expect(result.selectedId).toBe(p.id);
  expect(result.games[p.id].elapsed).toBe(0);
  expect(result.games[p.id].crossedClues).toEqual(["r:0:0"]);
});
it("handles unavailable and full storage", () => {
  const storage = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("quota");
    },
  };
  const data = loadProgress(catalog, storage);
  expect(data.games).toEqual({});
  expect(saveProgress(data, storage)).toBe(false);
});
