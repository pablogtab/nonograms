import { expect, it } from "vitest";
import { catalog } from "../src/catalog";
import { artworkColors } from "../src/artwork";
import { parseRoute } from "../src/routes";
it("provides a color for every pixel of every catalog illustration", () => {
  for (const puzzle of catalog) {
    const colors = artworkColors(puzzle);
    expect(colors).toHaveLength(puzzle.width * puzzle.height);
    expect(colors.every((color) => /^#[0-9a-f]{6}$/i.test(color))).toBe(true);
    expect(new Set(colors).size).toBeGreaterThanOrEqual(3);
  }
});
it("preserves supplied original image pixels and supports monochrome puzzles", () => {
  const p = { ...catalog[0], colors: undefined };
  expect(artworkColors(p)[0]).toBe("#f5f7ef");
  const originals = Array(p.solution.length).fill("#123456");
  expect(artworkColors({ ...p, colors: originals })).toBe(originals);
  expect(artworkColors({ ...p, colors: ["#000000"] })).toHaveLength(
    p.solution.length,
  );
});
it("resolves catalog and direct puzzle links without accepting unknown puzzles", () => {
  const ids = catalog.map((p) => p.id);
  expect(parseRoute("", ids)).toEqual({ page: "catalog" });
  expect(parseRoute("#/catalogo", ids)).toEqual({ page: "catalog" });
  expect(parseRoute("#/jugar/latido", ids)).toEqual({
    page: "game",
    puzzleId: "latido",
  });
  expect(parseRoute("#/jugar/missing", ids)).toEqual({ page: "catalog" });
  expect(parseRoute("#/jugar/latido/extra", ids)).toEqual({ page: "catalog" });
});
