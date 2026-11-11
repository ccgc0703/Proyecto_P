import 'dotenv/config';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AuditService } from '../modules/audit/audit.service';
import { NotificacionesService } from '../modules/notificaciones/notificaciones.service';
import { UsersService } from '../modules/users/users.service';
import { UsersController } from '../modules/users/users.controller';
import { UnidadesService } from '../modules/unidades/unidades.service';
import { UnidadesController } from '../modules/unidades/unidades.controller';
import { NodoPolicy } from '../common/policies/nodo.policy';
import { UnitPolicy } from '../common/policies/unit.policy';
import { UnitAccessPolicy } from '../common/policies/unit-access.policy';

/**
 * Fase 7c — Multi-grupo: aislamiento por subárbol jerárquico.
 *
 * Dos grupos (GRP-A / GRUPO-B) con unidades HOMÓNIMAS ("Manada" en cada
 * grupo) y cuentas en cada uno. Antes de 7c:
 *  - el adulto de A pasaba en la "Manada" de B (comparación por nombre),
 *  - el jefe de A listaba/editaba cuentas de B (GET/PATCH /users sin ámbito),
 *  - el alta de unidades no anclaba grupoId (unidades huérfanas).
 */
describe('Multi-grupo (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const audit = new AuditService(prisma);
    const nodoPolicy = new NodoPolicy(prisma);
    const unitPolicy = new UnitPolicy(nodoPolicy);
    const unitAccess = new UnitAccessPolicy(prisma, nodoPolicy);
    const usersService = new UsersService(prisma, audit, new NotificacionesService(prisma));
    const unidadesService = new UnidadesService(prisma);
    const usersController = new UsersController(usersService, nodoPolicy);
    const unidadesController = new UnidadesController(unidadesService, unitPolicy, nodoPolicy);

    const sufijo = Date.now().toString().slice(-8);

    let distritoId: string;
    let grpA: string;
    let grpB: string;
    let unidadA: string; // "Manada" del Grupo A
    let unidadB: string; // "Manada" del Grupo B (mismo nombre/tipo)
    let liderA: string;
    let adultoA: string;
    let usuarioB: string;
    let unidadCreada: string | null = null;

    /** req simulado para los handlers de controller. */
    const reqDe = (id: string, nodoId: string | null, roles: string[] = ['GROUP_LEADER']) =>
        ({ user: { id, nodoId, roles, unidadId: null } }) as any;

    beforeAll(async () => {
        const distrito = await prisma.organizacionNodo.create({
            data: { codigo: `DIS-MG-${sufijo}`, nombre: `Distrito MG ${sufijo}`, tipo: 'DISTRITO', nivel: 4 },
        });
        distritoId = distrito.id;
        const [a, b] = await Promise.all([
            prisma.organizacionNodo.create({
                data: { codigo: `GRP-MG-A-${sufijo}`, nombre: `Grupo A ${sufijo}`, tipo: 'GRUPO', nivel: 5, padreId: distritoId },
            }),
            prisma.organizacionNodo.create({
                data: { codigo: `GRP-MG-B-${sufijo}`, nombre: `Grupo B ${sufijo}`, tipo: 'GRUPO', nivel: 5, padreId: distritoId },
            }),
        ]);
        grpA = a.id;
        grpB = b.id;

        // Unidades homónimas: misma clase, un grupo distinto.
        const [ua, ub] = await Promise.all([
            prisma.unidad.create({ data: { nombre: `MANADA ${sufijo}`, tipo: 'MANADA', grupoId: grpA } }),
            prisma.unidad.create({ data: { nombre: `MANADA ${sufijo}`, tipo: 'MANADA', grupoId: grpB } }),
        ]);
        unidadA = ua.id;
        unidadB = ub.id;

        const [la, aa, ub2] = await Promise.all([
            prisma.usuario.create({
                data: { nombre: `Lider A ${sufijo}`, email: `mg-lider-${sufijo}@test.com`, password: 'no-usada', nodoId: grpA },
            }),
            prisma.usuario.create({
                data: { nombre: `Adulto A ${sufijo}`, email: `mg-adulto-${sufijo}@test.com`, password: 'no-usada', unidadId: unidadA, nodoId: grpA },
            }),
            prisma.usuario.create({
                data: { nombre: `Usuario B ${sufijo}`, email: `mg-userb-${sufijo}@test.com`, password: 'no-usada', unidadId: unidadB, nodoId: grpB },
            }),
        ]);
        liderA = la.id;
        adultoA = aa.id;
        usuarioB = ub2.id;

        // Rol ADULTO_MANADA (find-or-create: el seed puede haberlo creado).
        let rol = await prisma.rol.findFirst({ where: { nombre: 'ADULTO_MANADA', deletedAt: null } });
        if (!rol) {
            rol = await prisma.rol.create({ data: { nombre: 'ADULTO_MANADA', descripcion: 'Adulto de Manada' } });
        }
        await prisma.usuarioRol.create({ data: { usuarioId: adultoA, rolId: rol.id } });
    });

    afterAll(async () => {
        await prisma.usuarioRol.deleteMany({ where: { usuarioId: { in: [liderA, adultoA, usuarioB] } } });
        await prisma.usuario.deleteMany({ where: { id: { in: [liderA, adultoA, usuarioB] } } });
        const ids = [unidadA, unidadB, ...(unidadCreada ? [unidadCreada] : [])];
        await prisma.unidad.deleteMany({ where: { id: { in: ids } } });
        await prisma.organizacionNodo.deleteMany({ where: { id: { in: [grpA, grpB, distritoId] } } });
        await prisma.onModuleDestroy();
    });

    // ── Ámbito jerárquico de unidades ────────────────────────────────────

    it('el jefe de A solo ve las unidades de su grupo (subárbol)', async () => {
        const lider = { id: liderA, roles: ['GROUP_LEADER'], nodoId: grpA, unidadId: null };

        const alcance = await unitPolicy.unidadesAlcance(lider);

        expect(alcance).toEqual([unidadA]);
    });

    it('unidadEnAlcance: true para la Manada de A, false para la de B', async () => {
        await expect(nodoPolicy.unidadEnAlcance(grpA, unidadA)).resolves.toBe(true);
        await expect(nodoPolicy.unidadEnAlcance(grpA, unidadB)).resolves.toBe(false);
    });

    it('el adulto de A NO pasa en la Manada de B aunque el nombre coincida', async () => {
        // El escenario exacto del hueco: ambas unidades se llaman igual.
        await expect(unitAccess.assertCanAccessUnit(adultoA, unidadB)).rejects.toBeInstanceOf(
            ForbiddenException,
        );
        await expect(unitAccess.assertCanAccessUnit(adultoA, unidadA)).resolves.toBeUndefined();
    });

    // ── Ámbito de cuentas (usuarios) ─────────────────────────────────────

    it('usuarioEnAlcance: la cuenta de B está fuera del ámbito de A', async () => {
        await expect(nodoPolicy.usuarioEnAlcance(grpA, adultoA)).resolves.toBe(true);
        await expect(nodoPolicy.usuarioEnAlcance(grpA, usuarioB)).resolves.toBe(false);
        await expect(nodoPolicy.usuarioEnAlcance(grpA, 'no-existe')).resolves.toBe(true);
    });

    it('GET /users del jefe de A excluye a las cuentas del Grupo B', async () => {
        const filtro = await nodoPolicy.filtroUsuarios(grpA);
        expect(filtro).not.toBeNull();

        const { data } = await usersService.findAll(filtro!, {});
        const ids = data.map((u: any) => u.id);

        expect(ids).toContain(adultoA);
        expect(ids).toContain(liderA);
        expect(ids).not.toContain(usuarioB);
    });

    it('sin ámbito (admin) el listado sigue siendo global', async () => {
        const req = reqDe(liderA, null, ['SYSTEM_ADMIN']);
        const res = await usersController.findAll(req);

        const ids = res.data.map((u: any) => u.id);
        expect(ids).toContain(usuarioB);
    });

    it('GET /users/:id de una cuenta ajena responde 403 (no filtra ni expone)', async () => {
        await expect(usersController.findOne(usuarioB, reqDe(liderA, grpA))).rejects.toBeInstanceOf(
            ForbiddenException,
        );
    });

    // ── Alta de unidades anclada al ámbito ───────────────────────────────

    it('assertGrupo: 404 inexistente, 400 si no es GRUPO, 403 fuera de ámbito', async () => {
        await expect(nodoPolicy.assertGrupo('00000000-0000-4000-8000-000000000000')).rejects.toBeInstanceOf(
            NotFoundException,
        );
        await expect(nodoPolicy.assertGrupo(distritoId)).rejects.toBeInstanceOf(BadRequestException);
        await expect(nodoPolicy.assertGrupo(grpB, grpA)).rejects.toBeInstanceOf(ForbiddenException);
        await expect(nodoPolicy.assertGrupo(grpA, grpA)).resolves.toBeUndefined();
    });

    it('POST /unidades con grupoId fuera de ámbito → 403 y no crea nada', async () => {
        const antes = await prisma.unidad.count({ where: { nombre: `TROPA MG ${sufijo}` } });

        await expect(
            unidadesController.create(
                { nombre: `TROPA MG ${sufijo}`, tipo: 'TROPA', grupoId: grpB } as any,
                reqDe(liderA, grpA),
            ),
        ).rejects.toBeInstanceOf(ForbiddenException);

        const despues = await prisma.unidad.count({ where: { nombre: `TROPA MG ${sufijo}` } });
        expect(despues).toBe(antes);
    });

    it('POST /unidades sin grupoId desde un ámbito → 400 (cuenta obligatoria)', async () => {
        await expect(
            unidadesController.create({ nombre: `TROPA MG ${sufijo}`, tipo: 'TROPA' } as any, reqDe(liderA, grpA)),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('POST /unidades con grupoId del ámbito → crea la unidad anclada a GRP-A', async () => {
        const res = await unidadesController.create(
            { nombre: `TROPA MG ${sufijo}`, tipo: 'TROPA', grupoId: grpA } as any,
            reqDe(liderA, grpA),
        );

        unidadCreada = res.data.id;
        expect(res.success).toBe(true);
        expect(res.data.grupoId).toBe(grpA);
    });
});
