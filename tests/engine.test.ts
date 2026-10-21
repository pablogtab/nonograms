import { describe, expect, it } from "vitest";
import { autoCrossCompletedLines, projectStroke } from "../src/engine";
import {
  cluesFor,
  commitCells,
  createGame,
  errorsFor,
  isSolved,
  puzzleClues,
  redo,
  undo,
} from "../src/engine";
import type { Puzzle } from "../src/types";
const p: Puzzle = {
  id: "tiny",
  title: "Tiny",
  width: 3,
  height: 2,
  solution: [1, 1, 0, 0, 1, 0],
  collection: "Test",
};
describe("nonogram rules", () => {
  it("computes separated runs, trailing runs and empty clues", () => {
    expect(cluesFor([0, 1, 1, 0, 1])).toEqual([2, 1]);
    expect(cluesFor([0, 0])).toEqual([0]);
    expect(cluesFor([1, 1, 1])).toEqual([3]);
    expect(puzzleClues(p)).toEqual({
      rows: [[2], [1]],
      columns: [[1], [2], [0]],
    });
  });
  it("accepts victory without crosses but rejects missing and excess paint", () => {
    expect(isSolved(p, [1, 1, 0, 0, 1, 2])).toBe(true);
    expect(isSolved(p, [1, 0, 0, 0, 1, 0])).toBe(false);
    expect(isSolved(p, [1, 1, 1, 0, 1, 0])).toBe(false);
    expect(isSolved(p, [])).toBe(false);
  });
  it("only flags committed incorrect marks, including incorrect crosses", () => {
    expect(errorsFor(p, [2, 0, 1, 2, 1, 0])).toEqual([0, 2]);
  });
  it("undoes and redoes a complete stroke as one move without mutation", () => {
    const original = createGame(p);
    const changed = commitCells(original, [1, 1, 1, 0, 0, 0]);
    expect(changed.past).toHaveLength(1);
    expect(original.cells).toEqual([0, 0, 0, 0, 0, 0]);
    expect(undo(changed).cells).toEqual(original.cells);
    expect(redo(undo(changed)).cells).toEqual(changed.cells);
    expect(redo(undo(changed)).future).toHaveLength(0);
  });
  it("clears redo on a new move and ignores no-op strokes", () => {
    const g = createGame(p);
    expect(commitCells(g, g.cells.slice())).toBe(g);
    const back = undo(commitCells(g, [1, 0, 0, 0, 0, 0]));
    expect(commitCells(back, [0, 1, 0, 0, 0, 0]).future).toEqual([]);
    expect(undo(g)).toBe(g);
    expect(redo(g)).toBe(g);
  });
  it("cleaning errors can be undone without losing correct marks", () => {
    const g = createGame(p);
    const marked = commitCells(g, [1, 2, 1, 0, 1, 2]);
    const next = marked.cells.slice();
    errorsFor(p, next).forEach((i) => {
      next[i] = 0;
    });
    const clean = commitCells(marked, next);
    expect(clean.cells).toEqual([1, 0, 0, 0, 1, 2]);
    expect(undo(clean).cells).toEqual(marked.cells);
  });
});

describe("straight drag strokes", () => {
  it("does not select a direction until the pointer leaves the starting cell", () => {
    expect(projectStroke(102, 102, 50, null)).toEqual({
      index: 102,
      axis: null,
    });
  });
  it("locks horizontal strokes to their original row despite vertical drift", () => {
    const first = projectStroke(102, 103, 50, null);
    expect(first).toEqual({ index: 103, axis: "row" });
    expect(projectStroke(102, 309, 50, first.axis)).toEqual({
      index: 109,
      axis: "row",
    });
    expect(projectStroke(102, 51, 50, first.axis)).toEqual({
      index: 101,
      axis: "row",
    });
  });
  it("locks vertical strokes to their original column despite horizontal drift", () => {
    const first = projectStroke(102, 152, 50, null);
    expect(first).toEqual({ index: 152, axis: "column" });
    expect(projectStroke(102, 349, 50, first.axis)).toEqual({
      index: 302,
      axis: "column",
    });
    expect(projectStroke(102, 0, 50, first.axis)).toEqual({
      index: 2,
      axis: "column",
    });
  });
  it("chooses the dominant direction when an event skips multiple cells", () => {
    expect(projectStroke(102, 208, 50, null)).toEqual({
      index: 108,
      axis: "row",
    });
    expect(projectStroke(102, 353, 50, null)).toEqual({
      index: 352,
      axis: "column",
    });
  });
});

describe("automatic crosses on completed lines", () => {
  it("fills the remaining spaces of a completed row and column", () => {
    const before = createGame(p).cells;
    const result = autoCrossCompletedLines(p, before, [1, 1, 0, 0, 0, 0]);
    expect(result.cells).toEqual([1, 1, 2, 2, 0, 0]);
    expect(result.completion).toEqual({
      crossed: [2, 3],
      rows: [0],
      columns: [0],
    });
    expect(before).toEqual([0, 0, 0, 0, 0, 0]);
  });
  it("recognizes completed vertical groups without crossing incomplete rows", () => {
    const result = autoCrossCompletedLines(
      p,
      createGame(p).cells,
      [0, 1, 0, 0, 1, 0],
    );
    expect(result.cells).toEqual([0, 1, 0, 2, 1, 2]);
    expect(result.completion.columns).toEqual([1]);
  });
  it("does not mark unfinished lines or refill manually erased crosses", () => {
    const unfinished = autoCrossCompletedLines(
      p,
      createGame(p).cells,
      [0, 1, 0, 0, 0, 0],
    );
    expect(unfinished.cells).toEqual([0, 1, 0, 0, 0, 0]);
    const erased = autoCrossCompletedLines(
      p,
      [1, 1, 2, 2, 0, 0],
      [1, 1, 0, 2, 0, 0],
    );
    expect(erased.cells[2]).toBe(0);
    expect(erased.completion.crossed).toEqual([]);
  });
  it("uses clue groups rather than revealing hidden solution positions", () => {
    const result = autoCrossCompletedLines(
      p,
      createGame(p).cells,
      [0, 1, 1, 0, 0, 0],
    );
    expect(result.cells[0]).toBe(2);
    expect(result.completion.rows).toEqual([0]);
  });
  it("does not overwrite existing crosses and groups automatic changes into one undo", () => {
    const initial = createGame(p);
    const result = autoCrossCompletedLines(
      p,
      initial.cells,
      [1, 1, 2, 0, 0, 0],
    );
    expect(result.completion.crossed).toEqual([3]);
    const moved = commitCells(initial, result.cells);
    expect(moved.past).toHaveLength(1);
    expect(undo(moved).cells).toEqual(initial.cells);
    expect(redo(undo(moved)).cells).toEqual(result.cells);
  });
});
