import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowBack,
  Person,
  ContactPhone,
  Home,
  Wc,
  CalendarMonth,
  SaveAlt,
  Add,
  CheckCircle,
  ErrorOutline,
} from '@mui/icons-material';
import { miembrosApi, unidadesApi } from '../api';
import { Member, UnidadEntity } from '../types/member';
import { getApiErrorMessage } from '../utils/errors';
import { PageHeader, StateBlock } from '../components/ui';

const editSchema = z.object({
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  cedula: z.string().min(5, 'Cédula requerida'),
  fechaNacimiento: z.string().min(1, 'Fecha requerida'),
  genero: z.enum(['MASCULINO', 'FEMENINO'], {
    errorMap: () => ({ message: 'Selecciona el género' }),
  }),
  estado: z.string().optional(),
  historial: z.string().optional(),
  // Datos Scout
  fechaIngreso: z.string().optional(),
  fechaPromesa: z.string().optional(),
  cargoActual: z.string().optional(),
  patrullaId: z.string().optional(),
});

type EditFormData = z.infer<typeof editSchema>;

interface MemberEditPageProps {
  memberId: string;
  unitType: string;
  unitLabel: string;
}

export const MemberEditPage = ({ memberId, unitType, unitLabel }: MemberEditPageProps) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [memberData, setMemberData] = useState<Member | null>(null);
  const [subUnidades, setSubUnidades] = useState<UnidadEntity[]>([]);
  const [showCreateSub, setShowCreateSub] = useState(false);
  const [newSubNombre, setNewSubNombre] = useState('');
  const [creatingSub, setCreatingSub] = useState(false);

  // Determinar nomenclatura
  const subUnitLabel = unitType.toLowerCase() === 'manada'
    ? 'Seisena'
    : unitType.toLowerCase() === 'clan' || unitType.toLowerCase() === 'comunidad'
      ? 'Equipo de Trabajo'
      : 'Patrulla';

  useEffect(() => {
    const fetchSubUnits = async () => {
      try {
        if (memberData?.unidadId) {
          const list = await unidadesApi.getPatrullas(memberData.unidadId);
          setSubUnidades(list);
        }
      } catch (err) {
        console.error('Error fetching sub-units:', err);
      }
    };
    if (memberData) fetchSubUnits();
  }, [memberData?.unidadId, memberData]);

  const handleCreateSubUnit = async () => {
    if (!newSubNombre.trim() || !memberData?.unidadId) return;
    try {
      setCreatingSub(true);
      const created = await unidadesApi.createPatrulla(memberData.unidadId, { nombre: newSubNombre.trim() });
      setSubUnidades(prev => [...prev, created]);
      setNewSubNombre('');
      setShowCreateSub(false);
    } catch (err) {
      console.error('Error creating sub-unit:', err);
    } finally {
      setCreatingSub(false);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    const loadMember = async () => {
      try {
        const data = await miembrosApi.getById(memberId);
        setMemberData(data);
        reset({
          nombres: data.nombres,
          apellidos: data.apellidos,
          cedula: data.cedula,
          fechaNacimiento: data.fechaNacimiento?.split('T')[0] || '',
          genero: data.genero,
          estado: data.estado,
          historial: data.historial || '',
          fechaIngreso: data.fechaIngreso?.split('T')[0] || '',
          fechaPromesa: data.fechaPromesa?.split('T')[0] || '',
          cargoActual: data.cargoActual || '',
          patrullaId: data.patrullaId || '',
        });
      } catch {
        setError('No se pudo cargar el miembro.');
      } finally {
        setLoading(false);
      }
    };
    loadMember();
  }, [memberId, reset]);

  const onSubmit = async (data: EditFormData) => {
    try {
      setError(null);
      await miembrosApi.update(memberId, {
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedula: data.cedula,
        fechaNacimiento: data.fechaNacimiento,
        genero: data.genero,
        estado: data.estado,
        historial: data.historial || null,
        fechaIngreso: data.fechaIngreso || null,
        fechaPromesa: data.fechaPromesa || null,
        cargoActual: data.cargoActual || null,
        patrullaId: data.patrullaId || null,
      });
      setSuccess(true);
      setTimeout(() => {
        navigate({ to: `/app/${unitType.toLowerCase()}` });
      }, 1500);
    } catch (err) {
      console.error('Error al actualizar:', err);
      setError(getApiErrorMessage(err, 'Error al actualizar el miembro.'));
    }
  };

  const goBack = () => navigate({ to: `/app/${unitType.toLowerCase()}` });
  const representante = memberData?.Representante;

  if (loading) {
    return (
      <div className="animate-fade-in-up pb-10 max-w-5xl mx-auto">
        <StateBlock estado="loading" filas={5} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in-up pb-10 max-w-5xl mx-auto">
      <PageHeader
        micro={
          <span className="tb-crumb">
            <button type="button" className="crumb" onClick={goBack}>
              <ArrowBack />
              Miembros
            </button>
            <span className="micro">/</span>
            <span className="micro">Editar</span>
          </span>
        }
        titulo={`Editar Miembro — ${unitLabel}`}
        subtitulo={`${memberData?.nombres ?? ''} ${memberData?.apellidos ?? ''}`.trim() || '—'}
      />

      {/* Messages */}
      {error && (
        <div className="banner banner-err" role="alert">
          <ErrorOutline />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="banner banner-ok" role="status">
          <CheckCircle />
          <div>
            <h4>Miembro actualizado correctamente</h4>
            <p>Redirigiendo al directorio en unos segundos…</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Sección 01: Datos del Miembro */}
        <div className="form-sect">
          <header>
            <div className="ic" aria-hidden="true">
              <Person />
            </div>
            <div>
              <span className="micro">Sección 01</span>
              <h3>Datos del Miembro</h3>
            </div>
          </header>

          <div className="form-grid">
            <div className="field">
              <label className="micro" htmlFor="me-nombres">
                Nombres<span className="req">*</span>
              </label>
              <input id="me-nombres" {...register('nombres')} className="inp" aria-invalid={!!errors.nombres} />
              {errors.nombres && <span className="field-err">{errors.nombres.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="me-apellidos">
                Apellidos<span className="req">*</span>
              </label>
              <input id="me-apellidos" {...register('apellidos')} className="inp" aria-invalid={!!errors.apellidos} />
              {errors.apellidos && <span className="field-err">{errors.apellidos.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="me-cedula">
                Cédula<span className="req">*</span>
              </label>
              <input id="me-cedula" {...register('cedula')} className="inp" aria-invalid={!!errors.cedula} />
              {errors.cedula && <span className="field-err">{errors.cedula.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="me-nacimiento">
                <CalendarMonth sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                Fecha de Nacimiento<span className="req">*</span>
              </label>
              <input
                id="me-nacimiento"
                {...register('fechaNacimiento')}
                type="date"
                className="inp"
                aria-invalid={!!errors.fechaNacimiento}
              />
              {errors.fechaNacimiento && (
                <span className="field-err">{errors.fechaNacimiento.message}</span>
              )}
            </div>
            <div className="field">
              <label className="micro" htmlFor="me-genero">
                <Wc sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                Género<span className="req">*</span>
              </label>
              <select id="me-genero" {...register('genero')} className="inp" aria-invalid={!!errors.genero}>
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
              </select>
              {errors.genero && <span className="field-err">{errors.genero.message}</span>}
            </div>
            <div className="field">
              <label className="micro" htmlFor="me-estado">
                Estado
              </label>
              <select id="me-estado" {...register('estado')} className="inp">
                <option value="ACTIVO">Activo</option>
                <option value="INACTIVO">Inactivo</option>
                <option value="EGRESADO">Egresado</option>
              </select>
            </div>
            <div className="field">
              <label className="micro" htmlFor="me-patrulla">
                {subUnitLabel}
              </label>
              <div className="inline-add">
                <select id="me-patrulla" {...register('patrullaId')} className="inp flex-1">
                  <option value="">Seleccionar {subUnitLabel}...</option>
                  {subUnidades.map(su => (
                    <option key={su.id} value={su.id}>{su.nombre}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setShowCreateSub(!showCreateSub)}
                  className="btn btn-soft"
                  aria-label={`Crear nueva ${subUnitLabel}`}
                  aria-expanded={showCreateSub}
                  title={`Crear nueva ${subUnitLabel}`}
                >
                  <Add />
                </button>
              </div>
              {showCreateSub && (
                <div className="inline-add mt-2">
                  <input
                    type="text"
                    value={newSubNombre}
                    onChange={(e) => setNewSubNombre(e.target.value)}
                    placeholder={`Nombre de la ${subUnitLabel.toLowerCase()}`}
                    className="inp flex-1"
                    aria-label={`Nombre de la ${subUnitLabel.toLowerCase()}`}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateSubUnit()}
                  />
                  <button
                    type="button"
                    onClick={handleCreateSubUnit}
                    disabled={creatingSub || !newSubNombre.trim()}
                    className="btn btn-primary"
                  >
                    {creatingSub ? '...' : 'Crear'}
                  </button>
                </div>
              )}
            </div>
            <div className="field">
              <label className="micro" htmlFor="me-ingreso">
                Fecha Ingreso Grupo
              </label>
              <input id="me-ingreso" {...register('fechaIngreso')} type="date" className="inp" />
            </div>
            <div className="field">
              <label className="micro" htmlFor="me-promesa">
                Fecha Promesa
              </label>
              <input id="me-promesa" {...register('fechaPromesa')} type="date" className="inp" />
            </div>
            <div className="field">
              <label className="micro" htmlFor="me-cargo">
                Cargo Actual
              </label>
              <input
                id="me-cargo"
                {...register('cargoActual')}
                type="text"
                className="inp"
                placeholder="Cargo en la unidad..."
              />
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label className="micro" htmlFor="me-historial">
                Observaciones / Historial
              </label>
              <textarea
                id="me-historial"
                {...register('historial')}
                rows={3}
                className="inp"
                placeholder="Antecedentes, alergias, notas relevantes…"
              />
            </div>
          </div>
        </div>

        {/* Sección 02: Representante (solo lectura) */}
        {representante && (
          <div className="form-sect">
            <header>
              <div className="ic" aria-hidden="true">
                <ContactPhone />
              </div>
              <div>
                <span className="micro">Solo lectura</span>
                <h3>Representante Asociado</h3>
              </div>
            </header>

            <div className="form-grid">
              <div className="field">
                <label className="micro" htmlFor="me-rep-nombre">Nombre</label>
                <input id="me-rep-nombre" className="inp" value={representante.nombre} disabled />
              </div>
              <div className="field">
                <label className="micro" htmlFor="me-rep-cedula">Cédula</label>
                <input id="me-rep-cedula" className="inp" value={representante.cedula} disabled />
              </div>
              <div className="field">
                <label className="micro" htmlFor="me-rep-telefono">Teléfono</label>
                <input id="me-rep-telefono" className="inp" value={representante.telefono || '—'} disabled />
              </div>
              <div className="field">
                <label className="micro" htmlFor="me-rep-parentesco">Parentesco</label>
                <input id="me-rep-parentesco" className="inp" value={representante.parentesco || '—'} disabled />
              </div>
              <div className="field" style={{ gridColumn: '1 / -1' }}>
                <label className="micro" htmlFor="me-rep-direccion">
                  <Home sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                  Dirección
                </label>
                <input id="me-rep-direccion" className="inp" value={representante.direccion || '—'} disabled />
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="form-actions">
          <button type="button" onClick={goBack} className="btn btn-ghost">
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || success}>
            <SaveAlt />
            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};
