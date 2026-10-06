import * as fs from 'fs';
import * as path from 'path';
import { crearExtensionSoftDelete, MODELOS_SOFT_DELETE, OPERACIONES_LECTURA } from './soft-delete';

describe('soft-delete centralizado', () => {
    const extension = crearExtensionSoftDelete();

    const ejecutar = (operation: string, model: string, args?: Record<string, any>) => {
        const query = jest.fn((a: any) => a);
        const resultado = (extension.query as any).$allOperations({ operation, model, args, query });
        return { resultado, query };
    };

    describe('MODELOS_SOFT_DELETE', () => {
        it('coincide exactamente con los modelos que tienen deletedAt en el schema', () => {
            const schema = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.prisma'), 'utf8');
            const bloques = schema.split(/\n(?=model )/);

            const conColumna: string[] = [];
            for (const bloque of bloques) {
                const nombre = bloque.match(/^model (\w+)/);
                if (nombre && bloque.includes('deletedAt')) conColumna.push(nombre[1]);
            }

            expect([...MODELOS_SOFT_DELETE].sort()).toEqual(conColumna.sort());
        });

        it('no declara modelos sin columna (Joven, Adulto, DatosScout, AuditLog, Permiso)', () => {
            const sinColumna = ['Joven', 'Adulto', 'DatosScout', 'AuditLog', 'Permiso'];
            for (const modelo of sinColumna) {
                expect(MODELOS_SOFT_DELETE as readonly string[]).not.toContain(modelo);
            }
        });
    });

    describe('$allOperations', () => {
        it('inyecta deletedAt: null en las lecturas de modelos protegidos', () => {
            for (const operation of OPERACIONES_LECTURA) {
                const { resultado } = ejecutar(operation, 'Unidad', { where: { tipo: 'MANADA' } });
                expect(resultado.where).toEqual({ tipo: 'MANADA', deletedAt: null });
            }
        });

        it('crea el where cuando la operacion no trae uno (count sin filtros)', () => {
            const { resultado } = ejecutar('count', 'Usuario', {});
            expect(resultado.where).toEqual({ deletedAt: null });
        });

        it('no toca a los modelos sin columna', () => {
            const { resultado } = ejecutar('findMany', 'Joven', { where: { historial: 'x' } });
            expect(resultado.where).toEqual({ historial: 'x' });
        });

        it('no toca las escrituras', () => {
            const { resultado } = ejecutar('update', 'Miembro', { where: { id: 'm1' }, data: { nombres: 'A' } });
            expect(resultado.where).toEqual({ id: 'm1' });

            const { resultado: borrado } = ejecutar('delete', 'Rol', { where: { id: 'r1' } });
            expect(borrado.where).toEqual({ id: 'r1' });
        });

        it('respeta un filtro deletedAt explicito (activo o en cualquier estado)', () => {
            const { resultado: nulo } = ejecutar('findMany', 'Rol', { where: { deletedAt: null } });
            expect(nulo.where).toEqual({ deletedAt: null });

            const { resultado: borrados } = ejecutar('findMany', 'Rol', { where: { deletedAt: { not: null } } });
            expect(borrados.where).toEqual({ deletedAt: { not: null } });
        });

        it('permite el escape hatch deletedAt: undefined para leer tambien los borrados', () => {
            const { resultado } = ejecutar('findFirst', 'Rol', { where: { nombre: 'X', deletedAt: undefined } });
            expect(resultado.where).toEqual({ nombre: 'X', deletedAt: undefined });
            expect('deletedAt' in resultado.where).toBe(true);
        });

        it('siempre delega la consulta en query()', () => {
            const { query, resultado } = ejecutar('findMany', 'Unidad', { where: {} });
            expect(query).toHaveBeenCalledTimes(1);
            expect(query).toHaveBeenCalledWith(resultado);
        });
    });
});
