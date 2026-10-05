import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorador que indica qué permisos RBAC son requeridos para acceder a un endpoint.
 * Usar con PermissionsGuard.
 *
 * @example
 * @RequirePermission(PERMISSIONS.USER_CREATE)
 * @Post()
 * create() { ... }
 */
export const RequirePermission = (...permissions: string[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);

export const SELF_SCOPE_KEY = 'selfScope';

/**
 * Marca un endpoint cuyo alcance lo define la identidad del usuario
 * autenticado (siempre opera sobre sus propios datos), sin permiso RBAC.
 *
 * Sin este decorador ni @RequirePermission, PermissionsGuard DENIEGA el acceso.
 *
 * @example
 * @SelfScope()
 * @Patch('me')
 * updateMe() { ... }
 */
export const SelfScope = () => SetMetadata(SELF_SCOPE_KEY, true);
