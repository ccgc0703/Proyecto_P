import 'dotenv/config';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AuditService } from '../modules/audit/audit.service';
import { PdfService, Actor } from '../modules/pdf/pdf.service';
import { ProgresionService } from '../modules/progresion/progresion.service';
import { EventosService } from '../modules/eventos/eventos.service';
import { NotificacionesService } from '../modules/notificaciones/notificaciones.service';
import { UnitAccessPolicy } from '../common/policies/unit-access.policy';
import { UnitPolicy } from '../common/policies/unit.policy';
import { NodoPolicy } from '../common/policies/nodo.policy';

const esPdf = (buffer: Buffer) => buffer.subarray(0, 5).toString('latin1') === '%PDF-';

describe('PdfService (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const audit = new AuditService(prisma);
    const nodoPolicy = new NodoPolicy(prisma);
    const unitPolicy = new UnitPolicy(nodoPolicy);

    const pdfService = new PdfService(prisma, unitPolicy);
    const progresionService = new ProgresionService(
        prisma,
        audit,
        new UnitAccessPolicy(prisma, nodoPolicy),
        new NotificacionesService(prisma),
    );
    const eventosService = new EventosService(prisma, audit, unitPolicy, nodoPolicy);

    const sufijo = Date.now().toString().slice(-8);
    let admin: Actor;
    let restringido: Actor;
    let unidadId: string;
    let otraUnidadId: string;
    let miembroId: string;
    let jovenId: string;
    let representanteId: string;
    let patrullaId: string;
    let planificacionId: string;
    let actividadId: string;

    beforeAll(async () => {
        const [unidad, otraUnidad, usuarioAdmin, usuarioRestringido, representante] = await Promise.all([
            prisma.unidad.create({ data: { nombre: `Tropa PDF ${sufijo}`, tipo: 'TROPA' } }),
            prisma.unidad.create({ data: { nombre: `Manada PDF ${sufijo}`, tipo: 'MANADA' } }),
            prisma.usuario.create({
                data: { nombre: 'Admin PDF', email: `pdf-admin-${sufijo}@test.com`, password: 'no-usada' },
            }),
            prisma.usuario.create({
                data: { nombre: 'Adulto PDF', email: `pdf-adulto-${sufijo}@test.com`, password: 'no-usada' },
            }),
            prisma.representante.create({
                data: { nombre: `Representante PDF ${sufijo}`, cedula: `RP-${sufijo}` },
            }),
        ]);
        unidadId = unidad.id;
        otraUnidadId = otraUnidad.id;
        representanteId = representante.id;

        admin = { id: usuarioAdmin.id, roles: ['SYSTEM_ADMIN'], unidadId: null, nodoId: null };
        // Adulto restringido a OTRA unidad: no debe ver nada de `unidadId`.
        restringido = {
            id: usuarioRestringido.id,
            roles: ['ADULTO_TROPA'],
            unidadId: otraUnidadId,
            nodoId: null,
        };

        const miembro = await prisma.miembro.create({
            data: {
                nombres: 'Joven',
                apellidos: `PDF ${sufijo}`,
                cedula: `PDF-${sufijo}`,
                fechaNacimiento: new Date('2012-05-01T00:00:00.000Z'),
                genero: 'MASCULINO',
                tipo: 'JOVEN',
                unidadId,
            },
        });
        miembroId = miembro.id;

        const joven = await prisma.joven.create({
            data: { miembroId, representanteId },
        });
        jovenId = joven.id;

        const patrulla = await prisma.patrulla.create({
            data: { nombre: `Patrulla PDF ${sufijo}`, unidadId },
        });
        patrullaId = patrulla.id;

        await prisma.datosScout.create({
            data: { miembroId, patrullaId, fechaIngreso: new Date('2024-03-01T00:00:00.000Z') },
        });

        const planificacion = await prisma.planificacion.create({
            data: {
                titulo: `Planificacion PDF ${sufijo}`,
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
                titulo: `Reunion PDF ${sufijo}`,
                tipo: 'REUNION',
                fecha: new Date('2026-02-14T00:00:00.000Z'),
                planificacionId,
                estado: 'COMPLETADA',
            },
        });
        actividadId = actividad.id;

        await prisma.asistencia.create({
            data: { actividadId, miembroId, estado: 'PRESENTE' },
        });
    });

    afterAll(async () => {
        await prisma.asistencia.deleteMany({ where: { actividadId } });
        await prisma.actividad.deleteMany({ where: { planificacionId } });
        await prisma.planificacion.deleteMany({ where: { id: planificacionId } });
        await prisma.datosScout.deleteMany({ where: { miembroId } });
        await prisma.patrulla.deleteMany({ where: { id: patrullaId } });
        await prisma.joven.deleteMany({ where: { id: jovenId } });
        await prisma.miembro.deleteMany({ where: { id: miembroId } });
        await prisma.representante.deleteMany({ where: { id: representanteId } });
        await prisma.usuario.deleteMany({ where: { email: { contains: `-${sufijo}@test.com` } } });
        await prisma.unidad.deleteMany({ where: { id: { in: [unidadId, otraUnidadId] } } });
        await prisma.onModuleDestroy();
    });

    it('arma el carnet desde la base y lo renderiza como PDF', async () => {
        const datos = await pdfService.getDatosCarnet(miembroId, admin);

        expect(datos.unidad).toBe(`Tropa PDF ${sufijo}`);
        expect(datos.patrulla).toBe(`Patrulla PDF ${sufijo}`);
        expect(datos.miembroId).toBe(miembroId);

        const buffer = await pdfService.renderCarnet(datos);
        expect(esPdf(buffer)).toBe(true);
    });

    it('el carnet responde 404 para un adulto fuera de la unidad', async () => {
        await expect(pdfService.getDatosCarnet(miembroId, restringido)).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('genera la constancia con los datos reales de progresión', async () => {
        const datos = await progresionService.getDatosExportJoven(miembroId, admin);

        expect(datos.miembroId).toBe(miembroId);
        expect(datos.apellidos).toBe(`PDF ${sufijo}`);
        expect(datos.unidad).toBe(`Tropa PDF ${sufijo}`);

        const buffer = await pdfService.renderConstancia(datos);
        expect(esPdf(buffer)).toBe(true);
    });

    it('arma la planilla real de asistencia y la renderiza como PDF', async () => {
        const planilla = await eventosService.listarAsistenciasActividad(actividadId, admin);

        expect(planilla.actividad.titulo).toBe(`Reunion PDF ${sufijo}`);
        const registro = planilla.registros.find((r) => r.miembroId === miembroId);
        expect(registro?.estado).toBe('PRESENTE');

        const buffer = await pdfService.renderAsistencia(planilla);
        expect(esPdf(buffer)).toBe(true);
    });

    it('la planilla bloquea al adulto de otra unidad (ABAC)', async () => {
        await expect(
            eventosService.listarAsistenciasActividad(actividadId, restringido),
        ).rejects.toBeInstanceOf(ForbiddenException);
    });
});
