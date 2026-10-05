import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY, SELF_SCOPE_KEY } from '../decorators/permissions.decorator';

interface Metadata {
    permissions?: string[];
    selfScope?: boolean;
}

function crearGuard(metadata: Metadata): PermissionsGuard {
    const reflector = {
        getAllAndOverride: (key: string) =>
            key === PERMISSIONS_KEY ? metadata.permissions : metadata.selfScope,
    } as unknown as Reflector;
    return new PermissionsGuard(reflector);
}

function crearContexto(user?: Record<string, unknown>): ExecutionContext {
    return {
        getHandler: () => function handler() { },
        getClass: () => class Controlador { },
        switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
}

describe('PermissionsGuard', () => {
    const usuario = {
        id: 'user-1',
        permissions: ['joven:view', 'formacion:view'],
    };

    it('deniega por defecto cuando el endpoint no declara política de acceso', () => {
        const guard = crearGuard({});
        expect(() => guard.canActivate(crearContexto(usuario))).toThrow(ForbiddenException);
        expect(() => guard.canActivate(crearContexto(usuario))).toThrow(
            'Endpoint sin política de acceso: falta @RequirePermission o @SelfScope',
        );
    });

    it('deniega cuando solo hay metadata vacía de permisos', () => {
        const guard = crearGuard({ permissions: [] });
        expect(() => guard.canActivate(crearContexto(usuario))).toThrow(ForbiddenException);
    });

    it('permite los endpoints marcados con @SelfScope', () => {
        const guard = crearGuard({ selfScope: true });
        expect(guard.canActivate(crearContexto(usuario))).toBe(true);
    });

    it('permite cuando el usuario tiene todos los permisos requeridos', () => {
        const guard = crearGuard({ permissions: ['joven:view', 'formacion:view'] });
        expect(guard.canActivate(crearContexto(usuario))).toBe(true);
    });

    it('deniega cuando falta alguno de los permisos requeridos', () => {
        const guard = crearGuard({ permissions: ['joven:view', 'rbac:manage'] });
        expect(() => guard.canActivate(crearContexto(usuario))).toThrow(
            'Permisos faltantes: rbac:manage',
        );
    });

    it('deniega cuando no hay usuario autenticado', () => {
        const guard = crearGuard({ permissions: ['joven:view'] });
        expect(() => guard.canActivate(crearContexto(undefined))).toThrow(
            'Usuario no autenticado',
        );
    });

    it('prioriza los permisos por encima de @SelfScope si ambos existen', () => {
        const guard = crearGuard({ permissions: ['rbac:manage'], selfScope: true });
        expect(() => guard.canActivate(crearContexto(usuario))).toThrow(ForbiddenException);
    });

    it('un usuario sin permisos no accede a endpoints con @RequirePermission', () => {
        const guard = crearGuard({ permissions: ['joven:view'] });
        expect(() => guard.canActivate(crearContexto({ id: 'user-2', permissions: [] }))).toThrow(
            ForbiddenException,
        );
    });
});
