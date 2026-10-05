import * as fs from 'fs';
import * as path from 'path';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { PermissionsGuard } from './permissions.guard';
import { PERMISSIONS_KEY, SELF_SCOPE_KEY } from '../decorators/permissions.decorator';

/**
 * Invariante de seguridad: todo endpoint protegido por PermissionsGuard debe
 * declarar una política de acceso explícita (@RequirePermission o @SelfScope).
 * Si se agrega un controller/route sin política, este test falla.
 */

// Controllers que se protegen de otra forma (o son públicos por diseño):
//  - AuthController: login público; logout/refresh/me usan solo JwtAuthGuard
//                    y operan siempre sobre el id del token.
//  - HealthController: sonda pública de infraestructura.
const CONTROLADORES_SIN_PERMISSIONS_GUARD = new Set(['AuthController', 'HealthController']);

const SRC = path.resolve(__dirname, '..', '..');

// @nestjs/mapped-types@12 es ESM-only y Jest corre en CJS; para leer la
// metadata de rutas basta con heredar los campos del DTO base.
jest.mock('@nestjs/mapped-types', () => ({
    PartialType: (base: new (...args: any[]) => any) => class extends (base as any) { },
    OmitType: (base: new (...args: any[]) => any, _keys: unknown) => class extends (base as any) { },
}));

function listarControllers(dir: string): string[] {
    const archivos: string[] = [];
    for (const entrada of fs.readdirSync(dir, { withFileTypes: true })) {
        const ruta = path.join(dir, entrada.name);
        if (entrada.isDirectory()) {
            archivos.push(...listarControllers(ruta));
        } else if (entrada.name.endsWith('.controller.ts')) {
            archivos.push(ruta);
        }
    }
    return archivos;
}

function analizarControlador(archivo: string): string[] {
    const modulo = require(archivo) as Record<string, unknown>;
    const violaciones: string[] = [];

    for (const [nombre, exportado] of Object.entries(modulo)) {
        if (typeof exportado !== 'function' || !nombre.endsWith('Controller')) continue;

        const clase = exportado as any;
        const guards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, clase) ?? [];
        const sinProteger = !guards.includes(PermissionsGuard);

        if (sinProteger) {
            if (!CONTROLADORES_SIN_PERMISSIONS_GUARD.has(nombre)) {
                violaciones.push(
                    `${nombre}: no usa PermissionsGuard (agregar @UseGuards(JwtAuthGuard, PermissionsGuard) ` +
                    `o registrar la excepción en ${path.basename(__filename)})`,
                );
            }
            continue;
        }

        const permisosClase: string[] | undefined = Reflect.getMetadata(PERMISSIONS_KEY, clase);
        const selfScopeClase: boolean | undefined = Reflect.getMetadata(SELF_SCOPE_KEY, clase);

        // Los métodos de clase son no-enumerables: usar getOwnPropertyNames.
        for (const nombreMetodo of Object.getOwnPropertyNames(clase.prototype)) {
            const metodo = clase.prototype[nombreMetodo];
            if (typeof metodo !== 'function' || nombreMetodo === 'constructor') continue;
            if (!Reflect.hasMetadata(PATH_METADATA, metodo)) continue;

            const permisos: string[] | undefined =
                Reflect.getMetadata(PERMISSIONS_KEY, metodo) ?? permisosClase;
            const selfScope: boolean | undefined =
                Reflect.getMetadata(SELF_SCOPE_KEY, metodo) ?? selfScopeClase;

            if (!permisos?.length && !selfScope) {
                const metodoRuta: string = Reflect.getMetadata(PATH_METADATA, metodo) ?? '(ruta)';
                violaciones.push(
                    `${nombre}.${nombreMetodo} [${metodoRuta}]: sin @RequirePermission ni @SelfScope`,
                );
            }
        }
    }

    return violaciones;
}

describe('cobertura de la política de acceso (denegar por defecto)', () => {
    const archivos = listarControllers(path.join(SRC, 'modules'));

    it('encuentra todos los controllers del proyecto', () => {
        expect(archivos.length).toBeGreaterThan(10);
    });

    it('todo controller con PermissionsGuard protege cada ruta con permiso o @SelfScope', () => {
        const violaciones = archivos.flatMap(analizarControlador);
        expect(violaciones).toEqual([]);
    });

    it('ningún controller queda fuera del PermissionsGuard sin excepción declarada', () => {
        const inesperados: string[] = [];
        for (const archivo of archivos) {
            const modulo = require(archivo) as Record<string, unknown>;
            for (const [nombre, exportado] of Object.entries(modulo)) {
                if (typeof exportado !== 'function' || !nombre.endsWith('Controller')) continue;
                const guards: unknown[] = Reflect.getMetadata(GUARDS_METADATA, exportado) ?? [];
                if (!guards.includes(PermissionsGuard) && !CONTROLADORES_SIN_PERMISSIONS_GUARD.has(nombre)) {
                    inesperados.push(nombre);
                }
            }
        }
        expect(inesperados).toEqual([]);
    });
});
