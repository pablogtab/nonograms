import type { Puzzle } from "./types";
import { colorizePuzzle } from "./artwork";
// Source silhouettes are binary pixel art. Scaling preserves the future image-converter contract.
function art(
  id: string,
  title: string,
  rows: string[],
  size: number,
  collection: string,
): Puzzle {
  const h = rows.length,
    w = rows[0].length;
  return {
    id,
    title,
    width: size,
    height: size,
    collection,
    solution: Array.from({ length: size * size }, (_, i) =>
      rows[Math.floor((Math.floor(i / size) * h) / size)][
        Math.floor(((i % size) * w) / size)
      ] === "#"
        ? 1
        : 0,
    ),
  };
}
function landscape(
  id: string,
  title: string,
  filled: (x: number, y: number) => boolean,
): Puzzle {
  return {
    id,
    title,
    width: 50,
    height: 50,
    collection: "Grandes desafíos",
    solution: Array.from({ length: 2500 }, (_, i) =>
      filled(i % 50, Math.floor(i / 50)) ? 1 : 0,
    ),
  };
}
const definitions: Puzzle[] = [
  art(
    "primer-brote",
    "Primer brote",
    [
      "..........",
      "..##..##..",
      ".###..###.",
      "..######..",
      "....##....",
      "....##....",
      "....##....",
      "...####...",
      "..######..",
      "..........",
    ],
    10,
    "Pequeños comienzos",
  ),
  art(
    "latido",
    "Latido",
    [
      "..........",
      "..##..##..",
      ".########.",
      ".########.",
      ".########.",
      "..######..",
      "...####...",
      "....##....",
      "..........",
      "..........",
    ],
    10,
    "Pequeños comienzos",
  ),
  art(
    "cristal",
    "Cristal",
    [
      ".....#.....",
      "....###....",
      "...#####...",
      "..#######..",
      ".#########.",
      "###########",
      ".#########.",
      "..#######..",
      "...#####...",
      "....###....",
      ".....#.....",
    ],
    15,
    "Formas en calma",
  ),
  art(
    "a-la-deriva",
    "A la deriva",
    [
      ".....#....",
      "....##....",
      "...###....",
      "..####....",
      ".#####....",
      ".....####.",
      ".....###..",
      "##########",
      ".########.",
      "..######..",
    ],
    20,
    "Formas en calma",
  ),
  art(
    "bajo-el-bosque",
    "Bajo el bosque",
    [
      "...####...",
      "..######..",
      ".########.",
      "##########",
      "##########",
      "....##....",
      "....##....",
      "....##....",
      "..######..",
      "..........",
    ],
    25,
    "Formas en calma",
  ),
  art(
    "rumbo-norte",
    "Rumbo norte",
    [
      "....##....",
      "...####...",
      "...####...",
      "..######..",
      "..######..",
      "..######..",
      ".########.",
      ".########.",
      "...####...",
      "....##....",
    ],
    30,
    "Un poco más lejos",
  ),
  landscape("el-observatorio", "El observatorio", (x, y) => {
    let filled =
      y >= 3 && y <= 23 && (x - 24.5) ** 2 + (y - 23) ** 2 <= 21 ** 2;
    if (y >= 24 && y <= 44 && x >= 8 && x <= 41) filled = true;
    if (y >= 45 && y <= 48 && x >= 3 && x <= 46) filled = true;
    if (y <= 3 && x >= 23 && x <= 26) filled = true;
    if (y >= 7 && y <= 19 && x >= 23 && x <= 26) filled = false;
    if (y >= 28 && y <= 34 && ((x >= 13 && x <= 17) || (x >= 32 && x <= 36)))
      filled = false;
    if (y >= 38 && y <= 44 && x >= 22 && x <= 27) filled = false;
    return filled;
  }),
  landscape("la-fortaleza", "La fortaleza", (x, y) => {
    let filled = y >= 17 && y <= 47 && x >= 5 && x <= 44;
    if (y >= 7 && y <= 47 && ((x >= 3 && x <= 14) || (x >= 35 && x <= 46)))
      filled = true;
    if (
      y >= 2 &&
      y <= 6 &&
      ((x >= 3 && x <= 6) ||
        (x >= 11 && x <= 14) ||
        (x >= 35 && x <= 38) ||
        (x >= 43 && x <= 46))
    )
      filled = true;
    if (y >= 12 && y <= 16 && ((x >= 17 && x <= 21) || (x >= 28 && x <= 32)))
      filled = true;
    if (y >= 48 && x >= 1 && x <= 48) filled = true;
    if (y >= 16 && y <= 21 && ((x >= 7 && x <= 10) || (x >= 39 && x <= 42)))
      filled = false;
    if (y >= 29 && y <= 34 && ((x >= 9 && x <= 12) || (x >= 37 && x <= 40)))
      filled = false;
    if (y >= 35 && y <= 47 && x >= 21 && x <= 28) filled = false;
    if (y >= 31 && y <= 34 && x >= 23 && x <= 26) filled = false;
    return filled;
  }),
];

export const catalog: Puzzle[] = definitions.map(colorizePuzzle);
