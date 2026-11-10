import type { ReactNode } from 'react';

interface HeroChipProps {
  /** Tono dorado — resalta la etiqueta (rol, estado destacado). */
  tono?: 'default' | 'gold';
  icono?: ReactNode;
  children: ReactNode;
}

/** Etiqueta monoespaciada dentro de un Hero. */
export const HeroChip = ({ tono = 'default', icono, children }: HeroChipProps) => (
  <span className={['hero-chip', tono === 'gold' && 'gold'].filter(Boolean).join(' ')}>
    {icono}
    {children}
  </span>
);

interface HeroProps {
  /** `grad` = degradado verde con texto blanco; `flat` = panel claro. */
  variante?: 'grad' | 'flat';
  /** Ruta de navegación sobre los chips (ej. "Volver al cuadro"). */
  crumb?: ReactNode;
  chips?: ReactNode;
  titulo: ReactNode;
  subtitulo?: ReactNode;
  /** Icono decorativo del lado derecho. */
  icono?: ReactNode;
  /** Métrica grande a la derecha (solo legible sobre `grad`). */
  kpi?: { etiqueta: string; valor: ReactNode };
  /** Slot libre para botones u otros elementos a la derecha. */
  acciones?: ReactNode;
  className?: string;
}

/**
 * Banner superior de página. Es el bloque más alto del layout: en la maqueta
 * se redujo a 21×24px de padding para evitar que las vistas se saturaran.
 */
export const Hero = ({
  variante = 'grad',
  crumb,
  chips,
  titulo,
  subtitulo,
  icono,
  kpi,
  acciones,
  className = '',
}: HeroProps) => (
  <section className={['hero', variante, className].filter(Boolean).join(' ')}>
    <div className="hero-l">
      {crumb && <div className="tb-crumb mb-2.5">{crumb}</div>}
      {chips && <div className="hero-chips">{chips}</div>}
      <h1>{titulo}</h1>
      {subtitulo && <p className="sub">{subtitulo}</p>}
    </div>
    {(icono || kpi || acciones) && (
      <div className="hero-r">
        {icono && <div className="hero-ico">{icono}</div>}
        {kpi && (
          <div className="hero-kpi">
            <span className="micro">{kpi.etiqueta}</span>
            <b>{kpi.valor}</b>
          </div>
        )}
        {acciones}
      </div>
    )}
  </section>
);
