import { useMemo } from "react";
import { artworkColors } from "../artwork";
import type { Puzzle } from "../types";

export const VICTORY_SWEEP_MS = 1500;

export function Artwork({
  puzzle,
  decorative = false,
}: {
  puzzle: Puzzle;
  decorative?: boolean;
}) {
  // Merge equal adjacent pixels into strips. This keeps 50×50 previews lightweight.
  const strips = useMemo(() => {
    const colors = artworkColors(puzzle);
    const result: { x: number; y: number; width: number; color: string }[] = [];
    for (let y = 0; y < puzzle.height; y++) {
      let x = 0;
      while (x < puzzle.width) {
        const start = x,
          color = colors[y * puzzle.width + x];
        while (x < puzzle.width && colors[y * puzzle.width + x] === color) x++;
        result.push({ x: start, y, width: x - start, color });
      }
    }
    return result;
  }, [puzzle]);
  return (
    <svg
      className="artwork"
      viewBox={`0 0 ${puzzle.width} ${puzzle.height}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={
        decorative ? undefined : `Ilustración a color: ${puzzle.title}`
      }
    >
      {strips.map((strip, i) => (
        <rect
          key={i}
          x={strip.x}
          y={strip.y}
          width={strip.width}
          height={1}
          fill={strip.color}
        />
      ))}
    </svg>
  );
}
