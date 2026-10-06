import 'dotenv/config';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AdultosService } from '../modules/adultos/adultos.service';

describe('AdultosService (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const usersService = { create: jest.fn(), remove: jest.fn().mockResolvedValue(undefined) };
    const auditService = { logAction: jest.fn().mockResolvedValue(undefined) };
    const service = new AdultosService(
        prisma,
        usersService as any,
        auditService as any,
    );

    let unidadId: string;
    let miembroId: string;
    let adultoId: string;
    const cedula = `V-${Date.now().toString().slice(-8)}`;

    beforeAll(async () => {
        const unidad = await prisma.unidad.create({
            data: { nombre: `U-ADULTOS-${Date.now()}`, tipo: `INTE-${Date.now()}` },
        });
        unidadId = unidad.id;

        const miembro = await prisma.miembro.create({
            data: {
                nombres: 'Integration',
                apellidos: 'Adulto',
                cedula,
                fechaNacimiento: new Date('1990-04-04'),
                genero: 'MASCULINO',
                tipo: 'ADULTO',
                unidadId,
            },
        });
        miembroId = miembro.id;

        const adulto = await prisma.adulto.create({ data: { miembroId } });
        adultoId = adulto.id;
    });

    afterAll(async () => {
        await prisma.adulto.deleteMany({ where: { miembroId } });
        await prisma.miembro.deleteMany({ where: { id: miembroId } });
        await prisma.unidad.deleteMany({ where: { id: unidadId } });
        await prisma.onModuleDestroy();
    });

    it('lista el adulto activo', async () => {
        const lista = await service.findAll();
        expect(lista.map((a) => a.id)).toContain(adultoId);
    });

    it('tras el soft delete sale de la lista y findOne responde 404', async () => {
        await service.remove(adultoId, 'integration-test');

        const lista = await service.findAll();
        expect(lista.map((a) => a.id)).not.toContain(adultoId);

        await expect(service.findOne(adultoId)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('eliminar dos veces responde 404', async () => {
        await expect(service.remove(adultoId, 'integration-test')).rejects.toBeInstanceOf(
            NotFoundException,
        );
    });

    it('el miembro sigue existiendo en la base (borrado logico, no fisico)', async () => {
        const miembro = await prisma.miembro.findFirst({
            where: { id: miembroId, deletedAt: { not: null } },
        });
        expect(miembro).not.toBeNull();
        expect(await prisma.adulto.findFirst({ where: { id: adultoId } })).not.toBeNull();
    });
});
