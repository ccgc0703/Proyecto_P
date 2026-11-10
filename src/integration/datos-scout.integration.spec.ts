import 'dotenv/config';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AuditService } from '../modules/audit/audit.service';
import { DatosScoutService, Actor } from '../modules/datos-scout/datos-scout.service';
import { UnitPolicy } from '../common/policies/unit.policy';
import { NodoPolicy } from '../common/policies/nodo.policy';

describe('DatosScoutService (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const service = new DatosScoutService(
        prisma,
        new AuditService(prisma),
        new UnitPolicy(new NodoPolicy(prisma)),
    );

    const sufijo = Date.now().toString().slice(-8);
    let actor: Actor;
    let unidadId: string;
    let otraUnidadId: string;
    let miembroId: string;
    let patrullaId: string;
    let patrullaAjenaId: string;
    let datosId: string;

    beforeAll(async () => {
        const unidad = await prisma.unidad.findFirst({ where: { deletedAt: null } });
        if (!unidad) throw new Error('El test requiere al menos una unidad sembrada');
        unidadId = unidad.id;

        // Unidad fuera del alcance de los roles restringidos por unidad.
        const otraUnidad = await prisma.unidad.create({
            data: { nombre: `Unidad integracion ${sufijo}` },
        });
        otraUnidadId = otraUnidad.id;

        const usuario = await prisma.usuario.create({
            data: {
                nombre: 'Integracion Datos Scout',
                email: `datos-scout-integracion-${sufijo}@test.com`,
                password: 'no-usada',
            },
        });
        actor = { id: usuario.id, roles: ['SYSTEM_ADMIN'] };

        const miembro = await prisma.miembro.create({
            data: {
                nombres: 'Joven',
                apellidos: `DatosScout ${sufijo}`,
                cedula: `DS-${sufijo}`,
                fechaNacimiento: new Date('2012-05-01'),
                genero: 'MASCULINO',
                tipo: 'JOVEN',
                unidadId,
            },
        });
        miembroId = miembro.id;

        const patrulla = await prisma.patrulla.create({
            data: { nombre: `Patrulla ${sufijo}`, unidadId },
        });
        patrullaId = patrulla.id;

        const patrullaAjena = await prisma.patrulla.create({
            data: { nombre: `Patrulla ajena ${sufijo}`, unidadId: otraUnidadId },
        });
        patrullaAjenaId = patrullaAjena.id;
    });

    afterAll(async () => {
        await prisma.auditLog.deleteMany({ where: { module: 'datos-scout' } });
        await prisma.datosScout.deleteMany({ where: { miembroId } });
        await prisma.patrulla.deleteMany({ where: { id: { in: [patrullaId, patrullaAjenaId] } } });
        await prisma.miembro.delete({ where: { id: miembroId } });
        await prisma.unidad.delete({ where: { id: otraUnidadId } });
        await prisma.usuario.delete({ where: { id: actor.id } });
        await prisma.onModuleDestroy();
    });

    it('crea el expediente con la patrulla y las fechas convertidas', async () => {
        const datos = await service.crear(
            {
                miembroId,
                fechaRegistro: '2024-02-01',
                fechaIngreso: '2024-03-01',
                fechaPromesa: '2025-06-15',
                cargoActual: '  Guía de patrulla  ',
                observaciones: '  Sin novedades  ',
                patrullaId,
            },
            actor,
        );
        datosId = datos.id;

        expect(datos.miembroId).toBe(miembroId);
        expect(datos.fechaRegistro).toEqual(new Date('2024-02-01'));
        expect(datos.fechaIngreso).toEqual(new Date('2024-03-01'));
        expect(datos.fechaPromesa).toEqual(new Date('2025-06-15'));
        expect(datos.cargoActual).toBe('Guía de patrulla');
        expect(datos.observaciones).toBe('Sin novedades');
        expect(datos.Patrulla?.id).toBe(patrullaId);
    });

    it('audita la creación del expediente', async () => {
        const eventos = await prisma.auditLog.findMany({
            where: { module: 'datos-scout', targetId: datosId },
        });

        expect(eventos.some((e) => e.action === 'DATOS_SCOUT_CREATED')).toBe(true);
    });

    it('recupera el expediente por miembro', async () => {
        const datos = await service.findByMiembro(miembroId, actor);

        expect(datos.id).toBe(datosId);
        expect(datos.Patrulla?.nombre).toBe(`Patrulla ${sufijo}`);
    });

    it('no permite un segundo expediente para el mismo miembro', async () => {
        await expect(
            service.crear({ miembroId, cargoActual: 'Duplicado' }, actor),
        ).rejects.toThrow('El miembro ya tiene un expediente scout registrado');
    });

    it('actualiza el expediente por miembro (upsert) y audita', async () => {
        const datos = await service.actualizarPorMiembro(
            miembroId,
            { cargoActual: 'Subguía', patrullaId: null, observaciones: null },
            actor,
        );

        expect(datos.cargoActual).toBe('Subguía');
        expect(datos.patrullaId).toBeNull();
        expect(datos.observaciones).toBeNull();

        const eventos = await prisma.auditLog.findMany({
            where: { module: 'datos-scout', targetId: datosId },
        });
        expect(eventos.some((e) => e.action === 'DATOS_SCOUT_UPDATED')).toBe(true);
    });

    it('rechaza una patrulla que pertenece a otra unidad', async () => {
        await expect(
            service.actualizarPorMiembro(miembroId, { patrullaId: patrullaAjenaId }, actor),
        ).rejects.toThrow('La patrulla no pertenece a la unidad del miembro');
    });

    it('respeta el aislamiento por unidad en la lectura puntual', async () => {
        const ajeno: Actor = {
            id: actor.id,
            roles: ['ADULTO_MANADA'],
            unidadId: otraUnidadId,
        };

        await expect(service.findByMiembro(miembroId, ajeno)).rejects.toThrow(
            'Datos scout no encontrados para este miembro',
        );
    });

    it('impide editar expedientes de otra unidad', async () => {
        const ajeno: Actor = {
            id: actor.id,
            roles: ['ADULTO_MANADA'],
            unidadId: otraUnidadId,
        };

        await expect(
            service.actualizarPorMiembro(miembroId, { cargoActual: 'Ajeno' }, ajeno),
        ).rejects.toThrow('Aislamiento de Unidad');
    });

    it('filtra el listado por las unidades del alcance', async () => {
        const propio: Actor = {
            id: actor.id,
            roles: ['ADULTO_MANADA'],
            unidadId,
        };

        const listado = await service.findAll(propio);
        expect(listado.map((d) => d.id)).toContain(datosId);

        const ajeno: Actor = {
            id: actor.id,
            roles: ['ADULTO_MANADA'],
            unidadId: otraUnidadId,
        };

        const vacio = await service.findAll(ajeno);
        expect(vacio.map((d) => d.id)).not.toContain(datosId);
    });

    it('no lista expedientes de miembros eliminados', async () => {
        await prisma.miembro.update({ where: { id: miembroId }, data: { deletedAt: new Date() } });

        const listado = await service.findAll(actor);
        expect(listado.map((d) => d.id)).not.toContain(datosId);
        await expect(service.findByMiembro(miembroId, actor)).rejects.toThrow('Miembro no encontrado');

        await prisma.miembro.update({ where: { id: miembroId }, data: { deletedAt: null } });
    });
});
