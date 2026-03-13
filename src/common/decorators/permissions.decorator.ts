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
