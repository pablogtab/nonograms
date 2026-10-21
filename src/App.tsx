import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCheck,
  CircleHelp,
  Clock3,
  Eraser,
  Expand,
  Hand,
  Keyboard,
  Leaf,
  Minus,
  Pause,
  Play,
  Plus,
  Redo2,
  RotateCcw,
  ShieldCheck,
  Square,
  Undo2,
  X,
} from "lucide-react";
import { catalog } from "./catalog";
import {
  autoCrossCompletedLines,
  commitCells,
  createGame,
  errorsFor,
  formatTime,
  isSolved,
  puzzleClues,
  redo,
  undo,
} from "./engine";
import type { LineCompletion } from "./engine";
import { loadProgress, saveProgress } from "./storage";
import type { Cell, Game, SaveData, Tool } from "./types";
import { Board } from "./components/Board";
import { Artwork, VICTORY_SWEEP_MS } from "./components/Artwork";
import { Brand } from "./components/Brand";
import { Catalog } from "./components/Catalog";
import { parseRoute } from "./routes";
import { Modal } from "./components/Modal";

function initialData(): SaveData {
  try {
    return loadProgress(catalog, localStorage);
  } catch {
    return { version: 1, selectedId: catalog[0].id, games: {} };
  }
}
export default function App() {
  const [initial] = useState(initialData);
  const [route, setRoute] = useState(() =>
    parseRoute(
      window.location.hash,
      catalog.map((p) => p.id),
    ),
  );
  const [selectedId, setSelectedId] = useState(
    route.page === "game" ? route.puzzleId : initial.selectedId,
  );
  useEffect(() => {
    const updateRoute = () =>
      setRoute(
        parseRoute(
          window.location.hash,
          catalog.map((p) => p.id),
        ),
      );
    window.addEventListener("hashchange", updateRoute);
    return () => window.removeEventListener("hashchange", updateRoute);
  }, []);
  const [games, setGames] = useState<Record<string, Game>>(() =>
    Object.fromEntries(
      catalog.map((p) => [p.id, createGame(p, initial.games[p.id])]),
    ),
  );
  const puzzle = catalog.find((p) => p.id === selectedId)!;
  useEffect(() => {
    document.title =
      route.page === "catalog"
        ? "Catálogo · Casilla"
        : `${puzzle.title} · Casilla`;
  }, [route.page, puzzle.title]);
  const game = games[selectedId];
  const [tool, setTool] = useState<Tool>("fill");
  const [cellSize, setCellSize] = useState(puzzle.width <= 15 ? 32 : 22);
  const [errors, setErrors] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [completion, setCompletion] = useState<LineCompletion | null>(null);
  useEffect(() => {
    if (!completion) return;
    const timeout = window.setTimeout(() => setCompletion(null), 1100);
    return () => window.clearTimeout(timeout);
  }, [completion]);
  const [modal, setModal] = useState<"help" | "restart" | "victory" | null>(
    null,
  );
  const [paused, setPaused] = useState(false),
    [started, setStarted] = useState(false);
  const [saved, setSaved] = useState(true),
    [filter, setFilter] = useState("all");
  const stage = useRef<HTMLDivElement>(null);
  const solved = isSolved(puzzle, game.cells);
  const [reveal, setReveal] = useState<{
    id: string;
    phase: "hidden" | "sweep" | "shown";
  }>(() => ({ id: selectedId, phase: solved ? "shown" : "hidden" }));
  const previousResult = useRef({ id: selectedId, solved });
  useEffect(() => {
    if (route.page !== "game") return;
    setSelectedId(route.puzzleId);
    setPaused(false);
    setStarted(false);
    setCompletion(null);
    setErrors([]);
    setMessage("");
  }, [route]);
  useEffect(() => {
    const previous = previousResult.current;
    previousResult.current = { id: selectedId, solved };
    if (!solved || route.page !== "game") {
      setReveal({ id: selectedId, phase: solved ? "shown" : "hidden" });
      setModal((current) => (current === "victory" ? null : current));
      return;
    }
    if (previous.id !== selectedId || previous.solved) {
      setReveal({ id: selectedId, phase: "shown" });
      return;
    }
    setCompletion(null);
    setReveal({ id: selectedId, phase: "sweep" });
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const timeout = window.setTimeout(
      () => {
        setReveal({ id: selectedId, phase: "shown" });
        setModal("victory");
      },
      reduced ? 0 : VICTORY_SWEEP_MS + 80,
    );
    return () => window.clearTimeout(timeout);
  }, [selectedId, solved, route.page]);
  const artworkPhase =
    solved && reveal.id === selectedId ? reveal.phase : "hidden";
  const done = catalog.filter((p) => isSolved(p, games[p.id].cells)).length;
  const marked = game.cells.filter((c) => c !== 0).length;
  const progress = Math.round((marked / game.cells.length) * 100);
  const hasMoves = marked > 0;
  const running =
    route.page === "game" &&
    !paused &&
    !solved &&
    !modal &&
    (started || hasMoves);
  const filtered = useMemo(
    () =>
      catalog.filter(
        (p) =>
          filter === "all" ||
          (filter === "small" && p.width <= 20) ||
          (filter === "large" && p.width > 20),
      ),
    [filter],
  );

  useEffect(() => {
    const data: SaveData = {
      version: 1,
      selectedId,
      games: Object.fromEntries(
        Object.entries(games).map(([id, g]) => [
          id,
          { cells: g.cells, elapsed: g.elapsed, crossedClues: g.crossedClues },
        ]),
      ),
    };
    try {
      setSaved(saveProgress(data, localStorage));
    } catch {
      setSaved(false);
    }
  }, [games, selectedId]);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      if (!document.hidden)
        setGames((prev) => ({
          ...prev,
          [selectedId]: {
            ...prev[selectedId],
            elapsed: prev[selectedId].elapsed + 1,
          },
        }));
    }, 1000);
    return () => window.clearInterval(id);
  }, [running, selectedId]);

  const onCommit = useCallback(
    (cells: Cell[]) => {
      const result = autoCrossCompletedLines(puzzle, game.cells, cells);
      setGames((prev) => ({
        ...prev,
        [selectedId]: commitCells(prev[selectedId], result.cells),
      }));
      setCompletion(
        result.completion.rows.length || result.completion.columns.length
          ? result.completion
          : null,
      );
      setErrors([]);
      setMessage("");
    },
    [selectedId, puzzle, game.cells],
  );
  const onUndo = useCallback(() => {
    setCompletion(null);
    setGames((prev) => ({ ...prev, [selectedId]: undo(prev[selectedId]) }));
    setErrors([]);
    setMessage("");
  }, [selectedId]);
  const onRedo = useCallback(() => {
    setCompletion(null);
    setGames((prev) => ({ ...prev, [selectedId]: redo(prev[selectedId]) }));
    setErrors([]);
    setMessage("");
  }, [selectedId]);
  const onActivity = useCallback(() => setStarted(true), []);
  const onClue = useCallback(
    (key: string) => {
      setGames((prev) => {
        const g = prev[selectedId];
        return {
          ...prev,
          [selectedId]: {
            ...g,
            crossedClues: g.crossedClues.includes(key)
              ? g.crossedClues.filter((k) => k !== key)
              : [...g.crossedClues, key],
          },
        };
      });
    },
    [selectedId],
  );
  function select(id: string) {
    setModal(null);
    window.location.hash = `/jugar/${id}`;
    setCompletion(null);
    const p = catalog.find((p) => p.id === id)!;
    setSelectedId(id);
    setCellSize(p.width <= 15 ? 32 : 22);
    setPaused(false);
    setStarted(false);
    setErrors([]);
    setMessage("");
  }
  function nextPuzzle() {
    setModal(null);
    const next = catalog.find(
      (p) => p.id !== puzzle.id && !isSolved(p, games[p.id].cells),
    );
    if (next) select(next.id);
    else window.location.hash = "/catalogo";
  }
  function review() {
    const found = errorsFor(puzzle, game.cells);
    setErrors(found);
    setMessage(
      found.length
        ? `${found.length} ${found.length === 1 ? "marca incorrecta. La señalamos" : "marcas incorrectas. Las señalamos"} en coral.`
        : hasMoves
          ? "Vas bien. No hay errores en tus marcas."
          : "Todavía no hay marcas para revisar. ¡Probá con una fila!",
    );
  }
  function clearErrors() {
    const found = errorsFor(puzzle, game.cells),
      next = game.cells.slice();
    found.forEach((i) => {
      next[i] = 0;
    });
    onCommit(next);
    setMessage(
      `Se ${found.length === 1 ? "limpió 1 marca incorrecta" : `limpiaron ${found.length} marcas incorrectas`}. Podés deshacerlo.`,
    );
  }
  const fit = useCallback(() => {
    if (!stage.current) return;
    const clues = puzzleClues(puzzle);
    const rowWidth = Math.max(
      52,
      Math.max(...clues.rows.map((c) => c.length)) * 24 + 12,
    );
    const colHeight = Math.max(
      52,
      Math.max(...clues.columns.map((c) => c.length)) * 23 + 12,
    );
    const { clientWidth, clientHeight } = stage.current;
    setCellSize(
      Math.max(
        8,
        Math.min(
          44,
          Math.floor(
            Math.min(
              (clientWidth - rowWidth - 24) / puzzle.width,
              (clientHeight - colHeight - 24) / puzzle.height,
            ),
          ),
        ),
      ),
    );
  }, [puzzle]);
  useEffect(() => {
    fit();
    const observer = new ResizeObserver(fit);
    if (stage.current) observer.observe(stage.current);
    return () => observer.disconnect();
  }, [fit, route.page]);
  return (
    <div className="app-shell">
      {route.page === "catalog" ? (
        <Catalog
          puzzles={filtered}
          games={games}
          selectedId={selectedId}
          done={done}
          total={catalog.length}
          filter={filter}
          onFilter={setFilter}
          onSelect={select}
          onHelp={() => setModal("help")}
        />
      ) : (
        <div className="workspace">
          <aside className="sidebar" aria-label="Controles y catálogo">
            <header className="sidebar-brand">
              <Brand />
              <button
                className="icon-button"
                aria-label="Cómo jugar"
                title="Cómo jugar"
                onClick={() => setModal("help")}
              >
                <CircleHelp size={18} />
              </button>
            </header>
            <div className="game-heading">
              <div className="game-title">
                <span className="eyebrow">{puzzle.collection}</span>
                <div>
                  <h1>{puzzle.title}</h1>
                  <span className="size-badge">
                    {puzzle.width} × {puzzle.height}
                  </span>
                </div>
              </div>
              <div className="game-stats">
                <span
                  className="timer"
                  aria-label={`Tiempo ${formatTime(game.elapsed)}`}
                >
                  <Clock3 size={16} />
                  {formatTime(game.elapsed)}
                </span>
                <button
                  className="icon-button"
                  aria-label={paused ? "Reanudar" : "Pausar"}
                  title={paused ? "Reanudar" : "Pausar"}
                  disabled={solved}
                  onClick={() => setPaused(!paused)}
                >
                  {paused ? <Play size={16} /> : <Pause size={16} />}
                </button>
                <span className="stat-divider" />
                <div className="marked-stat">
                  <strong>{progress}%</strong>
                  <span>marcado</span>
                </div>
              </div>
            </div>
            <div className="toolbar">
              <div
                className="tool-group"
                role="group"
                aria-label="Herramientas"
              >
                <button
                  className={tool === "fill" ? "tool selected" : "tool"}
                  onClick={() => setTool("fill")}
                  aria-pressed={tool === "fill"}
                  title="Pintar · espacio"
                >
                  <Square size={16} fill="currentColor" />
                  <span>Pintar</span>
                </button>
                <button
                  className={tool === "cross" ? "tool selected" : "tool"}
                  onClick={() => setTool("cross")}
                  aria-pressed={tool === "cross"}
                  title="Cruzar · X"
                >
                  <X size={18} />
                  <span>Cruzar</span>
                </button>
                <button
                  className={tool === "erase" ? "tool selected" : "tool"}
                  onClick={() => setTool("erase")}
                  aria-pressed={tool === "erase"}
                  title="Borrar · Supr"
                >
                  <Eraser size={17} />
                  <span>Borrar</span>
                </button>
                <button
                  className={tool === "pan" ? "tool selected" : "tool"}
                  onClick={() => setTool("pan")}
                  aria-pressed={tool === "pan"}
                  title="Mover tablero"
                >
                  <Hand size={17} />
                  <span>Mover</span>
                </button>
              </div>
              <div className="history-group">
                <button
                  className="icon-button"
                  aria-label="Deshacer"
                  title="Deshacer · Ctrl/⌘ Z"
                  disabled={!game.past.length || paused}
                  onClick={onUndo}
                >
                  <Undo2 size={17} />
                </button>
                <button
                  className="icon-button"
                  aria-label="Rehacer"
                  title="Rehacer · Ctrl/⌘ Shift Z"
                  disabled={!game.future.length || paused}
                  onClick={onRedo}
                >
                  <Redo2 size={17} />
                </button>
              </div>
              <div className="zoom-group">
                <button
                  className="icon-button"
                  aria-label="Alejar"
                  disabled={cellSize <= 8}
                  onClick={() => setCellSize((v) => Math.max(8, v - 2))}
                >
                  <Minus size={16} />
                </button>
                <output aria-label="Zoom">
                  {Math.round((cellSize / 24) * 100)}%
                </output>
                <button
                  className="icon-button"
                  aria-label="Acercar"
                  disabled={cellSize >= 44}
                  onClick={() => setCellSize((v) => Math.min(44, v + 2))}
                >
                  <Plus size={16} />
                </button>
                <button
                  className="icon-button fit-button"
                  aria-label="Ajustar tablero"
                  title="Ajustar a la ventana"
                  onClick={fit}
                >
                  <Expand size={16} />
                </button>
              </div>
            </div>
            <div className="game-actions">
              <button
                className="secondary-button"
                onClick={review}
                disabled={paused || solved}
              >
                <ShieldCheck size={16} /> Revisar errores
              </button>
              <button
                className="icon-button restart-button"
                title="Reiniciar tablero"
                aria-label="Reiniciar tablero"
                onClick={() => setModal("restart")}
              >
                <RotateCcw size={17} />
              </button>
            </div>

            <a className="catalog-navigation" href="#/catalogo">
              <ArrowRight size={15} className="back-arrow" />
              <span>Volver al catálogo</span>
              <span>
                {done}/{catalog.length}
              </span>
            </a>
            {message && (
              <div
                className={`feedback ${errors.length ? "has-errors" : ""}`}
                role="status"
              >
                <span>{message}</span>
                {errors.length > 0 && (
                  <button onClick={clearErrors}>
                    Limpiar marcas incorrectas <ArrowRight size={14} />
                  </button>
                )}
                <button
                  className="icon-button"
                  aria-label="Cerrar aviso"
                  onClick={() => {
                    setMessage("");
                    setErrors([]);
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {solved && (
              <div className="victory" role="status">
                <span className="victory-icon">
                  <CheckCheck size={25} />
                </span>
                <div>
                  <h3>¡Dibujo descubierto!</h3>
                  <p>
                    Completaste {puzzle.title} en {formatTime(game.elapsed)}.
                    Cada paso valió la pena.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  disabled={artworkPhase === "sweep"}
                  onClick={() => setModal("victory")}
                >
                  <Expand size={15} />
                  Ver imagen
                </button>
                <button className="primary-button" onClick={nextPuzzle}>
                  Otro desafío <ArrowRight size={16} />
                </button>
              </div>
            )}

            <footer className="rail-footer">
              <span className={saved ? "save-status" : "save-status failed"}>
                <span className="tiny-dot" />
                {saved ? "Progreso guardado" : "No se pudo guardar"}
              </span>
              <button className="help-button" onClick={() => setModal("help")}>
                <Keyboard size={15} /> Controles y atajos
              </button>
            </footer>
          </aside>
          <main className="main-content">
            <section className="game-card" aria-label="Área de juego">
              <div className="board-stage" ref={stage}>
                <Board
                  key={puzzle.id}
                  puzzle={puzzle}
                  cells={game.cells}
                  tool={tool}
                  cellSize={cellSize}
                  errors={errors}
                  completion={completion}
                  crossedClues={game.crossedClues}
                  artwork={artworkPhase}
                  disabled={paused || solved}
                  onCommit={onCommit}
                  onClue={onClue}
                  onUndo={onUndo}
                  onRedo={onRedo}
                  onActivity={onActivity}
                />
                {paused && (
                  <div className="pause-overlay">
                    <div>
                      <span className="pause-symbol">
                        <Leaf size={28} />
                      </span>
                      <h3>Una pausa viene bien.</h3>
                      <p>Tu tablero te espera acá.</p>
                      <button
                        className="primary-button"
                        onClick={() => setPaused(false)}
                      >
                        <Play size={16} /> Seguir jugando
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
          </main>
        </div>
      )}
      <p id="board-instructions" className="sr-only">
        Usá las flechas para navegar, espacio para pintar, X para cruzar y Supr
        para borrar. Las pistas pueden tacharse con un clic.
      </p>
      {modal === "victory" && solved && (
        <Modal
          title="¡Dibujo descubierto!"
          className="victory-modal"
          onClose={() => setModal(null)}
        >
          <div className="victory-art-frame">
            <Artwork puzzle={puzzle} />
          </div>
          <div className="victory-caption">
            <h3>{puzzle.title}</h3>
            <span>
              {puzzle.width} × {puzzle.height}
              <span>·</span>
              {formatTime(game.elapsed)}
            </span>
          </div>
          <p className="victory-description">
            Una casilla a la vez, apareció el dibujo.
          </p>
          <div className="modal-actions">
            <button className="secondary-button" onClick={() => setModal(null)}>
              Volver al dibujo
            </button>
            <button className="primary-button" onClick={nextPuzzle}>
              Otro desafío <ArrowRight size={15} />
            </button>
          </div>
        </Modal>
      )}
      {modal === "help" && (
        <Modal title="Una casilla a la vez" onClose={() => setModal(null)}>
          <p className="modal-intro">
            Descubrí el dibujo siguiendo las pistas de cada fila y columna.
          </p>
          <div className="help-example">
            <span className="example-clue">3 1</span>
            <span className="example-cell painted" />
            <span className="example-cell painted" />
            <span className="example-cell painted" />
            <span className="example-cell">×</span>
            <span className="example-cell painted" />
          </div>
          <p>
            Una pista <strong>3 1</strong> indica un grupo de tres casillas
            pintadas y otro de una. Separá los grupos con al menos una casilla
            vacía. Las cruces son anotaciones opcionales.
          </p>
          <dl className="shortcut-list">
            <div>
              <dt>Pintar / cruzar</dt>
              <dd>Clic / clic derecho</dd>
            </div>
            <div>
              <dt>Varias casillas</dt>
              <dd>Mantené y arrastrá</dd>
            </div>
            <div>
              <dt>Navegar</dt>
              <dd>↑ ↓ ← →</dd>
            </div>
            <div>
              <dt>Pintar · cruzar · borrar</dt>
              <dd>Espacio · X · Supr</dd>
            </div>
            <div>
              <dt>Deshacer / rehacer</dt>
              <dd>Ctrl/⌘ Z / Shift Z</dd>
            </div>
            <div>
              <dt>Desplazar tablero</dt>
              <dd>Scroll · herramienta mano</dd>
            </div>
            <div>
              <dt>Tachar una pista</dt>
              <dd>Clic en el número</dd>
            </div>
          </dl>
          <p className="help-note">
            Las ayudas se activan solo cuando las pedís. El tiempo se detiene al
            pausar o al ocultar la pestaña. Tu progreso se guarda en este
            navegador.
          </p>
          <button
            className="primary-button modal-primary"
            onClick={() => setModal(null)}
          >
            Vamos a jugar <ArrowRight size={16} />
          </button>
        </Modal>
      )}
      {modal === "restart" && (
        <Modal title="¿Empezamos de nuevo?" onClose={() => setModal(null)}>
          <p>
            Se borrarán las marcas, las pistas tachadas y el tiempo de «
            {puzzle.title}». Los demás tableros conservan su progreso.
          </p>
          <div className="modal-actions">
            <button className="secondary-button" onClick={() => setModal(null)}>
              Seguir jugando
            </button>
            <button
              className="danger-button"
              onClick={() => {
                setGames((prev) => ({
                  ...prev,
                  [selectedId]: createGame(puzzle),
                }));
                setStarted(false);
                setPaused(false);
                setErrors([]);
                setMessage("");
                setModal(null);
              }}
            >
              Reiniciar tablero
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
