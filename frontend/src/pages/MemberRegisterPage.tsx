import { useState, useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowBack,
  ArrowForward,
  Person,
  ContactPhone,
  Home,
  Badge,
  Wc,
  CalendarMonth,
  SaveAlt,
  Add,
  ErrorOutline,
} from '@mui/icons-material';
import { miembrosApi, administrativoApi, unidadesApi } from '../api';
import { UnidadEntity } from '../types/member';
import { getApiErrorMessage } from '../utils/errors';
import { PageHeader } from '../components/ui';

const registerSchema = z.object({
  // Datos Personales
  nombres: z.string().min(2, 'Mínimo 2 caracteres'),
  apellidos: z.string().min(2, 'Mínimo 2 caracteres'),
  cedula: z.string().min(5, 'Cédula requerida'),
  fechaNacimiento: z.string().min(1, 'Fecha requerida'),
  genero: z.enum(['MASCULINO', 'FEMENINO'], {
    errorMap: () => ({ message: 'Selecciona el género' }),
  }),
  historial: z.string().optional(),
  // Representante
  repNombre: z.string().min(2, 'Nombre del representante requerido'),
  repCedula: z.string().min(5, 'Cédula del representante requerida'),
  repTelefono: z.string().optional(),
  repDireccion: z.string().optional(),
  repParentesco: z.string().min(1, 'Parentesco requerido'),
  // Datos Scout
  fechaIngreso: z.string().optional(),
  fechaPromesa: z.string().optional(),
  cargoActual: z.string().optional(),
  patrullaId: z.string().optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

interface MemberRegisterPageProps {
  unitType: string;
  unitLabel: string;
}

export const MemberRegisterPage = ({ unitType, unitLabel }: MemberRegisterPageProps) => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [subUnidades, setSubUnidades] = useState<UnidadEntity[]>([]);
  const [isLoadingSub, setIsLoadingSub] = useState(false);
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
        setIsLoadingSub(true);
        const unidades = await unidadesApi.getAll();
        const unidad = (unidades as UnidadEntity[]).find((u) =>
          u.nombre?.toLowerCase() === unitType.toLowerCase()
        );
        if (unidad) {
          const list = await unidadesApi.getPatrullas(unidad.id);
          setSubUnidades(list);
        }
      } catch (err) {
        console.error('Error fetching sub-units:', err);
      } finally {
        setIsLoadingSub(false);
      }
    };
    fetchSubUnits();
  }, [unitType]);

  const handleCreateSubUnit = async () => {
    if (!newSubNombre.trim()) return;
    try {
      setCreatingSub(true);
      const unidades = await unidadesApi.getAll();
      const unidad = (unidades as UnidadEntity[]).find((u) =>
        u.nombre?.toLowerCase() === unitType.toLowerCase()
      );
      if (!unidad) return;

      const created = await unidadesApi.createPatrulla(unidad.id, { nombre: newSubNombre.trim() });
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
    trigger,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { genero: undefined },
  });

  const handleNextStep = async () => {
    const valid = await trigger([
      'nombres', 'apellidos', 'cedula', 'fechaNacimiento', 'genero',
      'repNombre', 'repCedula', 'repParentesco',
    ]);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setError(null);

      // 1. Crear o encontrar representante
      const representante = await administrativoApi.createRepresentante({
        nombre: data.repNombre,
        cedula: data.repCedula,
        telefono: data.repTelefono || null,
        direccion: data.repDireccion || null,
        parentesco: data.repParentesco,
      });

      // 2. Obtener unidadId
      const unidades = await unidadesApi.getAll();
      const unidad = (unidades as UnidadEntity[]).find((u) =>
        u.nombre?.toLowerCase() === unitType.toLowerCase()
      );
      if (!unidad) {
        setError('No se encontró la unidad en el sistema. Regístrala primero.');
        return;
      }

      // 3. Crear miembro
      const miembro = await miembrosApi.create({
        nombres: data.nombres,
        apellidos: data.apellidos,
        cedula: data.cedula,
        fechaNacimiento: data.fechaNacimiento,
        genero: data.genero,
        unidadId: unidad.id,
        representanteId: representante.id,
        historial: data.historial || null,
        fechaIngreso: data.fechaIngreso || null,
        fechaPromesa: data.fechaPromesa || null,
        cargoActual: data.cargoActual || null,
        patrullaId: data.patrullaId || null,
      });

      // 4. Crear ficha médica básica
      try {
        await administrativoApi.createFichaMedica({ miembroId: miembro.id });
      } catch {
        // No bloqueante
      }

      // 5. Redirigir al dashboard de la unidad
      navigate({ to: `/app/${unitType.toLowerCase()}` });
    } catch (err) {
      console.error('Error en el registro:', err);
      setError(getApiErrorMessage(err, 'Error al registrar el miembro. Verifica los datos.'));
    }
  };

  const goBack = () => navigate({ to: `/app/${unitType.toLowerCase()}` });

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
            <span className="micro">Nuevo registro</span>
          </span>
        }
        titulo={`Nuevo Registro — ${unitLabel}`}
        subtitulo="Formulario de inscripción de miembro"
      />

      {/* Indicador de pasos */}
      <div className="wiz-steps" role="tablist" aria-label="Pasos del registro">
        <button
          type="button"
          role="tab"
          aria-selected={step === 1}
          aria-current={step === 1 ? 'step' : undefined}
          className={`wiz-step${step === 1 ? ' on' : step === 2 ? ' done' : ''}`}
          onClick={() => setStep(1)}
        >
          <span className="n">1</span>
          <span>
            Datos Personales y Representante
            <span className="dsc">Identidad y contacto</span>
          </span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={step === 2}
          aria-current={step === 2 ? 'step' : undefined}
          className={`wiz-step${step === 2 ? ' on' : ''}`}
          onClick={handleNextStep}
        >
          <span className="n">2</span>
          <span>
            Datos Scout
            <span className="dsc">Unidad y progresión</span>
          </span>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="banner banner-err" role="alert">
          <ErrorOutline />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {step === 1 && (
          <>
            {/* Sección 01: Datos Personales del Miembro */}
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
                  <label className="micro" htmlFor="mr-nombres">
                    Nombres<span className="req">*</span>
                  </label>
                  <input
                    id="mr-nombres"
                    {...register('nombres')}
                    className="inp"
                    placeholder="Ej: Juan Carlos"
                    aria-invalid={!!errors.nombres}
                  />
                  {errors.nombres && <span className="field-err">{errors.nombres.message}</span>}
                </div>
                <div className="field">
                  <label className="micro" htmlFor="mr-apellidos">
                    Apellidos<span className="req">*</span>
                  </label>
                  <input
                    id="mr-apellidos"
                    {...register('apellidos')}
                    className="inp"
                    placeholder="Ej: Rodríguez Pérez"
                    aria-invalid={!!errors.apellidos}
                  />
                  {errors.apellidos && <span className="field-err">{errors.apellidos.message}</span>}
                </div>
                <div className="field">
                  <label className="micro" htmlFor="mr-cedula">
                    Cédula de Identidad<span className="req">*</span>
                  </label>
                  <input
                    id="mr-cedula"
                    {...register('cedula')}
                    className="inp"
                    placeholder="V-12.345.678"
                    aria-invalid={!!errors.cedula}
                  />
                  {errors.cedula && <span className="field-err">{errors.cedula.message}</span>}
                </div>
                <div className="field">
                  <label className="micro" htmlFor="mr-nacimiento">
                    <CalendarMonth sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                    Fecha de Nacimiento<span className="req">*</span>
                  </label>
                  <input
                    id="mr-nacimiento"
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
                  <label className="micro" htmlFor="mr-genero">
                    <Wc sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                    Género<span className="req">*</span>
                  </label>
                  <select id="mr-genero" {...register('genero')} className="inp" aria-invalid={!!errors.genero}>
                    <option value="">Seleccionar...</option>
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMENINO">Femenino</option>
                  </select>
                  {errors.genero && <span className="field-err">{errors.genero.message}</span>}
                </div>
              </div>
            </div>

            {/* Sección 02: Representante */}
            <div className="form-sect">
              <header>
                <div className="ic" aria-hidden="true">
                  <ContactPhone />
                </div>
                <div>
                  <span className="micro">Sección 02</span>
                  <h3>Datos del Representante</h3>
                </div>
              </header>

              <div className="form-grid">
                <div className="field">
                  <label className="micro" htmlFor="mr-rep-nombre">
                    Nombre Completo<span className="req">*</span>
                  </label>
                  <input
                    id="mr-rep-nombre"
                    {...register('repNombre')}
                    className="inp"
                    placeholder="Ej: María Rodríguez"
                    aria-invalid={!!errors.repNombre}
                  />
                  {errors.repNombre && <span className="field-err">{errors.repNombre.message}</span>}
                </div>
                <div className="field">
                  <label className="micro" htmlFor="mr-rep-cedula">
                    Cédula<span className="req">*</span>
                  </label>
                  <input
                    id="mr-rep-cedula"
                    {...register('repCedula')}
                    className="inp"
                    placeholder="V-9.876.543"
                    aria-invalid={!!errors.repCedula}
                  />
                  {errors.repCedula && <span className="field-err">{errors.repCedula.message}</span>}
                </div>
                <div className="field">
                  <label className="micro" htmlFor="mr-rep-parentesco">
                    Parentesco<span className="req">*</span>
                  </label>
                  <select
                    id="mr-rep-parentesco"
                    {...register('repParentesco')}
                    className="inp"
                    aria-invalid={!!errors.repParentesco}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="PADRE">Padre</option>
                    <option value="MADRE">Madre</option>
                    <option value="ABUELO/A">Abuelo/a</option>
                    <option value="TIO/A">Tío/a</option>
                    <option value="HERMANO/A">Hermano/a</option>
                    <option value="OTRO">Otro</option>
                  </select>
                  {errors.repParentesco && (
                    <span className="field-err">{errors.repParentesco.message}</span>
                  )}
                </div>
                <div className="field">
                  <label className="micro" htmlFor="mr-rep-telefono">
                    Teléfono
                  </label>
                  <input
                    id="mr-rep-telefono"
                    {...register('repTelefono')}
                    className="inp"
                    placeholder="+58 412 000 0000"
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="micro" htmlFor="mr-rep-direccion">
                    <Home sx={{ fontSize: 12, verticalAlign: 'middle', marginRight: 4 }} />
                    Dirección
                  </label>
                  <input
                    id="mr-rep-direccion"
                    {...register('repDireccion')}
                    className="inp"
                    placeholder="Calle, ciudad, estado"
                  />
                </div>
              </div>
            </div>

            {/* Control: Siguiente */}
            <div className="form-actions">
              <button type="button" onClick={goBack} className="btn btn-ghost">
                Cancelar
              </button>
              <button type="button" onClick={handleNextStep} className="btn btn-primary">
                Siguiente: Datos Scout
                <ArrowForward />
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {/* Sección 03: Datos Scout */}
            <div className="form-sect">
              <header>
                <div className="ic" aria-hidden="true">
                  <Badge />
                </div>
                <div>
                  <span className="micro">Sección 03</span>
                  <h3>Datos Scout</h3>
                </div>
              </header>

              <div className="form-grid">
                <div className="field">
                  <label className="micro" htmlFor="mr-unidad">
                    Unidad Asignada
                  </label>
                  <input id="mr-unidad" type="text" value={unitLabel} disabled className="inp" />
                </div>
                <div className="field">
                  <label className="micro" htmlFor="mr-patrulla">
                    {subUnitLabel}
                  </label>
                  <div className="inline-add">
                    <select
                      id="mr-patrulla"
                      {...register('patrullaId')}
                      className="inp flex-1"
                      aria-invalid={!!errors.patrullaId}
                    >
                      <option value="">Seleccionar {subUnitLabel}...</option>
                      {subUnidades.map(su => (
                        <option key={su.id} value={su.id}>{su.nombre}</option>
                      ))}
                      {subUnidades.length === 0 && !isLoadingSub && (
                        <option disabled>No hay {subUnitLabel.toLowerCase()}s registradas</option>
                      )}
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
                  {errors.patrullaId && (
                    <span className="field-err">{errors.patrullaId.message}</span>
                  )}
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
                  <label className="micro" htmlFor="mr-ingreso">
                    Fecha de Ingreso al Grupo
                  </label>
                  <input id="mr-ingreso" {...register('fechaIngreso')} type="date" className="inp" />
                </div>
                <div className="field">
                  <label className="micro" htmlFor="mr-promesa">
                    Fecha de Promesa
                  </label>
                  <input id="mr-promesa" {...register('fechaPromesa')} type="date" className="inp" />
                </div>
                <div className="field">
                  <label className="micro" htmlFor="mr-cargo">
                    Cargo en la Unidad
                  </label>
                  <input
                    id="mr-cargo"
                    {...register('cargoActual')}
                    type="text"
                    className="inp"
                    placeholder="Ej: Guía de patrulla, Sub-guía, etc."
                  />
                </div>
                <div className="field" style={{ gridColumn: '1 / -1' }}>
                  <label className="micro" htmlFor="mr-historial">
                    Observaciones / Historial
                  </label>
                  <textarea
                    id="mr-historial"
                    {...register('historial')}
                    rows={3}
                    className="inp"
                    placeholder="Antecedentes, alergias, notas relevantes…"
                  />
                </div>
              </div>
            </div>

            {/* Resumen Rápido */}
            <div className="form-sect">
              <header>
                <div className="ic" aria-hidden="true">
                  <SaveAlt />
                </div>
                <div>
                  <span className="micro">Resumen</span>
                  <h3>Resumen del Registro</h3>
                </div>
              </header>
              <div className="resumen-box">
                <div className="resumen-row">
                  <span>Miembro</span>
                  <b>{getValues('nombres')} {getValues('apellidos')}</b>
                </div>
                <div className="resumen-row">
                  <span>C.I.</span>
                  <b>{getValues('cedula')}</b>
                </div>
                <div className="resumen-row">
                  <span>Representante</span>
                  <b>{getValues('repNombre')}</b>
                </div>
                <div className="resumen-row">
                  <span>Unidad</span>
                  <b>{unitLabel}</b>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="form-actions">
              <button type="button" onClick={() => setStep(1)} className="btn btn-ghost">
                <ArrowBack />
                Volver
              </button>
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                <SaveAlt />
                {isSubmitting ? 'Registrando...' : 'Confirmar Registro'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
};
