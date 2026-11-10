import 'dotenv/config';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AuditService } from '../modules/audit/audit.service';
import { FormacionService, Actor } from '../modules/formacion/formacion.service';
import { UnitPolicy } from '../common/policies/unit.policy';
import { NodoPolicy } from '../common/policies/nodo.policy';

describe('FormacionService (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const service = new FormacionService(
        prisma,
        new AuditService(prisma),
        new UnitPolicy(new NodoPolicy(prisma)),
    );

    const sufijo = Date.now().toString().slice(-8);
    let actor: Actor;
    let unidadId: string;
    let miembroId: string;
    let adultoId: string;
    let formacionId: string;

    beforeAll(async () => {
        const unidad = await prisma.unidad.findFirst({ where: { deletedAt: null } });
        if (!unidad) throw new Error('El test requiere al menos una unidad sembrada');
        unidadId = unidad.id;

        const usuario = await prisma.usuario.create({
            data: {
                nombre: 'Integracion Formacion',
                email: `formacion-integracion-${sufijo}@test.com`,
                password: 'no-usada',
            },
        });
        actor = { id: usuario.id, roles: ['SYSTEM_ADMIN'] };

        const miembro = await prisma.miembro.create({
            data: {
                nombres: 'Adulto',
                apellidos: `Formacion ${sufijo}`,
                cedula: `F-${sufijo}`,
                fechaNacimiento: new Date('1990-01-01'),
                genero: 'MASCULINO',
                tipo: 'ADULTO',
                unidadId,
            },
        });
        miembroId = miembro.id;

        const adulto = await prisma.adulto.create({ data: { miembroId: miembro.id } });
        adultoId = adulto.id;

        const formacion = await service.crear(
            {
                nombre: `Curso integracion ${sufijo}`,
                fecha: '2026-03-01',
                director: 'Director de prueba',
                adultoId,
            },
            actor,
        );
        formacionId = formacion.id;
    });

    afterAll(async () => {
        await prisma.auditLog.deleteMany({
            where: { module: 'formacion', targetId: formacionId },
        });
        await prisma.formacion.deleteMany({ where: { adultoId } });
        await prisma.adulto.delete({ where: { id: adultoId } });
        await prisma.miembro.delete({ where: { id: miembroId } });
        await prisma.usuario.delete({ where: { id: actor.id } });
        await prisma.onModuleDestroy();
    });

    it('crea la formacion asociada al adulto con la fecha convertida', async () => {
        const formacion = await service.obtener(formacionId, actor);

        expect(formacion.adultoId).toBe(adultoId);
        expect(formacion.nombre).toBe(`Curso integracion ${sufijo}`);
        expect(formacion.fecha).toEqual(new Date('2026-03-01'));
        expect(formacion.Adulto.Miembro.unidadId).toBe(unidadId);
    });

    it('lista el selector de adultos del ámbito', async () => {
        const adultos = await service.listarAdultos(actor);

        expect(adultos.map((a) => a.id)).toContain(adultoId);
        expect(adultos.find((a) => a.id === adultoId)?.unidadId).toBe(unidadId);
    });

    it('lista las formaciones del adulto', async () => {
        const listado = await service.findByAdulto(adultoId, actor);

        expect(listado.map((f) => f.id)).toContain(formacionId);
    });

    it('respeta el aislamiento por unidad en lecturas puntuales', async () => {
        const ajeno: Actor = {
            id: actor.id,
            roles: ['ADULTO_MANADA'],
            unidadId: '00000000-0000-4000-8000-000000000000',
        };

        await expect(service.obtener(formacionId, ajeno)).rejects.toThrow('Formacion no encontrada');
        await expect(service.findByAdulto(adultoId, ajeno)).rejects.toThrow('Formacion no encontrada');
    });

    it('impide crear formaciones para adultos de otra unidad', async () => {
        const ajeno: Actor = {
            id: actor.id,
            roles: ['ADULTO_MANADA'],
            unidadId: '00000000-0000-4000-8000-000000000000',
        };

        await expect(
            service.crear(
                {
                    nombre: 'Curso ajeno',
                    fecha: '2026-03-02',
                    director: 'Director',
                    adultoId,
                },
                ajeno,
            ),
        ).rejects.toThrow('Aislamiento de Unidad');
    });

    it('actualiza la formacion y conserva el adulto', async () => {
        const actualizada = await service.actualizar(
            formacionId,
            { nombre: 'Curso actualizado', fecha: '2026-04-10' },
            actor,
        );

        expect(actualizada.nombre).toBe('Curso actualizado');
        expect(actualizada.fecha).toEqual(new Date('2026-04-10'));
        expect(actualizada.adultoId).toBe(adultoId);
    });

    it('aplica soft-delete y deja de aparecer en los listados', async () => {
        await service.eliminar(formacionId, actor);

        const listado = await service.findByAdulto(adultoId, actor);
        expect(listado.map((f) => f.id)).not.toContain(formacionId);
        await expect(service.obtener(formacionId, actor)).rejects.toThrow('Formacion no encontrada');
    });
});
