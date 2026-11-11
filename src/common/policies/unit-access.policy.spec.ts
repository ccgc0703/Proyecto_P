import { ForbiddenException } from '@nestjs/common';
import { UnitAccessPolicy, ActorScope } from './unit-access.policy';

/**
 * Fase 7c (multi-grupo): el aislamiento de los roles ADULTO_* es por ID de la
 * unidad asignada al actor — el nombre de la unidad se repite en cada grupo
 * (Manada del Grupo A ≠ Manada del Grupo B), así que comparar por nombre
 * cruzaba grupos.
 */
describe('UnitAccessPolicy', () => {
    let policy: UnitAccessPolicy;
    let prisma: any;
    let nodoPolicy: any;

    const mockPrisma = {
        usuario: { findUnique: jest.fn() },
        unidad: { findFirst: jest.fn() },
    };

    const scope = (parcial: Partial<ActorScope>): void => {
        mockPrisma.usuario.findUnique.mockResolvedValue({
            nodoId: null,
            unidadId: null,
            ...parcial,
            UsuarioRoles: (parcial.roleNames ?? []).map((nombre) => ({ Rol: { nombre } })),
        } as any);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        prisma = mockPrisma;
        nodoPolicy = { unidadEnAlcance: jest.fn().mockResolvedValue(true) };
        policy = new UnitAccessPolicy(prisma, nodoPolicy);
        mockPrisma.unidad.findFirst.mockResolvedValue({ nombre: 'Manada' });
    });

    describe('getActorScope', () => {
        it('devuelve roles, nodoId y unidadId en una sola query', async () => {
            scope({ roleNames: ['ADULTO_MANADA'], nodoId: 'nodo-1', unidadId: 'u-mia' });

            const resultado = await policy.getActorScope('user-1');

            expect(resultado).toEqual({
                roleNames: ['ADULTO_MANADA'],
                nodoId: 'nodo-1',
                unidadId: 'u-mia',
            });
            const select = mockPrisma.usuario.findUnique.mock.calls[0][0].select;
            expect(select.unidadId).toBe(true);
        });

        it('usuario inexistente → scope vacío', async () => {
            mockPrisma.usuario.findUnique.mockResolvedValue(null);

            expect(await policy.getActorScope('fantasma')).toEqual({
                roleNames: [],
                nodoId: null,
                unidadId: null,
            });
        });
    });

    describe('assertCanAccessUnit (multi-grupo)', () => {
        it('SYSTEM_ADMIN pasa siempre', async () => {
            scope({ roleNames: ['SYSTEM_ADMIN'], unidadId: 'u-admin' });

            await expect(policy.assertCanAccessUnit('user-1', 'u-ajena')).resolves.toBeUndefined();
        });

        it('adulto con unidad asignada: accede a SU unidad', async () => {
            scope({ roleNames: ['ADULTO_MANADA'], unidadId: 'u-manada-a' });

            await expect(
                policy.assertCanAccessUnit('user-1', 'u-manada-a'),
            ).resolves.toBeUndefined();
            expect(mockPrisma.unidad.findFirst).not.toHaveBeenCalled();
        });

        it('adulto con unidad asignada: RECHAZA otra unidad AUNQUE el nombre coincida', async () => {
            // Ambas unidades se llaman "Manada" (una por grupo) — el escenario
            // exacto que antes se colaba por comparación por nombre.
            scope({ roleNames: ['ADULTO_MANADA'], unidadId: 'u-manada-grupo-a' });
            mockPrisma.unidad.findFirst.mockResolvedValue({ nombre: 'Manada' }); // Grupo B

            await expect(
                policy.assertCanAccessUnit('user-1', 'u-manada-grupo-b'),
            ).rejects.toThrow(ForbiddenException);
        });

        it('adulto con nodoId: primero el subárbol, después la unidad propia', async () => {
            scope({
                roleNames: ['ADULTO_MANADA'],
                nodoId: 'grp-a',
                unidadId: 'u-manada-a',
            });
            nodoPolicy.unidadEnAlcance.mockResolvedValue(false); // fuera del subárbol

            await expect(
                policy.assertCanAccessUnit('user-1', 'u-lejana'),
            ).rejects.toThrow('Aislamiento por nodo: la unidad está fuera de tu ámbito jerárquico');
        });

        it('adulto sin unidadId asignada (legacy): mantiene la comparación por nombre', async () => {
            scope({ roleNames: ['ADULTO_MANADA'], unidadId: null });
            mockPrisma.unidad.findFirst.mockResolvedValue({ nombre: 'Tropa' });

            await expect(policy.assertCanAccessUnit('user-1', 'u-otra')).rejects.toThrow(
                'No tienes acceso a jóvenes de otra unidad',
            );
        });

        it('adulto legacy: el nombre canónico de SU tipo de unidad pasa', async () => {
            scope({ roleNames: ['ADULTO_MANADA'], unidadId: null });
            mockPrisma.unidad.findFirst.mockResolvedValue({ nombre: 'Manada' });

            await expect(policy.assertCanAccessUnit('user-1', 'u-x')).resolves.toBeUndefined();
        });

        it('roles con bypass sin nodoId siguen viendo todas las unidades', async () => {
            scope({ roleNames: ['GROUP_LEADER'], unidadId: 'u-cualquiera' });

            await expect(policy.assertCanAccessUnit('user-1', 'u-ajena')).resolves.toBeUndefined();
        });

        it('rol sin restricción de unidad ni nodo → pasa', async () => {
            scope({ roleNames: ['CONSULTOR'] });

            await expect(policy.assertCanAccessUnit('user-1', 'u-x')).resolves.toBeUndefined();
        });

        it('unidad inexistente en el camino legacy → deja pasar (404 lo da el handler)', async () => {
            scope({ roleNames: ['ADULTO_TROPA'], unidadId: null });
            mockPrisma.unidad.findFirst.mockResolvedValue(null);

            await expect(policy.assertCanAccessUnit('user-1', 'u-fantasma')).resolves.toBeUndefined();
        });
    });
});
