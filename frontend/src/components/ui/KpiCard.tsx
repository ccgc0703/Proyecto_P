import type { ReactNode } from 'react';

/** Tono del degradado de esquina — da color al icono y al fondo. */
type TonoKpi = 'grupo' | 'distrito' | 'accent' | 'neutral';

interface KpiCardProps {
  tono?: TonoKpi;
  /** Etiqueta monoespaciada; va acompañada del icono. */
  etiqueta: string;
  icono?: ReactNode;
  /** Valor principal. Si lleva unidad, pásala en `sufijo` para tipografiarla menor. */
  valor: ReactNode;
  sufijo?: ReactNode;
  /** Nota inferior: suele llevar un `<Pill>`. */
  nota?: ReactNode;
  className?: string;
}

/**
 * Tarjeta de KPI grande (fila superior del Dashboard y del Calendario).
 * El degradado de esquina es un pseudo-elemento, por eso `.lbl`, `.val`
 * y `.note` llevan `position: relative; z-index: 1` en el CSS.
 */
export const KpiCard = ({
  tono = 'neutral',
  etiqueta,
  icono,
  valor,
  sufijo,
  nota,
  className = '',
}: KpiCardProps) => (
  <div className={['kpi', `c-${tono}`, className].filter(Boolean).join(' ')}>
    <div className="lbl">
      {icono}
      <span className="micro">{etiqueta}</span>
    </div>
    <div className="val">
      {valor}
      {sufijo != null && <small>{sufijo}</small>}
    </div>
    {nota && <div className="note">{nota}</div>}
  </div>
);
