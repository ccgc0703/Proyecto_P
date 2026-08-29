import {
  Box,
  Typography,
  Chip,
  Divider,
} from '@mui/material';
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

  return (
    <Box className="bg-emerald-500/5 p-8 rounded-[2rem] border border-emerald-500/10">
      <Box className="flex items-center justify-between mb-6">
        <Typography className="text-[10px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
          <MedicalInformation fontSize="small" /> Ficha Médica
        </Typography>
        {canEdit && (
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/10 text-emerald-700 rounded-lg font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600/20 transition-colors"
          >
            {ficha ? <Edit fontSize="small" /> : <Add fontSize="small" />}
            {ficha ? 'Editar' : 'Completar'}
          </button>
        )}
      </Box>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
        </div>
      ) : !ficha ? (
        <Box className="text-center py-6 space-y-2">
          <Bloodtype className="text-emerald-300 mx-auto !text-4xl opacity-40" />
          <p className="text-xs font-bold text-outline uppercase tracking-widest">
            Sin ficha médica registrada
          </p>
          {canEdit && (
            <p className="text-[10px] text-outline font-bold">
              Completá los datos para dejar listo el legajo.
            </p>
          )}
        </Box>
      ) : (
        <Box className="space-y-4">
          {/* Tipo de sangre destacado */}
          <div className="bg-white/60 p-3 rounded-xl space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/10 flex items-center justify-center text-emerald-700 shrink-0">
                <Bloodtype fontSize="small" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-0.5">Tipo de Sangre</p>
                <p className="text-sm font-black text-emerald-700 uppercase tracking-widest">
                  {tipoSangreLabel(ficha.tipoSangre)}
                </p>
              </div>
            </div>
            {ficha.consentimiento && (
              <Chip
                icon={<VerifiedUser fontSize="small" />}
                label={`Autorizado ${formatDate(ficha.consentimientoFecha)}`}
                className="bg-emerald-600/10 text-emerald-700 font-black text-[9px] uppercase tracking-widest !h-auto !min-h-0 !py-1 !whitespace-normal"
                style={{ width: '100%' }}
              />
            )}
          </div>

          {/* Datos resumen */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/50 p-3 rounded-xl">
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <LocalHospital fontSize="small" className="!text-[13px]" /> Médico
              </p>
              <p className="text-xs font-black text-primary leading-tight">
                {ficha.medicoTratante || 'No registrado'}
              </p>
              {ficha.telefonoMedico && (
                <p className="text-[10px] text-outline font-bold mt-0.5">{ficha.telefonoMedico}</p>
              )}
            </div>
            <div className="bg-white/50 p-3 rounded-xl">
              <p className="text-[9px] font-bold text-outline uppercase tracking-wider mb-0.5 flex items-center gap-1">
                <ContactEmergency fontSize="small" className="!text-[13px]" /> Emergencia
              </p>
              <p className="text-xs font-black text-primary leading-tight">
                {ficha.contactoEmergenciaNombre || 'No registrado'}
              </p>
              {ficha.contactoEmergenciaTelefono && (
                <p className="text-[10px] text-outline font-bold mt-0.5">{ficha.contactoEmergenciaTelefono}</p>
              )}
            </div>
          </div>

          <Divider sx={{ opacity: 0.15 }} />

          {/* Detalle: alergias, medicamentos, condiciones, vacunas */}
          <div className="space-y-3">
            <div className="bg-white/50 p-3 rounded-xl">
              <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-2 flex items-center gap-1">
                <WarningAmber fontSize="small" /> Alergias
              </p>
              {ficha.Alergias.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {ficha.Alergias.map((a) => (
                    <Chip
                      key={a.id}
                      size="small"
                      label={`${a.nombre} · ${severidadLabel(a.severidad)}`}
                      className={a.severidad === 'SEVERA'
                        ? '!bg-error/10 !text-error font-black text-[9px] uppercase tracking-wider'
                        : '!bg-surface-container-high !text-primary font-black text-[9px] uppercase tracking-wider'}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-outline font-bold">{ficha.alergias || 'Ninguna conocida'}</p>
              )}
            </div>

            <div className="bg-white/50 p-3 rounded-xl">
              <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-2 flex items-center gap-1">
                <Medication fontSize="small" /> Medicamentos Recetados
              </p>
              {ficha.Medicamentos.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {ficha.Medicamentos.map((m) => (
                    <Chip key={m.id} size="small" label={`${m.nombre}${m.dosis ? ` · ${m.dosis}` : ''}`}
                      className="!bg-surface-container-high !text-primary font-black text-[9px] uppercase tracking-wider" />
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-outline font-bold">{ficha.medicamentos || 'Ninguno registrado'}</p>
              )}
            </div>

            <div className="bg-white/50 p-3 rounded-xl">
              <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-2 flex items-center gap-1">
                <LocalHospital fontSize="small" /> Condiciones
              </p>
              {ficha.Condiciones.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {ficha.Condiciones.map((c) => (
                    <Chip key={c.id} size="small" label={`${c.nombre}${c.requiereControl ? ' · control' : ''}`}
                      className="!bg-surface-container-high !text-primary font-black text-[9px] uppercase tracking-wider" />
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-outline font-bold">{ficha.condiciones || 'Ninguna'}</p>
              )}
            </div>

            <div className="bg-white/50 p-3 rounded-xl">
              <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-2 flex items-center gap-1">
                <Vaccines fontSize="small" /> Vacunas
              </p>
              {ficha.Vacunas.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {ficha.Vacunas.map((v) => (
                    <Chip key={v.id} size="small" label={`${v.nombre}${v.fechaAplicacion ? ` · ${formatDate(v.fechaAplicacion)}` : ''}`}
                      className="!bg-surface-container-high !text-primary font-black text-[9px] uppercase tracking-wider" />
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-outline font-bold">Sin vacunas registradas</p>
              )}
            </div>
          </div>
        </Box>
      )}
    </Box>
  );
};
