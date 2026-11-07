import type { ReactNode } from 'react';

type VariantePill = 'green' | 'gold' | 'grey' | 'red' | 'blue';

interface PillProps {
  /** Tono semántico — coincide con las clases `.pill-*` de la maqueta. */
  variante?: VariantePill;
  /** Muestra el punto delante del texto (estado "en vivo"). */
  dot?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Píldora monoespaciada para estados y metadatos compactos
 * (ej. "ACTIVO", "OPERATIVAS", "GRUPO").
 */
export const Pill = ({ variante = 'grey', dot = false, children, className = '' }: PillProps) => (
  <span className={['pill', `pill-${variante}`, className].filter(Boolean).join(' ')}>
    {dot && <i aria-hidden="true" />}
    {children}
  </span>
);
