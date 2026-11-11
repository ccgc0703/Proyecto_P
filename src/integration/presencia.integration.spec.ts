import 'dotenv/config';
import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AuditService } from '../modules/audit/audit.service';
import { EventosService, Actor } from '../modules/eventos/eventos.service';
import { firmarPresencia, PRESENCIA_QR_TTL_MS } from '../modules/eventos/presencia-qr';
import { UnitPolicy } from '../common/policies/unit.policy';
import { NodoPolicy } from '../common/policies/nodo.policy';

/**
 * QR de presencia (Fase 7b) contra PostgreSQL real:
 * generación por el adulto, auto-registro del joven, idempotencia,
 * códigos alterados/vencidos, aislamiento por unidad y deshacer la marca.
 */
describe('Presencia QR (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const audit = new AuditService(prisma);
    const nodoPolicy = new NodoPolicy(prisma);
    const unitPolicy = new UnitPolicy(nodoPolicy);
    const eventosService = new EventosService(prisma, audit, unitPolicy, nodoPolicy);

    const sufijo = Date.now().toString().slice(-8);
    let admin: Actor;
    let joven: Actor;
    let jovenSinMiembro: Actor;
    let unidadId: string;
    let otraUnidadId: string;
    let miembroId: string;
    let miembroAjenoId: string;
    let actividadId: string;
    let planificacionId: string;
    let actorAjeno: Actor;

    beforeAll(async () => {
        const [unidad, otraUnidad, usuarioAdmin, usuarioJoven, usuarioSinMiembro, usuarioAjeno] =
            await Promise.all([
                prisma.unidad.create({ data: { nombre: `Tropa QR ${sufijo}`, tipo: 'TROPA' } }),
                prisma.unidad.create({ data: { nombre: `Manada QR ${sufijo}`, tipo: 'MANADA' } }),
                prisma.usuario.create({
                    data: { nombre: 'Admin QR', email: `qr-admin-${sufijo}@test.com`, password: 'no-usada' },
                }),
                prisma.usuario.create({
                    data: { nombre: 'Joven QR', email: `qr-joven-${sufijo}@test.com`, password: 'no-usada' },
                }),
                prisma.usuario.create({
                    data: { nombre: 'Sin Miembro QR', email: `qr-sinmiembro-${sufijo}@test.com`, password: 'no-usada' },
                }),
                prisma.usuario.create({
                    data: { nombre: 'Joven Ajeno QR', email: `qr-ajeno-${sufijo}@test.com`, password: 'no-usada' },
                }),
            ]);
        unidadId = unidad.id;
        otraUnidadId = otraUnidad.id;

        const representante = await prisma.representante.create({
            data: { nombre: `Representante QR ${sufijo}`, cedula: `RQ-${sufijo}` },
        });

        admin = { id: usuarioAdmin.id, roles: ['SYSTEM_ADMIN'], unidadId: null, nodoId: null };
        jovenSinMiembro = {
            id: usuarioSinMiembro.id,
            roles: ['JOVEN'],
            unidadId,
            nodoId: null,
            miembroId: null,
        };

        const miembro = await prisma.miembro.create({
            data: {
                nombres: 'Joven',
                apellidos: `QR ${sufijo}`,
                cedula: `QR-${sufijo}`,
                fechaNacimiento: new Date('2012-05-01T00:00:00.000Z'),
                genero: 'MASCULINO',
                tipo: 'JOVEN',
                unidadId,
            },
        });
        miembroId = miembro.id;
        await prisma.joven.create({ data: { miembroId, representanteId: representante.id } });
        joven = { id: usuarioJoven.id, roles: ['JOVEN'], unidadId, nodoId: null, miembroId };

        const miembroAjeno = await prisma.miembro.create({
            data: {
                nombres: 'Ajeno',
                apellidos: `QR ${sufijo}`,
                cedula: `QR-A-${sufijo}`,
                fechaNacimiento: new Date('2011-07-02T00:00:00.000Z'),
                genero: 'MASCULINO',
                tipo: 'JOVEN',
                unidadId: otraUnidadId,
            },
        });
        miembroAjenoId = miembroAjeno.id;
        await prisma.joven.create({ data: { miembroId: miembroAjenoId, representanteId: representante.id } });
        actorAjeno = {
            id: usuarioAjeno.id,
            roles: ['JOVEN'],
            unidadId: otraUnidadId,
            nodoId: null,
            miembroId: miembroAjenoId,
        };

        const planificacion = await prisma.planificacion.create({
            data: {
                titulo: `Planificacion QR ${sufijo}`,
                fechaInicio: new Date('2026-02-01T00:00:00.000Z'),
                fechaFin: new Date('2026-02-28T00:00:00.000Z'),
                unidadId,
                alcance: 'GRUPO',
                estado: 'EN_CURSO',
            },
        });
        planificacionId = planificacion.id;

        const actividad = await prisma.actividad.create({
            data: {
                titulo: `Reunion QR ${sufijo}`,
                tipo: 'REUNION',
                fecha: new Date('2026-02-14T00:00:00.000Z'),
                planificacionId,
                estado: 'EN_CURSO',
            },
        });
        actividadId = actividad.id;
    });

    afterAll(async () => {
        await prisma.asistencia.deleteMany({ where: { actividadId } });
        await prisma.auditLog.deleteMany({
            where: { module: 'eventos', action: { in: ['ASISTENCIA_QR', 'ASISTENCIA_DELETED'] } },
        });
        await prisma.actividad.deleteMany({ where: { planificacionId } });
        await prisma.planificacion.deleteMany({ where: { id: planificacionId } });
        await prisma.joven.deleteMany({
            where: { miembroId: { in: [miembroId, miembroAjenoId] } },
        });
        await prisma.miembro.deleteMany({ where: { id: { in: [miembroId, miembroAjenoId] } } });
        await prisma.representante.deleteMany({ where: { cedula: `RQ-${sufijo}` } });
        await prisma.usuario.deleteMany({ where: { email: { contains: `-${sufijo}@test.com` } } });
        await prisma.unidad.deleteMany({ where: { id: { in: [unidadId, otraUnidadId] } } });
        await prisma.onModuleDestroy();
    });

    it('el adulto genera un QR firmado y con expiracion', async () => {
        const qr = await eventosService.generarQrPresencia(actividadId, admin);

        expect(qr.titulo).toBe(`Reunion QR ${sufijo}`);
        expect(qr.codigo).toMatch(/^presencia:v1:/);
        expect(qr.codigo).toContain(actividadId);
        expect(qr.expira.getTime()).toBeGreaterThan(Date.now());
    });

    it('el joven escanea y se auto-registra PRESENTE', async () => {
        const { codigo } = firmarPresencia(actividadId);

        const resultado = await eventosService.registrarPresencia(codigo, joven);

        expect(resultado.estado).toBe('PRESENTE');
        expect(resultado.yaRegistrado).toBe(false);
        expect(resultado.actividad.id).toBe(actividadId);

        const fila = await prisma.asistencia.findFirst({
            where: { actividadId, miembroId, deletedAt: null },
        });
        expect(fila?.estado).toBe('PRESENTE');

        const auditoria = await prisma.auditLog.findFirst({
            where: { action: 'ASISTENCIA_QR', targetId: actividadId },
            orderBy: { createdAt: 'desc' },
        });
        expect(auditoria).not.toBeNull();
    });

    it('es idempotente: el segundo escaneo no duplica ni reescribe', async () => {
        const { codigo } = firmarPresencia(actividadId);
        const antes = await prisma.asistencia.count({ where: { actividadId, deletedAt: null } });

        const resultado = await eventosService.registrarPresencia(codigo, joven);

        expect(resultado.yaRegistrado).toBe(true);
        const despues = await prisma.asistencia.count({ where: { actividadId, deletedAt: null } });
        expect(despues).toBe(antes);
    });

    it('rechaza un codigo alterado con BadRequest', async () => {
        const { codigo } = firmarPresencia(actividadId);
        const alterado = codigo.replace(actividadId, '99999999-9999-4999-8999-999999999999');

        await expect(eventosService.registrarPresencia(alterado, joven)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('rechaza un codigo vencido con BadRequest', async () => {
        const { codigo } = firmarPresencia(actividadId, Date.now() - PRESENCIA_QR_TTL_MS - 1000);

        await expect(eventosService.registrarPresencia(codigo, joven)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('rechaza al joven de otra unidad (aislamiento por ambito)', async () => {
        const { codigo } = firmarPresencia(actividadId);

        await expect(
            eventosService.registrarPresencia(codigo, actorAjeno),
        ).rejects.toBeInstanceOf(ForbiddenException);

        const filaAjena = await prisma.asistencia.findFirst({
            where: { actividadId, miembroId: miembroAjenoId, deletedAt: null },
        });
        expect(filaAjena).toBeNull();
    });

    it('rechaza a un usuario sin vinculo de miembro', async () => {
        const { codigo } = firmarPresencia(actividadId);

        await expect(
            eventosService.registrarPresencia(codigo, jovenSinMiembro),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rechaza generar QR para una actividad cancelada', async () => {
        await prisma.actividad.update({ where: { id: actividadId }, data: { estado: 'CANCELADA' } });

        await expect(eventosService.generarQrPresencia(actividadId, admin)).rejects.toBeInstanceOf(
            ConflictException,
        );

        await prisma.actividad.update({ where: { id: actividadId }, data: { estado: 'EN_CURSO' } });
    });

    it('deshace la marca (DELETE) y libera la actividad para su borrado', async () => {
        const asistencia = await prisma.asistencia.findFirst({
            where: { actividadId, miembroId, deletedAt: null },
        });
        expect(asistencia).not.toBeNull();

        await eventosService.removeAsistencia(asistencia!.id, admin);

        const trasBorrar = await prisma.asistencia.count({ where: { actividadId, deletedAt: null } });
        expect(trasBorrar).toBe(0);

        // Con filas activas el soft-delete de la actividad estaba bloqueado (409);
        // al deshacer la marca vuelve a ser posible.
        await expect(eventosService.removeActividad(actividadId, admin)).resolves.toBeUndefined();
        await prisma.actividad.update({
            where: { id: actividadId },
            data: { deletedAt: null },
        });
    });
});
