import { Add, BadgeOutlined, Edit, Groups, HistoryEdu, Notes, Flag } from '@mui/icons-material';
import { DatosScout } from '../../types/datosScout';

interface DatosScoutResumenProps {
  datos: DatosScout | null;
  canEdit: boolean;
  loading: boolean;
  onEdit: () => void;
}

const formatoFecha = (valor?: string | null) =>
  valor
    ? new Date(valor).toLocaleDateString('es', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      })
    : 'No registrada';

export const DatosScoutResumen = ({ datos, canEdit, loading, onEdit }: DatosScoutResumenProps) => (
  <section className="form-sect">
    <header>
      <div className="ic" aria-hidden="true">
        <HistoryEdu />
      </div>
      <div className="flex-1 min-w-0">
        <span className="micro">Trayectoria scout</span>
        <h3>Datos Scout</h3>
      </div>
      {canEdit && (
        <button type="button" onClick={onEdit} className="btn btn-soft btn-sm flex-none">
          {datos ? <Edit /> : <Add />}
          {datos ? 'Editar' : 'Completar'}
        </button>
      )}
    </header>

    {loading ? (
      <div className="flex justify-center py-8">
        <div
          className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"
          role="status"
          aria-label="Cargando datos scout"
        />
      </div>
    ) : !datos ? (
      <div className="text-center py-6 space-y-2">
        <HistoryEdu className="text-outline-variant mx-auto !text-4xl" />
        <p className="micro block">Sin expediente scout registrado</p>
        {canEdit && (
          <p className="text-[11.5px] text-outline font-semibold">
            Completa la libreta para dejar listo el legajo.
          </p>
        )}
      </div>
    ) : (
      <div className="space-y-4">
        {/* Fechas clave */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-low rounded-xl p-3.5 min-w-0">
            <p className="micro flex items-center gap-1.5 mb-1">
              <Flag sx={{ fontSize: 13 }} />
              Registro
            </p>
            <p className="text-xs font-extrabold text-primary leading-snug break-words">
              {formatoFecha(datos.fechaRegistro)}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3.5 min-w-0">
            <p className="micro flex items-center gap-1.5 mb-1">
              <HistoryEdu sx={{ fontSize: 13 }} />
              Ingreso
            </p>
            <p className="text-xs font-extrabold text-primary leading-snug break-words">
              {formatoFecha(datos.fechaIngreso)}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3.5 min-w-0">
            <p className="micro flex items-center gap-1.5 mb-1">
              <BadgeOutlined sx={{ fontSize: 13 }} />
              Promesa
            </p>
            <p className="text-xs font-extrabold text-primary leading-snug break-words">
              {formatoFecha(datos.fechaPromesa)}
            </p>
          </div>
        </div>

        {/* Patrulla y cargo */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-low rounded-xl p-3.5 min-w-0">
            <p className="micro flex items-center gap-1.5 mb-1">
              <Groups sx={{ fontSize: 13 }} />
              Patrulla
            </p>
            <p className="text-xs font-extrabold text-primary leading-snug break-words">
              {datos.Patrulla?.nombre || 'Sin asignar'}
            </p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-3.5 min-w-0">
            <p className="micro flex items-center gap-1.5 mb-1">
              <BadgeOutlined sx={{ fontSize: 13 }} />
              Cargo actual
            </p>
            <p className="text-xs font-extrabold text-primary leading-snug break-words">
              {datos.cargoActual || 'Sin cargo'}
            </p>
          </div>
        </div>

        {datos.observaciones && (
          <div className="bg-surface-container-low rounded-xl p-3.5">
            <p className="micro flex items-center gap-1.5 mb-1">
              <Notes sx={{ fontSize: 14 }} />
              Observaciones
            </p>
            <p className="text-[12.5px] text-on-surface-variant leading-relaxed">
              {datos.observaciones}
            </p>
          </div>
        )}
      </div>
    )}
  </section>
);
