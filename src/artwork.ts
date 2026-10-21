import type { Puzzle } from "./types";

// Hand-authored palettes for the existing binary drawings. An image importer can
// supply its original pixels through Puzzle.colors without changing the game.
export function colorizePuzzle(puzzle: Puzzle): Puzzle {
  const colors = puzzle.solution.map((filled, i) => {
    const x = (i % puzzle.width) / puzzle.width;
    const y = Math.floor(i / puzzle.width) / puzzle.height;
    switch (puzzle.id) {
      case "primer-brote":
        if (!filled) return "#f1f5df";
        return y > 0.68
          ? y > 0.78
            ? "#a46b46"
            : "#c28a58"
          : x < 0.5
            ? "#3e8b61"
            : "#70ad67";
      case "latido":
        if (!filled) return "#fff0e8";
        return x + y < 0.72 ? "#f2958b" : x > 0.6 ? "#ba4861" : "#df6474";
      case "cristal":
        if (!filled) return "#eeeaf7";
        return x < 0.5
          ? y < 0.5
            ? "#9ac8db"
            : "#4d819f"
          : y < 0.5
            ? "#79a7cc"
            : "#666d9f";
      case "a-la-deriva":
        if (!filled) return "#e7f1ed";
        return y < 0.5
          ? x < 0.35
            ? "#e9ad62"
            : "#f5ca7e"
          : y < 0.7
            ? "#7ca7a5"
            : y < 0.8
              ? "#bf7851"
              : "#8e573e";
      case "bajo-el-bosque":
        if (!filled) return "#f0f1df";
        return y < 0.5
          ? (Math.floor(x * 10) + Math.floor(y * 10)) % 4 === 0
            ? "#f3d5a1"
            : x < 0.5
              ? "#c36943"
              : "#a74e3d"
          : y < 0.8
            ? "#dfc190"
            : "#9c8050";
      case "rumbo-norte":
        if (!filled) return "#e7edf1";
        return y > 0.8
          ? "#d99050"
          : y < 0.2
            ? "#b85550"
            : x < 0.3 || x > 0.7
              ? "#b85550"
              : x < 0.5
                ? "#efe3c7"
                : "#d3ccb5";
      case "el-observatorio":
        if (!filled) return "#f2eddf";
        return y < 0.48
          ? x < 0.5
            ? "#558f9a"
            : "#376b80"
          : y > 0.88
            ? "#ac8052"
            : y > 0.64
              ? "#c1a36e"
              : "#ddc694";
      case "la-fortaleza":
        if (!filled) return "#edf1df";
        return y < 0.15
          ? "#ac715d"
          : y > 0.94
            ? "#7d8c70"
            : Math.floor(y * 50) % 6 === 0
              ? "#a6ad91"
              : x < 0.3
                ? "#c3c7a6"
                : x > 0.7
                  ? "#aab69a"
                  : "#d4d2b0";
      default:
        return filled ? "#367d73" : "#f5f7ef";
    }
  });
  return { ...puzzle, colors };
}

export function artworkColors(puzzle: Puzzle): string[] {
  if (puzzle.colors?.length === puzzle.solution.length) return puzzle.colors;
  return puzzle.solution.map((filled) => (filled ? "#367d73" : "#f5f7ef"));
}
