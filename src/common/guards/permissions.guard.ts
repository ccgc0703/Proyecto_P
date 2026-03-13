import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

/**
 * Guard de autorización RBAC.
 *
 * Lee los permisos del usuario directamente desde el JWT payload (sin consulta a DB).
 * El campo `permissions` es inyectado en el JWT por AuthService en el momento del login.
 *
 * Flujo:
 *  JwtAuthGuard (autenticación, 401) → PermissionsGuard (autorización, 403)
 *
 * Sin bypass para SYSTEM_ADMIN: todos los roles, incluido el admin, deben tener
 * sus permisos explícitamente asignados en RolPermiso.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private readonly reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // Obtener permisos requeridos del metadata del decorador
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        // Si el endpoint no tiene @RequirePermission, se permite el acceso
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // Si no hay usuario (no debería pasar si JwtAuthGuard está antes, pero por seguridad)
        if (!user) {
            throw new ForbiddenException('Usuario no autenticado');
        }

        // Leer permisos del JWT payload (cargados en login, sin DB)
        const userPermissions: string[] = user.permissions ?? [];

        // Verificar que el usuario tenga TODOS los permisos requeridos
        const hasAllPermissions = requiredPermissions.every((perm) =>
            userPermissions.includes(perm),
        );

        if (!hasAllPermissions) {
            const missing = requiredPermissions.filter(
                (p) => !userPermissions.includes(p),
            );
            throw new ForbiddenException(
                `Acceso denegado. Permisos faltantes: ${missing.join(', ')}`,
            );
        }

        return true;
    }
}
