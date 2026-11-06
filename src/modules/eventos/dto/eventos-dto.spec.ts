// Debe ser el primer import: los DTOs con @Type() de class-transformer
// necesitan el polyfill Reflect.getMetadata de reflect-metadata.
import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePlanificacionDto } from './create-planificacion.dto';
import { CreateActividadDto } from './create-actividad.dto';
import { AsistenciaBulkDto } from './asistencia-bulk.dto';
import { UpdateAsistenciaDto } from './update-asistencia.dto';
import { QueryActividadesDto } from './query-eventos.dto';

const UUID_OK = '11111111-1111-4111-8111-111111111111';

// Recorre el arbol de errores: en arrays anidados (AsistenciaBulkDto) las
// constraints viven en los hijos, no en el error raiz.
const properties = (errors: any[]): string[] =>
    errors.flatMap((e) => [
        ...(e.constraints ? Object.keys(e.constraints) : []),
        ...properties(e.children ?? []),
    ]);

describe('CreatePlanificacionDto', () => {
    const base = { titulo: 'Semana 1 de marzo', fechaInicio: '2026-03-01', fechaFin: '2026-03-07' };

    it('acepta una planificacion valida', async () => {
        expect(await validate(plainToInstance(CreatePlanificacionDto, base))).toHaveLength(0);
    });

    it('acepta planificacion de ambito grupo (sin unidadId)', async () => {
        expect(await validate(plainToInstance(CreatePlanificacionDto, base))).toHaveLength(0);
    });

    it('rechaza un titulo demasiado corto', async () => {
        const errors = await validate(plainToInstance(CreatePlanificacionDto, { ...base, titulo: 'x' }));
        expect(properties(errors)).toContain('minLength');
    });

    it('rechaza una fecha inicio invalida', async () => {
        const errors = await validate(
            plainToInstance(CreatePlanificacionDto, { ...base, fechaInicio: 'ayer' }),
        );
        expect(properties(errors)).toContain('isIso8601');
    });

    it('rechaza una fecha fin anterior a la inicio se valida como fecha (solo formato)', async () => {
        // La regla de negocio (fin >= inicio) la valida el service; el DTO solo exige formato ISO.
        const errors = await validate(
            plainToInstance(CreatePlanificacionDto, { ...base, fechaFin: '2026-02-01' }),
        );
        expect(errors).toHaveLength(0);
    });

    it('rechaza un estado desconocido', async () => {
        const errors = await validate(
            plainToInstance(CreatePlanificacionDto, { ...base, estado: 'LISTO' }),
        );
        expect(properties(errors)).toContain('isEnum');
    });

    it('rechaza un unidadId que no sea UUID', async () => {
        const errors = await validate(
            plainToInstance(CreatePlanificacionDto, { ...base, unidadId: 'no-uuid' }),
        );
        expect(properties(errors)).toContain('isUuid');
    });
});

describe('CreateActividadDto', () => {
    const base = { titulo: 'Reunion semanal', fecha: '2026-03-05' };

    it('acepta una actividad valida', async () => {
        expect(await validate(plainToInstance(CreateActividadDto, base))).toHaveLength(0);
    });

    it('acepta horas en formato HH:MM', async () => {
        const dto = plainToInstance(CreateActividadDto, { ...base, horaInicio: '16:30', horaFin: '18:00' });
        expect(await validate(dto)).toHaveLength(0);
    });

    it('rechaza una hora con formato invalido', async () => {
        const errors = await validate(
            plainToInstance(CreateActividadDto, { ...base, horaInicio: '4pm' }),
        );
        expect(properties(errors)).toContain('matches');
    });

    it('rechaza un tipo de actividad desconocido', async () => {
        const errors = await validate(
            plainToInstance(CreateActividadDto, { ...base, tipo: 'FIESTA' }),
        );
        expect(properties(errors)).toContain('isEnum');
    });

    it('rechaza una fecha invalida', async () => {
        const errors = await validate(plainToInstance(CreateActividadDto, { ...base, fecha: 'manana' }));
        expect(properties(errors)).toContain('isIso8601');
    });

    it('rechaza un titulo demasiado largo', async () => {
        const errors = await validate(
            plainToInstance(CreateActividadDto, { ...base, titulo: 'x'.repeat(121) }),
        );
        expect(properties(errors)).toContain('maxLength');
    });
});

describe('AsistenciaBulkDto', () => {
    it('acepta una planilla valida', async () => {
        const dto = plainToInstance(AsistenciaBulkDto, {
            registros: [
                { miembroId: UUID_OK, estado: 'PRESENTE' },
                { miembroId: UUID_OK, estado: 'JUSTIFICADO', observacion: 'Cita medica' },
            ],
        });
        expect(await validate(dto)).toHaveLength(0);
    });

    it('rechaza la planilla vacia', async () => {
        const errors = await validate(plainToInstance(AsistenciaBulkDto, { registros: [] }));
        expect(properties(errors)).toContain('arrayMinSize');
    });

    it('rechaza un estado desconocido', async () => {
        const errors = await validate(
            plainToInstance(AsistenciaBulkDto, { registros: [{ miembroId: UUID_OK, estado: 'TAL_VEZ' }] }),
        );
        expect(properties(errors)).toContain('isEnum');
    });

    it('rechaza un miembroId que no sea UUID', async () => {
        const errors = await validate(
            plainToInstance(AsistenciaBulkDto, { registros: [{ miembroId: 'x', estado: 'PRESENTE' }] }),
        );
        expect(properties(errors)).toContain('isUuid');
    });

    it('rechaza una observacion demasiado larga', async () => {
        const errors = await validate(
            plainToInstance(AsistenciaBulkDto, {
                registros: [{ miembroId: UUID_OK, estado: 'AUSENTE', observacion: 'x'.repeat(241) }],
            }),
        );
        expect(properties(errors)).toContain('maxLength');
    });
});

describe('UpdateAsistenciaDto', () => {
    it('acepta solo el estado', async () => {
        expect(await validate(plainToInstance(UpdateAsistenciaDto, { estado: 'AUSENTE' }))).toHaveLength(0);
    });

    it('acepta objeto vacio (nada que actualizar)', async () => {
        expect(await validate(plainToInstance(UpdateAsistenciaDto, {}))).toHaveLength(0);
    });

    it('rechaza un estado desconocido', async () => {
        const errors = await validate(plainToInstance(UpdateAsistenciaDto, { estado: 'OLVIDO' }));
        expect(properties(errors)).toContain('isEnum');
    });
});

describe('QueryActividadesDto', () => {
    it('acepta filtros vacios', async () => {
        expect(await validate(plainToInstance(QueryActividadesDto, {}))).toHaveLength(0);
    });

    it('acepta el rango de fechas completo', async () => {
        const dto = plainToInstance(QueryActividadesDto, {
            desde: '2026-03-01T00:00:00.000Z',
            hasta: '2026-03-31T23:59:59.999Z',
            tipo: 'REUNION',
            estado: 'COMPLETADA',
            planificacionId: UUID_OK,
            unidadId: UUID_OK,
        });
        expect(await validate(dto)).toHaveLength(0);
    });

    it('rechaza un planificacionId que no sea UUID', async () => {
        const errors = await validate(plainToInstance(QueryActividadesDto, { planificacionId: 'abc' }));
        expect(properties(errors)).toContain('isUuid');
    });

    it('rechaza un estado desconocido', async () => {
        const errors = await validate(plainToInstance(QueryActividadesDto, { estado: 'VENCIDA' }));
        expect(properties(errors)).toContain('isEnum');
    });

    it('rechaza un desde que no sea fecha ISO', async () => {
        const errors = await validate(plainToInstance(QueryActividadesDto, { desde: 'ayer' }));
        expect(properties(errors)).toContain('isIso8601');
    });
});
