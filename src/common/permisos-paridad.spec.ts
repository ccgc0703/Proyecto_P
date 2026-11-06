import { readFileSync } from 'fs';
import * as path from 'path';

/**
 * Paridad de permisos backend ↔ frontend (glosario §10.7).
 *
 * `src/common/constantes.ts` (PERMISSIONS) es la fuente canónica; el frontend
 * replica el mismo catálogo en `frontend/src/types/auth.ts` porque no puede
 * importar código del backend. Este test lee ambos archivos con `fs` y compara
 * los conjuntos de strings `'modulo:accion'`, de modo que cualquier permiso
 * añadido/retirado de un lado sin sincronizar el otro rompe la suite.
 */

const BACKEND = path.resolve(__dirname, 'constantes.ts');
const FRONTEND = path.resolve(__dirname, '../../frontend/src/types/auth.ts');

/** Extrae los literales `'modulo:accion'` del bloque `PERMISSIONS = { ... } as const;`. */
function extraerPermisos(archivo: string): Set<string> {
    const fuente = readFileSync(archivo, 'utf8');

    const inicio = fuente.indexOf('PERMISSIONS = {');
    expect(inicio).toBeGreaterThanOrEqual(0);

    const fin = fuente.indexOf('} as const;', inicio);
    expect(fin).toBeGreaterThan(inicio);

    const bloque = fuente.slice(inicio, fin);
    const literales = [...bloque.matchAll(/'([a-z]+:[a-z-]+)'/g)].map((m) => m[1]);

    expect(literales.length).toBeGreaterThan(0);
    return new Set(literales);
}

describe('paridad de permisos backend ↔ frontend', () => {
    const backend = extraerPermisos(BACKEND);
    const frontend = extraerPermisos(FRONTEND);

    it('lee ambos catalogos (sanidad del extractor)', () => {
        expect(backend.size).toBeGreaterThan(0);
        expect(frontend.size).toBeGreaterThan(0);
    });

    it('no hay permisos en el backend ausentes en el frontend', () => {
        const faltantes = [...backend].filter((p) => !frontend.has(p));
        expect(faltantes).toEqual([]);
    });

    it('no hay permisos en el frontend ausentes en el backend', () => {
        const sobrantes = [...frontend].filter((p) => !backend.has(p));
        expect(sobrantes).toEqual([]);
    });

    it('ambos catalogos tienen exactamente las mismas claves', () => {
        expect([...frontend].sort()).toEqual([...backend].sort());
    });
});
