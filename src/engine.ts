import type { Cell, Game, Move, Puzzle, SavedGame } from "./types";
export function cluesFor(line: readonly number[]): number[] {
  const clues: number[] = [];
  let run = 0;
  for (const v of line) {
    if (v === 1) run++;
    else if (run) {
      clues.push(run);
      run = 0;
    }
  }
  if (run) clues.push(run);
  return clues.length ? clues : [0];
}
export function puzzleClues(p: Puzzle) {
  return {
    rows: Array.from({ length: p.height }, (_, r) =>
      cluesFor(p.solution.slice(r * p.width, (r + 1) * p.width)),
    ),
    columns: Array.from({ length: p.width }, (_, c) =>
      cluesFor(
        Array.from({ length: p.height }, (_, r) => p.solution[r * p.width + c]),
      ),
    ),
  };
}
export function isSolved(p: Puzzle, cells: readonly Cell[]): boolean {
  return (
    cells.length === p.solution.length &&
    p.solution.every((v, i) => (v ? cells[i] === 1 : cells[i] !== 1))
  );
}
export function errorsFor(p: Puzzle, cells: readonly Cell[]): number[] {
  return cells.flatMap((v, i) =>
    (v === 1 && p.solution[i] === 0) || (v === 2 && p.solution[i] === 1)
      ? [i]
      : [],
  );
}
export function createGame(p: Puzzle, saved?: SavedGame): Game {
  return {
    cells: saved?.cells.slice() ?? Array<Cell>(p.width * p.height).fill(0),
    elapsed: saved?.elapsed ?? 0,
    crossedClues: saved?.crossedClues.slice() ?? [],
    past: [],
    future: [],
  };
}
export function commitCells(game: Game, next: Cell[]): Game {
  const indices = next.flatMap((v, i) => (v !== game.cells[i] ? [i] : []));
  if (!indices.length) return game;
  const move: Move = {
    indices,
    before: indices.map((i) => game.cells[i]),
    after: indices.map((i) => next[i]),
  };
  return {
    ...game,
    cells: next,
    past: [...game.past, move].slice(-300),
    future: [],
  };
}
export function undo(game: Game): Game {
  const move = game.past.at(-1);
  if (!move) return game;
  const cells = game.cells.slice();
  move.indices.forEach((i, k) => {
    cells[i] = move.before[k];
  });
  return {
    ...game,
    cells,
    past: game.past.slice(0, -1),
    future: [...game.future, move],
  };
}
export function redo(game: Game): Game {
  const move = game.future.at(-1);
  if (!move) return game;
  const cells = game.cells.slice();
  move.indices.forEach((i, k) => {
    cells[i] = move.after[k];
  });
  return {
    ...game,
    cells,
    past: [...game.past, move],
    future: game.future.slice(0, -1),
  };
}
export function formatTime(seconds: number) {
  const s = Math.floor(seconds);
  return `${Math.floor(s / 60)
    .toString()
    .padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
}

export type StrokeAxis = "row" | "column" | null;
/** The first movement selects an axis; later movement is projected onto that line. */
export function projectStroke(
  start: number,
  pointer: number,
  width: number,
  axis: StrokeAxis,
): { index: number; axis: StrokeAxis } {
  const startRow = Math.floor(start / width),
    startColumn = start % width;
  const pointerRow = Math.floor(pointer / width),
    pointerColumn = pointer % width;
  if (axis === null && pointer !== start) {
    axis =
      Math.abs(pointerColumn - startColumn) >= Math.abs(pointerRow - startRow)
        ? "row"
        : "column";
  }
  return {
    axis,
    index:
      axis === "row"
        ? startRow * width + pointerColumn
        : axis === "column"
          ? pointerRow * width + startColumn
          : start,
  };
}

export interface LineCompletion {
  crossed: number[];
  rows: number[];
  columns: number[];
}
/** Complete only lines touched by new paint, using their public clues, never hidden positions. */
export function autoCrossCompletedLines(
  p: Puzzle,
  before: readonly Cell[],
  marked: Cell[],
): { cells: Cell[]; completion: LineCompletion } {
  const candidates = { rows: new Set<number>(), columns: new Set<number>() };
  marked.forEach((cell, i) => {
    if (cell === 1 && before[i] !== 1) {
      candidates.rows.add(Math.floor(i / p.width));
      candidates.columns.add(i % p.width);
    }
  });
  const clues = puzzleClues(p),
    cells = marked.slice();
  const completion: LineCompletion = { crossed: [], rows: [], columns: [] };
  for (const axis of ["rows", "columns"] as const) {
    for (const line of candidates[axis]) {
      const indices = Array.from(
        { length: axis === "rows" ? p.width : p.height },
        (_, k) => (axis === "rows" ? line * p.width + k : k * p.width + line),
      );
      const actual = cluesFor(indices.map((i) => (cells[i] === 1 ? 1 : 0)));
      const expected = clues[axis][line];
      if (
        actual.length !== expected.length ||
        actual.some((n, k) => n !== expected[k])
      )
        continue;
      completion[axis].push(line);
      for (const i of indices) {
        if (cells[i] === 0) {
          cells[i] = 2;
          completion.crossed.push(i);
        }
      }
    }
  }
  return { cells, completion };
}
