import type { ReactNode } from 'react';

interface PageHeaderProps {
  /** Etiqueta monoespaciada sobre el título (categoría / módulo / ruta). */
  micro?: ReactNode;
  titulo: string;
  subtitulo?: ReactNode;
  /** Botones de acción alineados a la derecha. */
  acciones?: ReactNode;
  className?: string;
}

/**
 * Encabezado estándar de página: micro-etiqueta + título + subtítulo,
 * con las acciones a la derecha. Sustituye a los breadcrumbs duplicados
 * que tenía el shell (el título ya comunica la ubicación).
 */
export const PageHeader = ({ micro, titulo, subtitulo, acciones, className = '' }: PageHeaderProps) => (
  <header className={['pg-head', className].filter(Boolean).join(' ')}>
    <div className="pg-titles min-w-0">
      {micro && <p className="micro mb-1.5">{micro}</p>}
      <h1>{titulo}</h1>
      {subtitulo && <p className="pg-sub">{subtitulo}</p>}
    </div>
    {acciones && <div className="flex flex-wrap items-center gap-2.5">{acciones}</div>}
  </header>
);
