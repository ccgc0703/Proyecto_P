import 'dotenv/config';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import {
    NotificacionesService,
    TIPOS_NOTIFICACION,
} from '../modules/notificaciones/notificaciones.service';

describe('NotificacionesService (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const service = new NotificacionesService(prisma);

    const sufijo = Date.now().toString().slice(-8);
    const emailAdulto = `notif-adulto-${sufijo}@test.com`;
    const emailAdmin = `notif-admin-${sufijo}@test.com`;

    let unidadId: string;
    let adultoId: string;
    let adminId: string;
    /** Roles que este test tuvo que crear (y debe borrar al terminar). */
    const rolesCreados: string[] = [];

    /** Devuelve el id de un rol existente o lo crea (idempotente por nombre). */
    const ensureRol = async (nombre: string): Promise<string> => {
        const existente = await prisma.rol.findFirst({
            where: { nombre, deletedAt: null },
        });
        if (existente) return existente.id;
        rolesCreados.push(nombre);
        const creado = await prisma.rol.create({
            data: { nombre, descripcion: 'Rol de prueba del test de notificaciones' },
        });
        return creado.id;
    };

    beforeAll(async () => {
        const unidad = await prisma.unidad.create({
            data: { nombre: `U-NOTIF-${sufijo}` },
        });
        unidadId = unidad.id;

        const rolAdulto = await ensureRol('ADULTO_TROPA');
        const rolAdmin = await ensureRol('SYSTEM_ADMIN');

        const adulto = await prisma.usuario.create({
            data: {
                nombre: 'Adulto',
                apellido: 'Notif',
                email: emailAdulto,
                password: 'x',
                activo: true,
                unidadId,
            },
        });
        adultoId = adulto.id;
        await prisma.usuarioRol.create({ data: { usuarioId: adultoId, rolId: rolAdulto } });

        const admin = await prisma.usuario.create({
            data: {
                nombre: 'Admin',
                apellido: 'Notif',
                email: emailAdmin,
                password: 'x',
                activo: true,
            },
        });
        adminId = admin.id;
        await prisma.usuarioRol.create({ data: { usuarioId: adminId, rolId: rolAdmin } });
    });

    it('responsablesUnidad devuelve al adulto de la unidad y a los SYSTEM_ADMIN', async () => {
        const ids = await service.responsablesUnidad(unidadId);

        expect(ids).toContain(adultoId);
        expect(ids).toContain(adminId);
        // Sin duplicados (el admin puede aparecer en ambas ramas)
        expect(new Set(ids).size).toBe(ids.length);
    });

    it('publicar crea notificaciones y descarta ids fantasma', async () => {
        await service.publicar(
            [adultoId, adultoId, 'id-fantasma'],
            TIPOS_NOTIFICACION.CUENTA_CREADA,
            'Cuenta creada',
            'Mensaje de prueba',
            '/app',
        );

        const filas = await prisma.notificacion.findMany({
            where: { usuarioId: adultoId, tipo: TIPOS_NOTIFICACION.CUENTA_CREADA },
        });
        expect(filas).toHaveLength(1);
        expect(filas[0].link).toBe('/app');
        expect(
            await prisma.notificacion.count({ where: { usuarioId: 'id-fantasma' } }),
        ).toBe(0);
    });

    it('listar solo devuelve las notificaciones propias con su badge', async () => {
        await service.publicar(
            [adminId],
            TIPOS_NOTIFICACION.CARGO_ASIGNADO,
            'Cargo asignado',
            'Te designaron en la estructura',
            '/app/estructura',
        );

        const delAdulto = await service.listar(adultoId);
        expect(delAdulto.items.length).toBeGreaterThan(0);
        expect(delAdulto.items.every((n) => n.usuarioId === adultoId)).toBe(true);
        expect(delAdulto.noLeidas).toBe(1);

        const delAdmin = await service.listar(adminId);
        expect(delAdmin.items.every((n) => n.usuarioId === adminId)).toBe(true);
        expect(delAdmin.noLeidas).toBe(1);
    });

    it('marcarLeida exige propiedad (404 si es ajena) y es idempotente', async () => {
        const [propia] = await prisma.notificacion.findMany({
            where: { usuarioId: adultoId },
        });

        await expect(service.marcarLeida(adminId, propia.id)).rejects.toThrow(
            NotFoundException,
        );

        const marcada = await service.marcarLeida(adultoId, propia.id);
        expect(marcada.leidaEn).not.toBeNull();

        const otraVez = await service.marcarLeida(adultoId, propia.id);
        expect(otraVez.leidaEn).toEqual(marcada.leidaEn);
    });

    it('marcarTodas deja el badge del usuario en cero', async () => {
        await service.publicar(
            [adultoId],
            TIPOS_NOTIFICACION.FICHA_MEDICA_ALTA,
            'Ficha médica',
            'Alta registrada',
            '/app/miembros',
        );
        expect((await service.listar(adultoId)).noLeidas).toBe(1);

        const marcadas = await service.marcarTodas(adultoId);
        expect(marcadas).toBe(1);
        expect((await service.listar(adultoId)).noLeidas).toBe(0);
    });

    afterAll(async () => {
        await prisma.notificacion.deleteMany({
            where: { usuarioId: { in: [adultoId, adminId] } },
        });
        await prisma.usuarioRol.deleteMany({
            where: { usuarioId: { in: [adultoId, adminId] } },
        });
        await prisma.usuario.deleteMany({ where: { id: { in: [adultoId, adminId] } } });
        if (rolesCreados.length > 0) {
            await prisma.rol.deleteMany({ where: { nombre: { in: rolesCreados } } });
        }
        await prisma.unidad.deleteMany({ where: { id: unidadId } });
        await prisma.$disconnect();
    });
});
