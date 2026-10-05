import { ForbiddenException } from '@nestjs/common';
import { SelfScopePolicy } from './self-scope.policy';

describe('SelfScopePolicy', () => {
    const policy = new SelfScopePolicy();
    const miembroPropio = 'miembro-abc';
    const miembroAjeno = 'miembro-xyz';

    const joven = { roles: ['JOVEN'], miembroId: miembroPropio };
    const adulto = { roles: ['ADULTO_MANADA'], miembroId: null };

    describe('isJoven', () => {
        it('detecta el rol JOVEN', () => {
            expect(policy.isJoven(joven)).toBe(true);
        });

        it('no detecta el rol en otros usuarios', () => {
            expect(policy.isJoven(adulto)).toBe(false);
            expect(policy.isJoven(null)).toBe(false);
            expect(policy.isJoven({})).toBe(false);
        });
    });

    describe('assertSelf', () => {
        it('permite al joven acceder a su propio miembro', () => {
            expect(() => policy.assertSelf(joven, miembroPropio)).not.toThrow();
        });

        it('bloquea al joven cuando el miembro es de otro joven', () => {
            expect(() => policy.assertSelf(joven, miembroAjeno)).toThrow(ForbiddenException);
        });

        it('bloquea al joven cuando no tiene miembroId en el JWT', () => {
            expect(() => policy.assertSelf({ roles: ['JOVEN'], miembroId: null }, miembroPropio)).toThrow(
                ForbiddenException,
            );
        });

        it('bloquea al joven cuando el objetivo no tiene miembroId', () => {
            expect(() => policy.assertSelf(joven, null)).toThrow(ForbiddenException);
            expect(() => policy.assertSelf(joven, undefined)).toThrow(ForbiddenException);
        });

        it('no restringe a los demás roles (su alcance lo define RBAC/ABAC)', () => {
            expect(() => policy.assertSelf(adulto, miembroAjeno)).not.toThrow();
            expect(() => policy.assertSelf({ roles: ['SYSTEM_ADMIN'] }, miembroAjeno)).not.toThrow();
        });
    });

    describe('assertNotJoven', () => {
        it('bloquea operaciones globales para el rol JOVEN', () => {
            expect(() => policy.assertNotJoven(joven)).toThrow(ForbiddenException);
        });

        it('permite operaciones globales a los demás roles', () => {
            expect(() => policy.assertNotJoven(adulto)).not.toThrow();
            expect(() => policy.assertNotJoven({ roles: ['SYSTEM_ADMIN'] })).not.toThrow();
        });
    });
});
