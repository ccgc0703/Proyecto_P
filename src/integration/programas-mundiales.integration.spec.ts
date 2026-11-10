import 'dotenv/config';
import { EstadoProgramaMundial } from '@prisma/client';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AuditService } from '../modules/audit/audit.service';
import {
    ProgramasMundialesService,
    Actor,
} from '../modules/programas-mundiales/programas-mundiales.service';
import { UnitPolicy } from '../common/policies/unit.policy';
import { NodoPolicy } from '../common/policies/nodo.policy';

describe('ProgramasMundialesService (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const service = new ProgramasMundialesService(
        prisma,
        new AuditService(prisma),
        new UnitPolicy(new NodoPolicy(prisma)),
    );

    const sufijo = Date.now().toString().slice(-8);
    let actor: Actor;
    let unidadId: string;
    let otraUnidadId: string;
    let miembroId: string;
    let programaId: string;
    let programaInactivoId: string;
    let inscripcionId: string;

    beforeAll(async () => {
        const unidad = await prisma.unidad.findFirst({ where: { deletedAt: null } });
        if (!unidad) throw new Error('El test requiere al menos una unidad sembrada');
        unidadId = unidad.id;

        const otraUnidad = await prisma.unidad.create({
            data: { nombre: `Unidad programas ${sufijo}` },
        });
        otraUnidadId = otraUnidad.id;

        const usuario = await prisma.usuario.create({
            data: {
                nombre: 'Integracion Programas',
                email: `programas-integracion-${sufijo}@test.com`,
                password: 'no-usada',
            },
        });
        actor = { id: usuario.id, roles: ['SYSTEM_ADMIN'] };

        const miembro = await prisma.miembro.create({
            data: {
                nombres: 'Joven',
                apellidos: `Programas ${sufijo}`,
                cedula: `PM-${sufijo}`,
                fechaNacimiento: new Date('2011-04-12'),
                genero: 'FEMENINO',
                tipo: 'JOVEN',
                unidadId,
            },
        });
        miembroId = miembro.id;

        const programa = await prisma.programaMundial.create({
            data: {
                nombre: `Jamboree ${sufijo}`,
                tipo: 'PROGRAMA_MUNDIAL',
                descripcion: 'Programa de integración',
            },
        });
        programaId = programa.id;

        const inactivo = await prisma.programaMundial.create({
            data: { nombre: `Inactivo ${sufijo}`, tipo: 'DESAFIO', activo: false },
        });
        programaInactivoId = inactivo.id;
    });

    afterAll(async () => {
        await prisma.auditLog.deleteMany({ where: { module: 'programas-mundiales' } });
        await prisma.miembroProgramaMundial.deleteMany({ where: { miembroId } });
        await prisma.programaMundial.deleteMany({
            where: { id: { in: [programaId, programaInactivoId] } },
        });
        await prisma.miembro.delete({ where: { id: miembroId } });
        await prisma.unidad.delete({ where: { id: otraUnidadId } });
        await prisma.usuario.delete({ where: { id: actor.id } });
        await prisma.onModuleDestroy();
    });

    it('enlaza un programa al miembro con sus fechas y estado', async () => {
        const inscripcion = await service.crear(
            {
                miembroId,
                programaMundialId: programaId,
                fechaInicio: '2024-02-01',
                estado: EstadoProgramaMundial.EN_CURSO,
            },
            actor,
        );
        inscripcionId = inscripcion.id;

        expect(inscripcion.miembroId).toBe(miembroId);
        expect(inscripcion.fechaInicio).toEqual(new Date('2024-02-01'));
        expect(inscripcion.estado).toBe(EstadoProgramaMundial.EN_CURSO);
        expect(inscripcion.ProgramaMundial.nombre).toBe(`Jamboree ${sufijo}`);
    });

    it('audita el enlace', async () => {
        const eventos = await prisma.auditLog.findMany({
            where: { module: 'programas-mundiales', targetId: inscripcionId },
        });
        expect(eventos.some((e) => e.action === 'PROGRAMA_MUNDIAL_CREATED')).toBe(true);
    });

    it('lista el catálogo solo con programas activos', async () => {
        const catalogo = await service.findAllCatalog();
        const ids = catalogo.map((p) => p.id);

        expect(ids).toContain(programaId);
        expect(ids).not.toContain(programaInactivoId);
    });

    it('recupera los programas del miembro', async () => {
        const lista = await service.findByMiembro(miembroId, actor);
        expect(lista.map((i) => i.id)).toContain(inscripcionId);
    });

    it('no permite duplicar el enlace', async () => {
        await expect(
            service.crear({ miembroId, programaMundialId: programaId, fechaInicio: '2024-05-01' }, actor),
        ).rejects.toThrow('El miembro ya tiene ese programa mundial registrado');
    });

    it('rechaza programas inactivos del catálogo', async () => {
        await expect(
            service.crear(
                { miembroId, programaMundialId: programaInactivoId, fechaInicio: '2024-05-01' },
                actor,
            ),
        ).rejects.toThrow('Programa mundial no encontrado o inactivo');
    });

    it('exige fechaCompletado al marcar COMPLETADO', async () => {
        await expect(
            service.actualizar(inscripcionId, { estado: EstadoProgramaMundial.COMPLETADO }, actor),
        ).rejects.toThrow('Un programa COMPLETADO requiere fechaCompletado');
    });

    it('completa el programa y audita la actualización', async () => {
        const actualizada = await service.actualizar(
            inscripcionId,
            { estado: EstadoProgramaMundial.COMPLETADO, fechaCompletado: '2024-06-20' },
            actor,
        );

        expect(actualizada.estado).toBe(EstadoProgramaMundial.COMPLETADO);
        expect(actualizada.fechaCompletado).toEqual(new Date('2024-06-20'));

        const eventos = await prisma.auditLog.findMany({
            where: { module: 'programas-mundiales', targetId: inscripcionId },
        });
        expect(eventos.some((e) => e.action === 'PROGRAMA_MUNDIAL_UPDATED')).toBe(true);
    });

    it('filtra el listado por las unidades del alcance', async () => {
        const propio: Actor = { id: actor.id, roles: ['ADULTO_MANADA'], unidadId };
        const listado = await service.findAll(propio);
        expect(listado.map((i) => i.id)).toContain(inscripcionId);

        const ajeno: Actor = { id: actor.id, roles: ['ADULTO_MANADA'], unidadId: otraUnidadId };
        const vacio = await service.findAll(ajeno);
        expect(vacio.map((i) => i.id)).not.toContain(inscripcionId);
    });

    it('fail-closed fuera del alcance (404) y bloqueo de mutaciones (403)', async () => {
        const ajeno: Actor = { id: actor.id, roles: ['ADULTO_MANADA'], unidadId: otraUnidadId };

        await expect(service.findByMiembro(miembroId, ajeno)).rejects.toThrow(
            'Programas mundiales no encontrados para este miembro',
        );
        await expect(
            service.actualizar(inscripcionId, { estado: EstadoProgramaMundial.EN_CURSO }, ajeno),
        ).rejects.toThrow('Aislamiento de Unidad');
    });

    it('soft-delete oculta el enlace y crear lo reactiva', async () => {
        await service.eliminar(inscripcionId, actor);

        const visibles = await service.findByMiembro(miembroId, actor);
        expect(visibles.map((i) => i.id)).not.toContain(inscripcionId);

        const eventos = await prisma.auditLog.findMany({
            where: { module: 'programas-mundiales', targetId: inscripcionId },
        });
        expect(eventos.some((e) => e.action === 'PROGRAMA_MUNDIAL_DELETED')).toBe(true);

        const reactivada = await service.crear(
            { miembroId, programaMundialId: programaId, fechaInicio: '2024-02-01' },
            actor,
        );
        expect(reactivada.id).toBe(inscripcionId);
        expect(reactivada.deletedAt).toBeNull();
    });

    it('no lista enlaces de miembros eliminados', async () => {
        await prisma.miembro.update({ where: { id: miembroId }, data: { deletedAt: new Date() } });

        const listado = await service.findAll(actor);
        expect(listado.map((i) => i.id)).not.toContain(inscripcionId);
        await expect(service.findByMiembro(miembroId, actor)).rejects.toThrow(
            'Miembro no encontrado',
        );

        await prisma.miembro.update({ where: { id: miembroId }, data: { deletedAt: null } });
    });
});
