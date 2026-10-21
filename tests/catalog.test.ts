import { expect, it } from "vitest";
import { catalog } from "../src/catalog";
import { countSolutions } from "../scripts/solver";
import type { Puzzle } from "../src/types";
it("has eight correctly sized binary puzzles with stable unique IDs", () => {
  expect(catalog).toHaveLength(8);
  expect(new Set(catalog.map((p) => p.id)).size).toBe(8);
  expect(catalog.map((p) => p.width)).toEqual([10, 10, 15, 20, 25, 30, 50, 50]);
  for (const p of catalog) {
    expect(p.solution).toHaveLength(p.width * p.height);
    expect(p.solution.every((v) => v === 0 || v === 1)).toBe(true);
  }
});
it("verifies exactly one solution for every catalog puzzle", () => {
  for (const p of catalog) expect(countSolutions(p).count, p.id).toBe(1);
});
it("solver rejects uniqueness for ambiguous clues", () => {
  const ambiguous: Puzzle = {
    id: "ambiguous",
    title: "",
    width: 2,
    height: 2,
    collection: "",
    solution: [1, 0, 0, 1],
  };
  expect(countSolutions(ambiguous).count).toBe(2);
});
it("solver agrees with brute-force solution counts on all 3×3 clue sets", () => {
  const seen = new Map<string, { solution: (0 | 1)[]; count: number }>();
  function runs(line: number[]) {
    return line
      .join("")
      .split("0")
      .filter(Boolean)
      .map((s) => s.length)
      .join(",");
  }
  for (let mask = 0; mask < 512; mask++) {
    const solution = Array.from(
      { length: 9 },
      (_, i) => ((mask >> i) & 1) as 0 | 1,
    );
    const key = [
      ...Array.from({ length: 3 }, (_, r) =>
        runs(solution.slice(r * 3, r * 3 + 3)),
      ),
      ...Array.from({ length: 3 }, (_, c) =>
        runs([solution[c], solution[c + 3], solution[c + 6]]),
      ),
    ].join("|");
    const prior = seen.get(key);
    if (prior) prior.count++;
    else seen.set(key, { solution, count: 1 });
  }
  for (const { solution, count } of seen.values())
    expect(
      countSolutions({
        id: "brute",
        title: "",
        collection: "",
        width: 3,
        height: 3,
        solution,
      }).count,
    ).toBe(Math.min(count, 2));
});
