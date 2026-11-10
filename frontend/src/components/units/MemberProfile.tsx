import { useState } from 'react';
import { Close, Phone, MedicalInformation } from '@mui/icons-material';
import { usePermission } from '../../hooks/usePermission';
import { useFichaMedica } from '../../hooks/useFichaMedica';
import { useDatosScout } from '../../hooks/useDatosScout';
import { FichaMedicaResumen } from '../../features/fichaMedica/FichaMedicaResumen';
import { FichaMedicaForm } from '../../features/fichaMedica/FichaMedicaForm';
import { DatosScoutResumen } from '../../features/datosScout/DatosScoutResumen';
import { DatosScoutForm } from '../../features/datosScout/DatosScoutForm';
import { ProgresionSeccion } from '../../features/progresion/ProgresionSeccion';
import { Member } from '../../types/member';

interface MemberProfileProps {
  member: Member;
  onClose: () => void;
}

export const MemberProfile = ({ member, onClose }: MemberProfileProps) => {
  const canViewMedico = usePermission('medico:view');
  const canUpdateMedico = usePermission('medico:update');
  const canViewDatosScout = usePermission('datosscout:view');
  const canManageDatosScout = usePermission('datosscout:manage');
  const canEdit = canUpdateMedico;
  const { ficha, loading, reload } = useFichaMedica(member?.id);
  const { datos: datosScout, loading: loadingDatosScout, reload: reloadDatosScout } =
    useDatosScout(member?.id);
  const [fichaDialogOpen, setFichaDialogOpen] = useState(false);
  const [datosScoutDialogOpen, setDatosScoutDialogOpen] = useState(false);
  const calculateAge = (birthDate?: string) => {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const representante = member.Representante;
  const telRepresentante = representante?.telefono || '';
  const telEmergencia = ficha?.contactoEmergenciaTelefono || telRepresentante;

  return (
    <div className="bg-surface-container-lowest min-h-screen md:min-h-0 md:h-[90vh] overflow-y-auto rounded-none md:rounded-[2.5rem] relative">
      {/* Cabecera de perfil */}
      <header className="np-head">
        <button
          type="button"
          className="act-btn absolute top-4 right-4 z-20"
          style={{ color: '#fff', background: 'rgba(255,255,255,0.14)' }}
          onClick={onClose}
          aria-label="Cerrar perfil del miembro"
        >
          <Close />
        </button>

        <div className="relative z-10 flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-3xl bg-white/15 grid place-items-center shrink-0 font-extrabold text-3xl"
            aria-hidden="true"
          >
            {member.nombres?.[0]}
            {member.apellidos?.[0]}
          </div>
          <div className="min-w-0">
            <span className="micro">Perfil del Miembro · {member.Unidad?.nombre || 'Unidad'}</span>
            <h4>
              {member.nombres} {member.apellidos}
            </h4>
            <div className="np-meta">
              <span>{member.estado || 'ACTIVO'}</span>
              <span>{member.genero === 'MASCULINO' ? 'Masculino' : 'Femenino'}</span>
              <span>C.I. {member.cedula || '—'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido */}
      <div className="px-5 pb-6 md:px-6">
        <div className="grid md:grid-cols-12 gap-5 items-start">
          {/* Columna izquierda: datos personales */}
          <div className="md:col-span-4 space-y-4">
            <section className="np-sec">
              <span className="micro">Datos Personales</span>
              <div className="resumen-row">
                <span>C.I. del Joven</span>
                <b>{member.cedula || 'No registrada'}</b>
              </div>
              <div className="resumen-row">
                <span>Nacimiento</span>
                <b>
                  {member.fechaNacimiento
                    ? new Date(member.fechaNacimiento).toLocaleDateString('es')
                    : '—'}{' '}
                  ({calculateAge(member.fechaNacimiento)} años)
                </b>
              </div>
              <div className="resumen-row">
                <span>Género</span>
                <b>{member.genero === 'MASCULINO' ? 'Masculino' : 'Femenino'}</b>
              </div>
            </section>

            {representante && (
              <section className="np-sec">
                <span className="micro">Representante</span>
                <div className="resumen-row">
                  <span>Nombre</span>
                  <b>{representante.nombre}</b>
                </div>
                <div className="resumen-row">
                  <span>Parentesco</span>
                  <b>{representante.parentesco || '—'}</b>
                </div>
                <div className="resumen-row">
                  <span>Teléfono</span>
                  <b>{representante.telefono || 'N/A'}</b>
                </div>
                <div className="resumen-row">
                  <span>Dirección</span>
                  <b>{representante.direccion || 'Sin dirección'}</b>
                </div>
              </section>
            )}

            {/* Ficha Médica — Datos reales */}
            {canViewMedico && (
              <FichaMedicaResumen
                ficha={ficha}
                canEdit={canEdit}
                loading={loading}
                onEdit={() => setFichaDialogOpen(true)}
              />
            )}

            {/* Datos Scout — Expediente / libreta */}
            {canViewDatosScout && (
              <DatosScoutResumen
                datos={datosScout}
                canEdit={canManageDatosScout}
                loading={loadingDatosScout}
                onEdit={() => setDatosScoutDialogOpen(true)}
              />
            )}
          </div>

          {/* Columna derecha: progresión y contactos */}
          <div className="md:col-span-8 space-y-4">
            <ProgresionSeccion miembroId={member.id} />

            {/* Contactos de emergencia */}
            <section className="card">
              <div className="card-head">
                <h3>Contactos de Emergencia</h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {telRepresentante ? (
                  <a href={`tel:${telRepresentante}`} className="np-cargo no-underline block hover:opacity-80 transition-opacity">
                    <div className="r flex items-center gap-2">
                      <Phone sx={{ fontSize: 12 }} />
                      Llamar Representante
                    </div>
                    <div className="p">{telRepresentante}</div>
                  </a>
                ) : (
                  <div className="np-cargo">
                    <div className="r flex items-center gap-2">
                      <Phone sx={{ fontSize: 12 }} />
                      Llamar Representante
                    </div>
                    <div className="p">N/A</div>
                  </div>
                )}

                {telEmergencia ? (
                  <a href={`tel:${telEmergencia}`} className="np-cargo no-underline block hover:opacity-80 transition-opacity">
                    <div className="r flex items-center gap-2" style={{ color: 'var(--color-error)' }}>
                      <MedicalInformation sx={{ fontSize: 12 }} />
                      Emergencia Médica
                    </div>
                    <div className="p">{telEmergencia}</div>
                  </a>
                ) : (
                  <div className="np-cargo">
                    <div className="r flex items-center gap-2" style={{ color: 'var(--color-error)' }}>
                      <MedicalInformation sx={{ fontSize: 12 }} />
                      Emergencia Médica
                    </div>
                    <div className="p">N/A</div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>

      <FichaMedicaForm
        open={fichaDialogOpen}
        miembroId={member.id}
        miembroNombre={`${member.nombres} ${member.apellidos}`}
        ficha={ficha}
        onClose={() => setFichaDialogOpen(false)}
        onSaved={reload}
      />

      <DatosScoutForm
        open={datosScoutDialogOpen}
        miembroId={member.id}
        miembroNombre={`${member.nombres} ${member.apellidos}`}
        unidadId={member.unidadId}
        datos={datosScout}
        onClose={() => setDatosScoutDialogOpen(false)}
        onSaved={reloadDatosScout}
      />
    </div>
  );
};
