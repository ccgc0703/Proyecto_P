import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  /** `lg` agranda el padding y el radio (bloques destacados). */
  size?: 'default' | 'lg';
  /** Quita el padding para incrustar tablas o listas a sangre. */
  flush?: boolean;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

/** Panel base: fondo blanco, radio de la maqueta y sombra tintada `--sh-1`. */
export const Card = ({ size = 'default', flush = false, children, className = '', style }: CardProps) => (
  <div
    className={['card', size === 'lg' && 'card-lg', flush && 'p-0 overflow-hidden', className]
      .filter(Boolean)
      .join(' ')}
    style={style}
  >
    {children}
  </div>
);
