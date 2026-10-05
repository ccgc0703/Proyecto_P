import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateAreaDto } from './create-area.dto';
import { CreateIndicadorDto } from './create-indicador.dto';
import { CreateAdelantoDto } from './create-adelanto.dto';
import { QueryIndicadoresDto } from './query-catalogo.dto';

const UUID_OK = '11111111-1111-4111-8111-111111111111';

const properties = (errors: any[]) => errors.flatMap((e) => e.constraints ? Object.keys(e.constraints) : []);

describe('CreateAreaDto', () => {
    it('acepta una area valida', async () => {
        const dto = plainToInstance(CreateAreaDto, { nombre: '  Afectividad  ', orden: 4, tipo: 'AREA_CRECIMIENTO' });
        expect(await validate(dto)).toHaveLength(0);
        expect(dto.nombre).toBe('Afectividad');
    });

    it('rechaza el nombre vacio', async () => {
        const errors = await validate(plainToInstance(CreateAreaDto, { nombre: '   ', orden: 1 }));
        expect(properties(errors)).toContain('minLength');
    });

    it('rechaza un orden fuera de rango', async () => {
        const errors = await validate(plainToInstance(CreateAreaDto, { nombre: 'Corporalidad', orden: 0 }));
        expect(properties(errors)).toContain('min');
    });

    it('rechaza un tipo desconocido', async () => {
        const errors = await validate(
            plainToInstance(CreateAreaDto, { nombre: 'Corporalidad', orden: 1, tipo: 'OTRO' }),
        );
        expect(properties(errors)).toContain('isEnum');
    });
});

describe('CreateIndicadorDto', () => {
    const base = {
        codigo: 'a',
        texto: 'Presta atencion en las reuniones',
        etapaId: UUID_OK,
        areaId: UUID_OK,
        rama: 'MANADA',
        orden: 1,
    };

    it('acepta un indicador valido', async () => {
        expect(await validate(plainToInstance(CreateIndicadorDto, base))).toHaveLength(0);
    });

    it('acepta codigos numericos de hasta 4 caracteres', async () => {
        expect(await validate(plainToInstance(CreateIndicadorDto, { ...base, codigo: '13' }))).toHaveLength(0);
    });

    it('rechaza un codigo con caracteres especiales', async () => {
        const errors = await validate(plainToInstance(CreateIndicadorDto, { ...base, codigo: 'a-1' }));
        expect(properties(errors)).toContain('matches');
    });

    it('rechaza una rama desconocida', async () => {
        const errors = await validate(plainToInstance(CreateIndicadorDto, { ...base, rama: 'OTRA' }));
        expect(properties(errors)).toContain('isEnum');
    });

    it('rechaza un texto demasiado corto', async () => {
        const errors = await validate(plainToInstance(CreateIndicadorDto, { ...base, texto: 'oka' }));
        expect(properties(errors)).toContain('minLength');
    });
});

describe('CreateAdelantoDto', () => {
    const base = { nombre: 'Lobo Mayor', orden: 2, rama: 'MANADA' };

    it('acepta un adelanto con umbral', async () => {
        expect(
            await validate(plainToInstance(CreateAdelantoDto, { ...base, umbralPorcentaje: 70 })),
        ).toHaveLength(0);
    });

    it('acepta la prueba aislada sin umbral', async () => {
        expect(await validate(plainToInstance(CreateAdelantoDto, base))).toHaveLength(0);
    });

    it('rechaza una rama desconocida', async () => {
        const errors = await validate(plainToInstance(CreateAdelantoDto, { ...base, rama: 'OTRA' }));
        expect(properties(errors)).toContain('isEnum');
    });

    it('rechaza un umbral igual a 0', async () => {
        const errors = await validate(plainToInstance(CreateAdelantoDto, { ...base, umbralPorcentaje: 0 }));
        expect(properties(errors)).toContain('min');
    });

    it('rechaza un umbral mayor a 100', async () => {
        const errors = await validate(plainToInstance(CreateAdelantoDto, { ...base, umbralPorcentaje: 101 }));
        expect(properties(errors)).toContain('max');
    });
});

describe('QueryIndicadoresDto', () => {
    it('acepta filtros vacios', async () => {
        expect(await validate(plainToInstance(QueryIndicadoresDto, {}))).toHaveLength(0);
    });

    it('acepta los cinco filtros del plan', async () => {
        const dto = plainToInstance(QueryIndicadoresDto, {
            etapaId: UUID_OK,
            areaId: UUID_OK,
            unidadId: UUID_OK,
            rama: 'CLAN',
            search: 'sirviente',
        });
        expect(await validate(dto)).toHaveLength(0);
    });

    it('rechaza un UUID invalido', async () => {
        const errors = await validate(plainToInstance(QueryIndicadoresDto, { etapaId: '123' }));
        expect(properties(errors)).toContain('isUuid');
    });

    it('rechaza una rama desconocida', async () => {
        const errors = await validate(plainToInstance(QueryIndicadoresDto, { rama: 'RAMA' }));
        expect(properties(errors)).toContain('isEnum');
    });

    it('rechaza una busqueda demasiado larga', async () => {
        const errors = await validate(plainToInstance(QueryIndicadoresDto, { search: 'x'.repeat(201) }));
        expect(properties(errors)).toContain('maxLength');
    });
});
