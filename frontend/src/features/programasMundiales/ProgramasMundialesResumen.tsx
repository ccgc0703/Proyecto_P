import { Edit, Public, TravelExplore } from '@mui/icons-material';
import { ProgramaMiembro } from '../../types/programaMundial';
import { COLOR_ESTADO, ETIQUETA_ESTADO, formatoFecha } from './estado';

interface ProgramasMundialesResumenProps {
  enlaces: ProgramaMiembro[];
  canEdit: boolean;
  loading: boolean;
  onManage: () => void;
}

export const ProgramasMundialesResumen = ({
  enlaces,
  canEdit,
  loading,
  onManage,
}: ProgramasMundialesResumenProps) => (
  <section className="form-sect">
    <header>
      <div className="ic" aria-hidden="true">
        <Public />
      </div>
      <div className="flex-1 min-w-0">
        <span className="micro">Ciudadanía global</span>
        <h3>Programas Mundiales</h3>
      </div>
      {canEdit && (
        <button type="button" onClick={onManage} className="btn btn-soft btn-sm flex-none">
          {enlaces.length > 0 ? <Edit /> : <TravelExplore />}
          {enlaces.length > 0 ? 'Gestionar' : 'Enlazar'}
        </button>
      )}
    </header>

    {loading ? (
      <div className="flex justify-center py-8">
        <div
          className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"
          role="status"
          aria-label="Cargando programas mundiales"
        />
      </div>
    ) : enlaces.length === 0 ? (
      <div className="text-center py-6 space-y-2">
        <Public className="text-outline-variant mx-auto !text-4xl" />
        <p className="micro block">Sin programas mundiales registrados</p>
        {canEdit && (
          <p className="text-[11.5px] text-outline font-semibold">
            Enlaza un jamboree, desafío o iniciativa mundial.
          </p>
        )}
      </div>
    ) : (
      <div className="space-y-2">
        {enlaces.map((enlace) => (
          <div key={enlace.id} className="np-cargo">
            <div className="r flex items-center justify-between gap-2">
              <span>{enlace.ProgramaMundial?.nombre ?? 'Programa mundial'}</span>
              <span
                className="text-[10.5px] font-extrabold uppercase tracking-wide"
                style={{ color: COLOR_ESTADO[enlace.estado] }}
              >
                {ETIQUETA_ESTADO[enlace.estado]}
              </span>
            </div>
            <div className="p">
              Inicio {formatoFecha(enlace.fechaInicio)}
              {enlace.estado === 'COMPLETADO' && ` · Fin ${formatoFecha(enlace.fechaCompletado)}`}
            </div>
          </div>
        ))}
      </div>
    )}
  </section>
);
