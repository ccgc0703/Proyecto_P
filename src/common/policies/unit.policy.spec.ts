import { ForbiddenException } from '@nestjs/common';
import { UnitPolicy } from './unit.policy';
import { NodoPolicy } from './nodo.policy';

describe('UnitPolicy (F4.3 — ámbito jerárquico)', () => {
    let policy: UnitPolicy;
    let nodoPolicy: { subtreeIds: jest.Mock; unidadesEnAlcance: jest.Mock; unidadEnAlcance: jest.Mock };

    const AL = 'ALCANCE-1';

    beforeEach(() => {
        nodoPolicy = {
            subtreeIds: jest.fn(),
            unidadesEnAlcance: jest.fn().mockResolvedValue(['u-dentro-1', 'u-dentro-2']),
            unidadEnAlcance: jest.fn(),
        };
        policy = new UnitPolicy(nodoPolicy as unknown as NodoPolicy);
    });

    // ── Retro-compatibilidad: sin nodoId (todos los usuarios actuales) ───────
    describe('sin nodoId (comportamiento previo)', () => {
        it('admin puede gestionar cualquier unidad y tiene visión global', async () => {
            const user = { roles: ['SYSTEM_ADMIN'] };
            expect(await policy.canManageUnit(user, 'cualquiera')).toBe(true);
            expect(await policy.canManageUnit(user)).toBe(true);
            expect(await policy.unidadesAlcance(user)).toBeNull();
            expect(nodoPolicy.unidadEnAlcance).not.toHaveBeenCalled();
        });

        it('roles no restringidos tienen visión global', async () => {
            const user = { roles: ['GROUP_LEADER'] };
            expect(await policy.canManageUnit(user, 'u-otra')).toBe(true);
            expect(await policy.unidadesAlcance(user)).toBeNull();
        });

        it('adulto restringido solo su unidad', async () => {
            const user = { roles: ['ADULTO_MANADA'], unidadId: 'u-mia' };
            expect(await policy.canManageUnit(user, 'u-mia')).toBe(true);
            expect(await policy.canManageUnit(user, 'u-ajena')).toBe(false);
            expect(await policy.canManageUnit(user)).toBe(false);
            expect(await policy.unidadesAlcance(user)).toEqual(['u-mia']);
        });

        it('adulto sin unidad asignada no ve ninguna', async () => {
            const user = { roles: ['ADULTO_TROPA'], unidadId: null };
            expect(await policy.canManageUnit(user, 'u-x')).toBe(false);
            expect(await policy.unidadesAlcance(user)).toEqual([]);
        });
    });

    // ── Con nodoId: visión restringida al subárbol ──────────────────────────
    describe('con nodoId', () => {
        it('SYSTEM_ADMIN ignora el aislamiento por nodo', async () => {
            const user = { roles: ['SYSTEM_ADMIN'], nodoId: AL };
            expect(await policy.canManageUnit(user, 'u-fuera')).toBe(true);
            expect(await policy.unidadesAlcance(user)).toBeNull();
            expect(nodoPolicy.unidadEnAlcance).not.toHaveBeenCalled();
        });

        it('jefe con nodoId solo puede operar unidades del subárbol', async () => {
            const user = { roles: ['GROUP_LEADER'], nodoId: AL };
            nodoPolicy.unidadEnAlcance
                .mockResolvedValueOnce(true)
                .mockResolvedValueOnce(false);

            expect(await policy.canManageUnit(user, 'u-dentro')).toBe(true);
            expect(await policy.canManageUnit(user, 'u-fuera')).toBe(false);
        });

        it('jefe con nodoId sin unidad objetivo no tiene visión global', async () => {
            const user = { roles: ['GROUP_LEADER'], nodoId: AL };
            expect(await policy.canManageUnit(user)).toBe(false);
        });

        it('adulto con nodoId debe cumplir unidad propia Y estar en el subárbol', async () => {
            const user = { roles: ['ADULTO_MANADA'], unidadId: 'u-mia', nodoId: AL };
            nodoPolicy.unidadEnAlcance.mockResolvedValueOnce(true);
            nodoPolicy.unidadEnAlcance.mockResolvedValueOnce(false);

            expect(await policy.canManageUnit(user, 'u-mia')).toBe(true);
            expect(await policy.canManageUnit(user, 'u-mia')).toBe(false);
            expect(await policy.canManageUnit(user, 'u-ajena')).toBe(false);
        });

        it('unidadesAlcance devuelve las unidades del subárbol', async () => {
            const user = { roles: ['GROUP_LEADER'], nodoId: AL };
            expect(await policy.unidadesAlcance(user)).toEqual(['u-dentro-1', 'u-dentro-2']);
            expect(nodoPolicy.unidadesEnAlcance).toHaveBeenCalledWith(AL);
        });

        it('unidadesAlcance intersecciona unidad propia con el subárbol (adulto)', async () => {
            const dentro = { roles: ['ADULTO_CLAN'], unidadId: 'u-dentro-1', nodoId: AL };
            const fuera = { roles: ['ADULTO_CLAN'], unidadId: 'u-mia', nodoId: AL };

            expect(await policy.unidadesAlcance(dentro)).toEqual(['u-dentro-1']);
            expect(await policy.unidadesAlcance(fuera)).toEqual([]);
        });
    });

    // ── assertCanManageUnit: mensajes ───────────────────────────────────────
    describe('assertCanManageUnit', () => {
        it('no lanza cuando hay permiso', async () => {
            const user = { roles: ['SYSTEM_ADMIN'] };
            await expect(policy.assertCanManageUnit(user, 'u-x')).resolves.toBeUndefined();
        });

        it('lanza con mensaje de unidad cuando falla el aislamiento por unidad', async () => {
            const user = { roles: ['ADULTO_MANADA'], unidadId: 'u-mia' };
            await expect(policy.assertCanManageUnit(user, 'u-ajena')).rejects.toThrow(
                ForbiddenException,
            );
            await expect(policy.assertCanManageUnit(user, 'u-ajena')).rejects.toThrow(
                'Aislamiento de Unidad',
            );
        });

        it('lanza con mensaje de nodo cuando la unidad está fuera del subárbol', async () => {
            const user = { roles: ['GROUP_LEADER'], nodoId: AL };
            nodoPolicy.unidadEnAlcance.mockResolvedValue(false);

            await expect(policy.assertCanManageUnit(user, 'u-fuera')).rejects.toThrow(
                'Aislamiento por nodo',
            );
        });

        it('lanza con mensaje de nodo cuando el adulto está fuera del subárbol', async () => {
            const user = { roles: ['ADULTO_MANADA'], unidadId: 'u-mia', nodoId: AL };
            nodoPolicy.unidadEnAlcance.mockResolvedValue(false);

            await expect(policy.assertCanManageUnit(user, 'u-mia')).rejects.toThrow(
                'Aislamiento por nodo',
            );
        });
    });

    describe('isRestricted', () => {
        it('detecta roles restringidos e ignora el resto', () => {
            expect(policy.isRestricted({ roles: ['ADULTO_COMUNIDAD'] })).toBe(true);
            expect(policy.isRestricted({ roles: ['SYSTEM_ADMIN'] })).toBe(false);
            expect(policy.isRestricted({})).toBe(false);
            expect(policy.isRestricted(null)).toBe(false);
        });
    });
});
