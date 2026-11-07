import type { ReactNode } from 'react';

interface DataTableShellProps {
  /** Barra superior: buscador, filtros, botón "Nuevo". */
  herramientas?: ReactNode;
  /** Barra inferior: paginación, conteo de filas. */
  pie?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Contenedor de tabla con la densidad de la maqueta: panel blanco de radio
 * 2xl, barra de herramientas de 15/18px y pie con divisor superior.
 * La tabla en sí debe usar la clase `dt` para heredar th/td y el hover.
 */
export const DataTableShell = ({ herramientas, pie, children, className = '' }: DataTableShellProps) => (
  <div className={['tbl-wrap', className].filter(Boolean).join(' ')}>
    {herramientas && <div className="tbl-tools">{herramientas}</div>}
    {children}
    {pie && <div className="tbl-foot">{pie}</div>}
  </div>
);
