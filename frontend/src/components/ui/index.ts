/**
 * Design system Sentinel — primitivas visuales compartidas.
 *
 * Cada componente es un envoltorio fino sobre una clase firma de
 * `src/index.css` (capa `@layer components`), de modo que la maqueta
 * `frontend/maqueta/index.html` y el código real comparten tokens.
 *
 * Regla: añadir estilos en `index.css` (tokens/clases), no en los props
 * de estos componentes. Los componentes solo aportan estructura y accesibilidad.
 */
export { Card } from './Card';
export { DataTableShell } from './DataTableShell';
export { Hero, HeroChip } from './Hero';
export { KpiCard } from './KpiCard';
export { PageHeader } from './PageHeader';
export { PieTabla } from './PieTabla';
export { Pill } from './Pill';
export { StateBlock } from './StateBlock';
