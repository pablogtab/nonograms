import { ArrowRight, Check, CircleHelp, Grid2X2 } from "lucide-react";
import { isSolved } from "../engine";
import type { Game, Puzzle } from "../types";
import { Artwork } from "./Artwork";
import { Brand } from "./Brand";

interface Props {
  puzzles: Puzzle[];
  games: Record<string, Game>;
  selectedId: string;
  done: number;
  total: number;
  filter: string;
  onFilter(value: string): void;
  onSelect(id: string): void;
  onHelp(): void;
}
export function Catalog({
  puzzles,
  games,
  selectedId,
  done,
  total,
  filter,
  onFilter,
  onSelect,
  onHelp,
}: Props) {
  return (
    <main className="catalog-page">
      <header className="catalog-header">
        <Brand />
        <div>
          <a className="secondary-button" href={`#/jugar/${selectedId}`}>
            Volver al tablero <ArrowRight size={15} />
          </a>
          <button
            className="icon-button"
            aria-label="Cómo jugar"
            onClick={onHelp}
          >
            <CircleHelp size={19} />
          </button>
        </div>
      </header>
      <section className="catalog-content" aria-label="Catálogo de nonogramas">
        <div className="catalog-intro">
          <div>
            <span className="eyebrow">TU COLECCIÓN</span>
            <h1>
              Tu próximo descubrimiento<span>.</span>
            </h1>
            <p>Elegí un desafío. El dibujo se revela cuando lo resolvés.</p>
          </div>
          <span className="catalog-total">
            <Check size={16} />
            {done} de {total} completados
          </span>
        </div>
        <div
          className="catalog-filters"
          role="group"
          aria-label="Filtrar por tamaño"
        >
          {[
            ["all", "Todos"],
            ["small", "Hasta 20×20"],
            ["large", "Desde 25×25"],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "selected" : ""}
              aria-pressed={filter === value}
              onClick={() => onFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="catalog-grid">
          {puzzles.map((p) => {
            const g = games[p.id],
              solved = isSolved(p, g.cells),
              marked = g.cells.filter((c) => c !== 0).length,
              progress = Math.round((marked / g.cells.length) * 100);
            return (
              <button
                className={`catalog-card ${solved ? "is-complete" : ""}`}
                key={p.id}
                onClick={() => onSelect(p.id)}
                aria-label={`${p.title}, ${p.width} por ${p.height}, ${solved ? "completado" : marked ? "continuar" : "empezar"}`}
              >
                <div className="catalog-cover">
                  {solved ? (
                    <Artwork puzzle={p} decorative />
                  ) : (
                    <>
                      <div className="mystery-grid" aria-hidden="true">
                        {Array.from({ length: 25 }, (_, i) => (
                          <i key={i} />
                        ))}
                      </div>
                      <span className="mystery-size">
                        {p.width}
                        <small>× {p.height}</small>
                      </span>
                      <span className="mystery-label">
                        <Grid2X2 size={12} /> Dibujo por descubrir
                      </span>
                    </>
                  )}
                </div>
                <div className="catalog-card-copy">
                  <span className="eyebrow">{p.collection}</span>
                  <h2>{p.title}</h2>
                  <div className="catalog-card-bottom">
                    <span>
                      {p.width} × {p.height}
                      <span>·</span>
                      {solved
                        ? "Completado"
                        : marked
                          ? `${progress}% marcado`
                          : "Sin empezar"}
                    </span>
                    <span className="catalog-card-action">
                      {solved
                        ? "Ver tablero"
                        : marked
                          ? "Continuar"
                          : "Empezar"}
                      <ArrowRight size={14} />
                    </span>
                  </div>
                  <div className="catalog-card-progress">
                    <span style={{ width: `${solved ? 100 : progress}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <p className="catalog-footnote">
          Tu progreso se guarda automáticamente en este navegador.
        </p>
      </section>
    </main>
  );
}
