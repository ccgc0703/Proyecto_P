import type { ReactNode } from 'react';
import {
  MedicalInformation,
  Bloodtype,
  LocalHospital,
  ContactEmergency,
  Add,
  Edit,
  VerifiedUser,
  Vaccines,
  Medication,
  WarningAmber,
} from '@mui/icons-material';
import { FichaMedica, tipoSangreLabel, severidadLabel } from '../../types/fichaMedica';

interface FichaMedicaResumenProps {
  ficha: FichaMedica | null;
  canEdit: boolean;
  loading: boolean;
  onEdit: () => void;
}

export const FichaMedicaResumen = ({
  ficha,
  canEdit,
  loading,
  onEdit,
}: FichaMedicaResumenProps) => {
  const formatDate = (value?: string | null) =>
    value ? new Date(value).toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No registrada';

  /** Bloque de detalle (alergias, medicamentos, condiciones, vacunas). */
  const bloque = (
    titulo: string,
    icono: ReactNode,
    items: ReactNode[],
    vacio: string,
  ) => (
    <div>
      <p className="micro flex items-center gap-1.5 mb-2">
        {icono}
        {titulo}
      </p>
      {items.length > 0 ? (
        <div className="chip-row">{items}</div>
      ) : (
        <p className="text-[11.5px] text-outline font-semibold">{vacio}</p>
      )}
    </div>
  );

  return (
    <section className="form-sect">
      <header>
        <div className="ic" aria-hidden="true">
          <MedicalInformation />
        </div>
        <div className="flex-1 min-w-0">
          <span className="micro">Legajo clínico</span>
          <h3>Ficha Médica</h3>
        </div>
        {canEdit && (
          <button type="button" onClick={onEdit} className="btn btn-soft btn-sm flex-none">
            {ficha ? <Edit /> : <Add />}
            {ficha ? 'Editar' : 'Completar'}
          </button>
        )}
      </header>

      {loading ? (
        <div className="flex justify-center py-8">
          <div
            className="w-8 h-8 border-4 border-outline-variant border-t-primary rounded-full animate-spin"
            role="status"
            aria-label="Cargando ficha médica"
          />
        </div>
      ) : !ficha ? (
        <div className="text-center py-6 space-y-2">
          <Bloodtype className="text-outline-variant mx-auto !text-4xl" />
          <p className="micro block">Sin ficha médica registrada</p>
          {canEdit && (
            <p className="text-[11.5px] text-outline font-semibold">
              Completá los datos para dejar listo el legajo.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tipo de sangre destacado + consentimiento */}
          <div className="bg-surface-container-low rounded-xl p-3.5">
            <p className="micro block mb-1">Tipo de Sangre</p>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-sm font-extrabold text-primary uppercase tracking-wide">
                {tipoSangreLabel(ficha.tipoSangre)}
              </p>
              {ficha.consentimiento && (
                <span className="pill pill-green">
                  <i />
                  Autorizado {formatDate(ficha.consentimientoFecha)}
                </span>
              )}
            </div>
          </div>

          {/* Médico tratante y contacto de emergencia */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-low rounded-xl p-3.5 min-w-0">
              <p className="micro flex items-center gap-1.5 mb-1">
                <LocalHospital sx={{ fontSize: 13 }} />
                Médico
              </p>
              <p className="text-xs font-extrabold text-primary leading-snug break-words">
                {ficha.medicoTratante || 'No registrado'}
              </p>
              {ficha.telefonoMedico && (
                <p className="text-[11px] text-outline font-semibold mt-0.5">{ficha.telefonoMedico}</p>
              )}
            </div>
            <div className="bg-surface-container-low rounded-xl p-3.5 min-w-0">
              <p className="micro flex items-center gap-1.5 mb-1">
                <ContactEmergency sx={{ fontSize: 13 }} />
                Emergencia
              </p>
              <p className="text-xs font-extrabold text-primary leading-snug break-words">
                {ficha.contactoEmergenciaNombre || 'No registrado'}
              </p>
              {ficha.contactoEmergenciaTelefono && (
                <p className="text-[11px] text-outline font-semibold mt-0.5">
                  {ficha.contactoEmergenciaTelefono}
                </p>
              )}
            </div>
          </div>

          {/* Detalle: alergias, medicamentos, condiciones, vacunas */}
          <div className="space-y-3.5">
            {bloque(
              'Alergias',
              <WarningAmber sx={{ fontSize: 14 }} />,
              (ficha.Alergias ?? []).map((a) => (
                <span
                  key={a.id}
                  className="chip chip-mono"
                  style={a.severidad === 'SEVERA'
                    ? { background: 'var(--color-error-container)', color: 'var(--color-on-error)' }
                    : undefined}
                >
                  {a.nombre} · {severidadLabel(a.severidad)}
                </span>
              )),
              ficha.alergias || 'Ninguna conocida',
            )}

            {bloque(
              'Medicamentos Recetados',
              <Medication sx={{ fontSize: 14 }} />,
              (ficha.Medicamentos ?? []).map((m) => (
                <span key={m.id} className="chip chip-mono">
                  {m.nombre}{m.dosis ? ` · ${m.dosis}` : ''}
                </span>
              )),
              ficha.medicamentos || 'Ninguno registrado',
            )}

            {bloque(
              'Condiciones',
              <LocalHospital sx={{ fontSize: 14 }} />,
              (ficha.Condiciones ?? []).map((c) => (
                <span key={c.id} className="chip chip-mono">
                  {c.nombre}{c.requiereControl ? ' · control' : ''}
                </span>
              )),
              ficha.condiciones || 'Ninguna',
            )}

            {bloque(
              'Vacunas',
              <Vaccines sx={{ fontSize: 14 }} />,
              (ficha.Vacunas ?? []).map((v) => (
                <span key={v.id} className="chip chip-mono">
                  {v.nombre}{v.fechaAplicacion ? ` · ${formatDate(v.fechaAplicacion)}` : ''}
                </span>
              )),
              'Sin vacunas registradas',
            )}
          </div>

          {ficha.observaciones && (
            <div className="bg-surface-container-low rounded-xl p-3.5">
              <p className="micro flex items-center gap-1.5 mb-1">
                <VerifiedUser sx={{ fontSize: 14 }} />
                Observaciones
              </p>
              <p className="text-[12.5px] text-on-surface-variant leading-relaxed">{ficha.observaciones}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
