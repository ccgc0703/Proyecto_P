import 'dotenv/config';
import { PrismaService } from '../modules/prisma/prisma.service';
import { RolesService } from '../modules/rbac/roles.service';

describe('RolesService (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const service = new RolesService(prisma);
    const nombre = `ROL-INTEG-${Date.now()}`;
    const sufijo = Date.now();

    let rolId: string;
    let permiso1: string;
    let permiso2: string;

    const permisosActivos = async (id: string) => {
        const filas = await prisma.rolPermiso.findMany({
            where: { rolId: id, deletedAt: null },
            select: { permisoId: true },
        });
        return filas.map((f) => f.permisoId).sort();
    };

    beforeAll(async () => {
        const p1 = await prisma.permiso.create({
            data: { accion: `integracion:1:${sufijo}`, modulo: 'integracion', descripcion: 'p1' },
        });
        const p2 = await prisma.permiso.create({
            data: { accion: `integracion:2:${sufijo}`, modulo: 'integracion', descripcion: 'p2' },
        });
        permiso1 = p1.id;
        permiso2 = p2.id;

        const rol = await service.createRole({ nombre, descripcion: 'Rol de integracion' });
        rolId = rol.id;
    });

    afterAll(async () => {
        await prisma.rolPermiso.deleteMany({ where: { rolId } });
        await prisma.usuarioRol.deleteMany({ where: { rolId } });
        await prisma.rol.deleteMany({ where: { id: rolId } });
        await prisma.permiso.deleteMany({ where: { id: { in: [permiso1, permiso2] } } });
        await prisma.onModuleDestroy();
    });

    it('reasigna un subconjunto y deja los demas permisos en soft-delete', async () => {
        await service.assignPermissions(rolId, [permiso1, permiso2]);
        expect(await permisosActivos(rolId)).toEqual([permiso1, permiso2].sort());

        await service.assignPermissions(rolId, [permiso1]);
        expect(await permisosActivos(rolId)).toEqual([permiso1]);

        const borrado = await prisma.rolPermiso.findFirst({
            where: { rolId, permisoId: permiso2, deletedAt: { not: null } },
        });
        expect(borrado).not.toBeNull();
    });

    it('recrea un rol borrado logicamente en lugar de duplicarlo', async () => {
        await prisma.rol.update({ where: { id: rolId }, data: { deletedAt: new Date(), activo: false } });

        const restaurado = await service.createRole({ nombre, descripcion: 'Rol de integracion' });
        expect(restaurado.id).toBe(rolId);
        expect(restaurado.deletedAt).toBeNull();

        expect(await prisma.rol.count({ where: { nombre } })).toBe(1);
    });
});
