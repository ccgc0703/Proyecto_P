import { ChevronLeft, ChevronRight } from '@mui/icons-material';

const OPCIONES_FILAS = [10, 15, 25, 50];

interface PieTablaProps {
  /** Total de filas tras los filtros. */
  total: number;
  /** Página actual (1-based). */
  pagina: number;
  /** Filas por página. */
  porPagina: number;
  onPagina: (pagina: number) => void;
  onPorPagina: (n: number) => void;
  /** Nombre de la colección para el recuento, p. ej. "miembros". */
  coleccion?: string;
  /** Oculta el selector "Filas" (tablas cortas sin paginación útil). */
  sinSelector?: boolean;
}

/** Ventana de números de página centrada en la actual (máx. 5). */
const paginasVisibles = (pagina: number, paginas: number): number[] => {
  const inicio = Math.max(1, Math.min(pagina - 2, paginas - 4));
  const fin = Math.min(paginas, inicio + 4);
  const lista: number[] = [];
  for (let i = inicio; i <= fin; i++) lista.push(i);
  return lista;
};

/**
 * Pie estándar de tabla: recuento a la izquierda, paginación al centro y
 * selector de filas por página a la derecha (dentro de `.tbl-foot`).
 * Pensado para renderizarse como `pie` de `DataTableShell`.
 */
export const PieTabla = ({
  total,
  pagina,
  porPagina,
  onPagina,
  onPorPagina,
  coleccion = 'registros',
  sinSelector = false,
}: PieTablaProps) => {
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : Math.min((pagina - 1) * porPagina + 1, total);
  const hasta = Math.min(pagina * porPagina, total);

  return (
    <>
      <span className="rows-sel">
        {desde}–{hasta} de {total} {coleccion}
      </span>

      <nav className="pager" aria-label="Paginación">
        <button
          type="button"
          className="pg-btn"
          onClick={() => onPagina(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          <ChevronLeft sx={{ fontSize: 16 }} />
        </button>
        {paginasVisibles(pagina, paginas).map((p) => (
          <button
            key={p}
            type="button"
            className={`pg-btn${p === pagina ? ' on' : ''}`}
            aria-current={p === pagina ? 'page' : undefined}
            aria-label={`Página ${p}`}
            onClick={() => onPagina(p)}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          className="pg-btn"
          onClick={() => onPagina(pagina + 1)}
          disabled={pagina >= paginas}
          aria-label="Página siguiente"
        >
          <ChevronRight sx={{ fontSize: 16 }} />
        </button>
      </nav>

      {!sinSelector && (
        <label className="rows-sel">
          Filas
          <select
            value={porPagina}
            onChange={(e) => onPorPagina(Number(e.target.value))}
            aria-label="Filas por página"
          >
            {OPCIONES_FILAS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );
};
