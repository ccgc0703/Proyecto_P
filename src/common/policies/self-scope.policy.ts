import { ForbiddenException, Injectable } from '@nestjs/common';
import { RBAC_ROLES } from '../constantes';

/**
 * SelfScopePolicy — Control de acceso "solo los propios datos" para la
 * cuenta del joven (rol JOVEN).
 *
 * - `assertSelf`: el rol JOVEN solo puede operar sobre su propio miembro
 *   (el resto de roles pasan sin restricción: su alcance lo define RBAC/ABAC).
 * - `assertNotJoven`: bloquea operaciones a nivel lista/unidad/global para
 *   cuentas jóvenes (defensa en profundidad en endpoints donde el joven
 *   sí tiene el permiso pero no debe ver datos de terceros).
 */
@Injectable()
export class SelfScopePolicy {
    isJoven(user: any): boolean {
        return Array.isArray(user?.roles) && user.roles.includes(RBAC_ROLES.JOVEN);
    }

    /** El rol JOVEN solo puede acceder a su propio miembro. */
    assertSelf(user: any, miembroId?: string | null): void {
        if (!this.isJoven(user)) return;
        if (!user.miembroId || !miembroId || user.miembroId !== miembroId) {
            throw new ForbiddenException('Solo puedes accederer a tu propia información');
        }
    }

    /** Prohíbe al rol JOVEN operaciones a nivel lista/unidad/global. */
    assertNotJoven(user: any): void {
        if (this.isJoven(user)) {
            throw new ForbiddenException('La cuenta joven solo puede acceder a su propia información');
        }
    }
}
