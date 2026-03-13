/**
 * Guard para controlar el acceso según el rol del usuario y su pertenencia a unidad.
 * Implementa una jerarquía donde el ADMIN tiene acceso total.
 */
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ROLES } from '../constantes';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        if (!user) {
            return false;
        }

        // El Administrador tiene acceso total
        // Los administradores no tienen restricciones de acceso
        if (user.rol === ROLES.ADMIN) return true;

        // Verifica que el rol del usuario esté entre los permitidos para la ruta
        const hasRole = requiredRoles.some((role) => user.rol === role);

        if (!hasRole) {
            throw new ForbiddenException('No tienes permisos para realizar esta acción');
        }

        // Lógica adicional para Aislamiento de Unidad (Aislamiento por Unidad / Multi-tenant Horizontal)
        const rolesRestringidos = [
            ROLES.JEFE_GRUPO,
            ROLES.SUBJEFE_GRUPO,
            ROLES.ADULTO_MANADA,
            ROLES.ADULTO_TROPA,
            ROLES.ADULTO_CLAN,
        ];

        if (rolesRestringidos.includes(user.rol)) {
            const request = context.switchToHttp().getRequest();
            const targetUnidadId = request.params.unidadId || request.query.unidadId || request.body.unidadId;

            // Si el endpoint intenta acceder o asignar una unidad, verificamos que sea la del usuario
            if (targetUnidadId && targetUnidadId !== user.unidadId) {
                throw new ForbiddenException('Aislamiento por Unidad: Solo puedes gestionar datos de tu propia unidad asignada');
            }
        }

        return true;
    }
}
