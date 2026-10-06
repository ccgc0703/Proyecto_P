import 'dotenv/config';
import { PrismaService } from '../modules/prisma/prisma.service';

describe('soft-delete centralizado (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const marca = `UNIDAD-SOFT-${Date.now()}`;
    let unidadId: string;

    beforeAll(async () => {
        const unidad = await prisma.unidad.create({ data: { nombre: marca, tipo: marca } });
        unidadId = unidad.id;
    });

    afterAll(async () => {
        await prisma.unidad.delete({ where: { id: unidadId } }).catch(() => undefined);
        await prisma.onModuleDestroy();
    });

    it('las lecturas automaticas no devuelven el registro borrado', async () => {
        await prisma.unidad.update({ where: { id: unidadId }, data: { deletedAt: new Date() } });

        expect(await prisma.unidad.findMany({ where: { id: unidadId } })).toHaveLength(0);
        expect(await prisma.unidad.findFirst({ where: { id: unidadId } })).toBeNull();
        expect(await prisma.unidad.findUnique({ where: { id: unidadId } })).toBeNull();
        expect(await prisma.unidad.count({ where: { id: unidadId } })).toBe(0);
    });

    it('una consulta explicita de borrados sigue encontrandolo', async () => {
        const borrado = await prisma.unidad.findFirst({
            where: { id: unidadId, deletedAt: { not: null } },
        });
        expect(borrado).not.toBeNull();
        expect(borrado?.deletedAt).not.toBeNull();

        const conEscape = await prisma.unidad.findUnique({
            where: { id: unidadId, deletedAt: undefined },
        });
        expect(conEscape?.id).toBe(unidadId);
    });

    it('las escrituras operan sobre el registro borrado', async () => {
        await prisma.unidad.update({ where: { id: unidadId }, data: { deletedAt: null } });
        expect(await prisma.unidad.findUnique({ where: { id: unidadId } })).not.toBeNull();

        await prisma.unidad.update({ where: { id: unidadId }, data: { deletedAt: new Date() } });
        expect(await prisma.unidad.count({ where: { id: unidadId } })).toBe(0);
    });
});
