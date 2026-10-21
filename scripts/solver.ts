import { puzzleClues } from "../src/engine";
import type { Puzzle } from "../src/types";
// DP finds every possible filled/empty value without enumerating all line permutations.
function linePossibilities(
  line: number[],
  raw: number[],
): { any: bigint; all: bigint } | null {
  const runs = raw[0] === 0 ? [] : raw;
  const n = line.length;
  const ones = line.reduce(
    (mask, v, i) => (v === 1 ? mask | (1n << BigInt(i)) : mask),
    0n,
  );
  const zeros = line.reduce(
    (mask, v, i) => (v === 0 ? mask | (1n << BigInt(i)) : mask),
    0n,
  );
  const range = (start: number, end: number) =>
    ((1n << BigInt(end - start)) - 1n) << BigInt(start);
  const memo = new Map<string, { any: bigint; all: bigint } | null>();
  function walk(pos: number, k: number): { any: bigint; all: bigint } | null {
    if (k === runs.length)
      return ones & range(pos, n) ? null : { any: 0n, all: 0n };
    const key = `${pos}:${k}`;
    if (memo.has(key)) return memo.get(key)!;
    const remaining =
      runs.slice(k).reduce((a, b) => a + b, 0) + runs.length - k - 1;
    let any = 0n,
      all: bigint | null = null;
    for (let start = pos; start <= n - remaining; start++) {
      if (ones & range(pos, start)) break;
      const end = start + runs[k],
        mask = range(start, end);
      if (zeros & mask || (end < n && line[end] === 1)) continue;
      const tail = walk(end < n ? end + 1 : end, k + 1);
      if (!tail) continue;
      const candidateAny = mask | tail.any,
        candidateAll = mask | tail.all;
      any |= candidateAny;
      all = all === null ? candidateAll : all & candidateAll;
    }
    const result = all === null ? null : { any, all };
    memo.set(key, result);
    return result;
  }
  return walk(0, 0);
}
export function countSolutions(
  p: Puzzle,
  limit = 2,
  maxNodes = 20000,
): { count: number; nodes: number } {
  const clues = puzzleClues(p);
  let nodes = 0;
  function solve(cells: number[]): number {
    if (++nodes > maxNodes) throw new Error(`Solver budget exceeded: ${p.id}`);
    let changed = true;
    while (changed) {
      changed = false;
      for (const axis of ["rows", "columns"] as const) {
        for (let j = 0; j < clues[axis].length; j++) {
          const indices = Array.from(
            { length: axis === "rows" ? p.width : p.height },
            (_, k) => (axis === "rows" ? j * p.width + k : k * p.width + j),
          );
          const options = linePossibilities(
            indices.map((i) => cells[i]),
            clues[axis][j],
          );
          if (!options) return 0;
          for (let k = 0; k < indices.length; k++) {
            if (cells[indices[k]] !== -1) continue;
            const bit = 1n << BigInt(k);
            const value = options.all & bit ? 1 : !(options.any & bit) ? 0 : -1;
            if (value !== -1) {
              cells[indices[k]] = value;
              changed = true;
            }
          }
        }
      }
    }
    const index = cells.indexOf(-1);
    if (index < 0) return 1;
    let count = 0;
    for (const v of [0, 1]) {
      const next = cells.slice();
      next[index] = v;
      count += solve(next);
      if (count >= limit) return limit;
    }
    return count;
  }
  return { count: solve(Array(p.width * p.height).fill(-1)), nodes };
}
