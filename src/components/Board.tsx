import { Artwork, VICTORY_SWEEP_MS } from "./Artwork";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent, PointerEvent } from "react";
import { projectStroke, puzzleClues } from "../engine";
import type { LineCompletion, StrokeAxis } from "../engine";
import type { Cell, Puzzle, Tool } from "../types";

interface Props {
  puzzle: Puzzle;
  cells: Cell[];
  tool: Tool;
  cellSize: number;
  errors: number[];
  completion: LineCompletion | null;
  crossedClues: string[];
  disabled: boolean;
  artwork: "hidden" | "sweep" | "shown";
  onCommit(cells: Cell[]): void;
  onClue(key: string): void;
  onUndo(): void;
  onRedo(): void;
  onActivity(): void;
}
interface Stroke {
  origin: number;
  axis: StrokeAxis;
  next: Cell[];
  value: Cell;
  last: number;
}
export const Board = memo(function Board({
  puzzle: p,
  cells,
  tool,
  cellSize,
  errors,
  completion,
  crossedClues,
  disabled,
  artwork,
  onCommit,
  onClue,
  onUndo,
  onRedo,
  onActivity,
}: Props) {
  const clues = useMemo(() => puzzleClues(p), [p]);
  const [active, setActive] = useState(0),
    [hovered, setHovered] = useState(-1),
    [draft, setDraft] = useState<Cell[] | null>(null);
  const stroke = useRef<Stroke | null>(null);
  const pan = useRef<{
    x: number;
    y: number;
    left: number;
    top: number;
  } | null>(null);
  const viewport = useRef<HTMLDivElement>(null),
    grid = useRef<HTMLDivElement>(null);
  const errorSet = useMemo(() => new Set(errors), [errors]);
  const crossedSet = useMemo(() => new Set(crossedClues), [crossedClues]);
  const autoCrosses = useMemo(
    () =>
      new Map(completion?.crossed.map((index, order) => [index, order]) ?? []),
    [completion],
  );
  const maxRow = Math.max(...clues.rows.map((c) => c.length));
  const maxCol = Math.max(...clues.columns.map((c) => c.length));
  const rowWidth = Math.max(52, maxRow * 24 + 12),
    colHeight = Math.max(52, maxCol * 23 + 12);
  const focusIndex = hovered >= 0 ? hovered : active;
  const row = Math.floor(focusIndex / p.width),
    col = focusIndex % p.width;
  const displayed = draft ?? cells;
  const style = {
    "--cell": `${cellSize}px`,
    "--row-clues": `${rowWidth}px`,
    "--column-clues": `${colHeight}px`,
    "--cols": p.width,
    "--rows": p.height,
  } as CSSProperties;

  // Finish a stroke even if the pointer leaves the page or the browser cancels it.
  useEffect(() => {
    function finish() {
      const s = stroke.current;
      stroke.current = null;
      pan.current = null;
      if (s) {
        onCommit(s.next);
        setDraft(null);
      }
    }
    window.addEventListener("blur", finish);
    return () => {
      window.removeEventListener("blur", finish);
    };
  }, [onCommit]);

  function indexAt(event: PointerEvent): number {
    const visible = viewport.current!.getBoundingClientRect();
    if (
      event.clientX < visible.left + rowWidth + 1 ||
      event.clientY < visible.top + colHeight + 1 ||
      event.clientX >= visible.right - 1 ||
      event.clientY >= visible.bottom - 1
    )
      return -1;
    const rect = grid.current!.getBoundingClientRect();
    const c = Math.floor((event.clientX - rect.left) / cellSize),
      r = Math.floor((event.clientY - rect.top) / cellSize);
    return c >= 0 && c < p.width && r >= 0 && r < p.height
      ? r * p.width + c
      : -1;
  }
  function applyTo(index: number) {
    const s = stroke.current;
    if (!s || index < 0) return;
    const projected = projectStroke(s.origin, index, p.width, s.axis);
    s.axis = projected.axis;
    index = projected.index;
    const r0 = Math.floor(s.last / p.width),
      c0 = s.last % p.width,
      r1 = Math.floor(index / p.width),
      c1 = index % p.width;
    // Interpolate skipped cells when the pointer moves faster than browser events.
    const steps = Math.max(Math.abs(r1 - r0), Math.abs(c1 - c0));
    for (let k = 0; k <= steps; k++) {
      const r = steps ? Math.round(r0 + ((r1 - r0) * k) / steps) : r1;
      const c = steps ? Math.round(c0 + ((c1 - c0) * k) / steps) : c1;
      s.next[r * p.width + c] = s.value;
    }
    s.last = index;
    setActive(index);
    setHovered(index);
    setDraft(s.next.slice());
  }
  function start(event: PointerEvent<HTMLDivElement>) {
    if (![0, 1, 2].includes(event.button)) return;
    const target = event.target as HTMLElement;
    if (target.closest(".clue, .board-corner")) return;
    if (tool === "pan" || event.button === 1) {
      event.preventDefault();
      pan.current = {
        x: event.clientX,
        y: event.clientY,
        left: viewport.current!.scrollLeft,
        top: viewport.current!.scrollTop,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }
    if (disabled) return;
    const index = indexAt(event);
    if (index < 0) return;
    event.preventDefault();
    onActivity();
    grid.current?.focus({ preventScroll: true });
    const requested: Cell =
      event.button === 2 || tool === "cross" ? 2 : tool === "erase" ? 0 : 1;
    const value: Cell =
      requested !== 0 && cells[index] === requested ? 0 : requested;
    stroke.current = {
      origin: index,
      axis: null,
      next: cells.slice(),
      value,
      last: index,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    applyTo(index);
  }
  function move(event: PointerEvent<HTMLDivElement>) {
    if (pan.current) {
      viewport.current!.scrollLeft =
        pan.current.left - (event.clientX - pan.current.x);
      viewport.current!.scrollTop =
        pan.current.top - (event.clientY - pan.current.y);
      return;
    }
    const index = indexAt(event);
    if (stroke.current) applyTo(index);
    else setHovered(index);
  }
  function finish(event: PointerEvent<HTMLDivElement>) {
    if (stroke.current) {
      const next = stroke.current.next;
      stroke.current = null;
      onCommit(next);
      setDraft(null);
    }
    pan.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function reveal(index: number) {
    const v = viewport.current!;
    const c = index % p.width,
      r = Math.floor(index / p.width);
    const left = rowWidth + c * cellSize,
      top = colHeight + r * cellSize;
    if (left < v.scrollLeft + rowWidth) v.scrollLeft = left - rowWidth;
    if (left + cellSize > v.scrollLeft + v.clientWidth)
      v.scrollLeft = left + cellSize - v.clientWidth;
    if (top < v.scrollTop + colHeight) v.scrollTop = top - colHeight;
    if (top + cellSize > v.scrollTop + v.clientHeight)
      v.scrollTop = top + cellSize - v.clientHeight;
  }
  function keyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (
      (event.ctrlKey || event.metaKey) &&
      ["z", "y"].includes(event.key.toLowerCase())
    ) {
      event.preventDefault();
      if (stroke.current) return;
      if (event.shiftKey || event.key.toLowerCase() === "y") onRedo();
      else onUndo();
      return;
    }
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    let next = active;
    switch (event.key) {
      case "ArrowLeft":
        next = active % p.width ? active - 1 : active;
        break;
      case "ArrowRight":
        next = active % p.width < p.width - 1 ? active + 1 : active;
        break;
      case "ArrowUp":
        next = Math.max(0, active - p.width);
        break;
      case "ArrowDown":
        next = Math.min(cells.length - 1, active + p.width);
        break;
      case " ":
      case "x":
      case "X":
      case "Delete":
      case "Backspace": {
        event.preventDefault();
        if (disabled || stroke.current) return;
        const value: Cell =
          event.key === " " ? 1 : event.key.toLowerCase() === "x" ? 2 : 0;
        const updated = cells.slice();
        updated[active] = updated[active] === value ? 0 : value;
        onActivity();
        onCommit(updated);
        return;
      }
      default:
        return;
    }
    event.preventDefault();
    setActive(next);
    setHovered(-1);
    reveal(next);
  }
  const clueButton = (value: number, key: string, label: string) => (
    <button
      key={key}
      className={`clue ${crossedSet.has(key) ? "struck" : ""}`}
      aria-label={label}
      aria-pressed={crossedSet.has(key)}
      onClick={() => onClue(key)}
      title="Tachar pista"
    >
      {value}
    </button>
  );
  return (
    <div
      className={`board-viewport ${tool === "pan" ? "is-panning" : ""}`}
      ref={viewport}
      style={style}
      onPointerDown={start}
      onPointerMove={move}
      onPointerUp={finish}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
      onPointerLeave={() => {
        if (!stroke.current) setHovered(-1);
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="board-layout">
        <div className="board-corner">
          <span>
            {p.width} × {p.height}
          </span>
          <small>
            F{row + 1} · C{col + 1}
          </small>
        </div>
        <div className="column-clues">
          {clues.columns.map((values, c) => (
            <div
              key={c}
              className={`column-clue ${completion?.columns.includes(c) ? "line-completed" : ""} ${(c + 1) % 5 === 0 ? "major-right" : ""}`}
            >
              {values.map((v, k) =>
                clueButton(
                  v,
                  `c:${c}:${k}`,
                  `Columna ${c + 1}, pista ${k + 1}: ${v}`,
                ),
              )}
            </div>
          ))}
        </div>
        <div className="row-clues">
          {clues.rows.map((values, r) => (
            <div
              key={r}
              className={`row-clue ${completion?.rows.includes(r) ? "line-completed" : ""} ${(r + 1) % 5 === 0 ? "major-bottom" : ""}`}
            >
              {values.map((v, k) =>
                clueButton(
                  v,
                  `r:${r}:${k}`,
                  `Fila ${r + 1}, pista ${k + 1}: ${v}`,
                ),
              )}
            </div>
          ))}
        </div>
        <div
          className="pixel-grid"
          role="grid"
          aria-label={`Nonograma ${p.width} por ${p.height}`}
          aria-rowcount={p.height}
          aria-colcount={p.width}
          aria-activedescendant={`cell-${active}`}
          aria-describedby="board-instructions"
          tabIndex={0}
          ref={grid}
          onKeyDown={keyDown}
        >
          {Array.from({ length: p.height }, (_, r) => (
            <div role="row" className="pixel-row" key={r}>
              {Array.from({ length: p.width }, (_, c) => {
                const i = r * p.width + c,
                  value = displayed[i];
                return (
                  <div
                    key={i}
                    id={`cell-${i}`}
                    role="gridcell"
                    aria-rowindex={r + 1}
                    aria-colindex={c + 1}
                    aria-label={`Fila ${r + 1}, columna ${c + 1}: ${value === 1 ? "pintada" : value === 2 ? "cruz" : "vacía"}`}
                    aria-selected={active === i}
                    style={
                      autoCrosses.has(i)
                        ? ({
                            "--reveal-delay": `${Math.min(autoCrosses.get(i)! * 12, 360)}ms`,
                          } as CSSProperties)
                        : undefined
                    }
                    className={`pixel ${autoCrosses.has(i) ? "auto-cross" : ""} ${completion?.rows.includes(r) || completion?.columns.includes(c) ? "line-completed" : ""} ${value === 1 ? "filled" : value === 2 ? "crossed" : ""} ${errorSet.has(i) ? "error" : ""} ${(c + 1) % 5 === 0 ? "major-right" : ""} ${(r + 1) % 5 === 0 ? "major-bottom" : ""}`}
                  >
                    {value === 2 && <span aria-hidden="true">×</span>}
                  </div>
                );
              })}
            </div>
          ))}
          {artwork !== "hidden" && (
            <div
              className={`artwork-reveal ${artwork === "sweep" ? "is-sweeping" : ""}`}
              style={
                { "--sweep-duration": `${VICTORY_SWEEP_MS}ms` } as CSSProperties
              }
              aria-hidden="true"
            >
              <Artwork puzzle={p} decorative />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
