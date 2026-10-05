import {
    resolverOpcionesLista,
    hayPaginacion,
    paginaEfectiva,
    rangoLista,
    metaPagina,
    filtroBusqueda,
} from './paginacion';

describe('paginacion helpers', () => {
    describe('resolverOpcionesLista', () => {
        it('devuelve objeto vacío sin params', () => {
            expect(resolverOpcionesLista({})).toEqual({});
        });

        it('parsea page y limit válidos', () => {
            expect(resolverOpcionesLista({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
        });

        it('ignora valores no numéricos', () => {
            expect(resolverOpcionesLista({ page: 'abc', limit: 'x.5' })).toEqual({});
        });

        it('acota page >= 1 y limit 1..100', () => {
            expect(resolverOpcionesLista({ page: '0', limit: '999' })).toEqual({ page: 1, limit: 100 });
            expect(resolverOpcionesLista({ limit: '-5' })).toEqual({ limit: 1 });
        });

        it('normaliza q (trim, vacío = omitido, long máx 100)', () => {
            expect(resolverOpcionesLista({ q: '  carlos  ' })).toEqual({ q: 'carlos' });
            expect(resolverOpcionesLista({ q: '   ' })).toEqual({});
            expect(resolverOpcionesLista({ q: 'x'.repeat(150) })).toEqual({ q: 'x'.repeat(100) });
        });
    });

    describe('hayPaginacion / paginaEfectiva / rangoLista', () => {
        it('sin page/limit no pagina (retro-compat)', () => {
            expect(hayPaginacion({})).toBe(false);
            expect(hayPaginacion({ q: 'x' })).toBe(false);
            expect(paginaEfectiva({})).toEqual({ page: 1, limit: 20 });
            expect(rangoLista({})).toEqual({ skip: 0, take: 20 });
        });

        it('con page/limit calcula skip/take', () => {
            expect(hayPaginacion({ page: 2 })).toBe(true);
            expect(rangoLista({ page: 3, limit: 25 })).toEqual({ skip: 50, take: 25 });
        });

        it('solo limit también habilita paginación', () => {
            expect(hayPaginacion({ limit: 10 })).toBe(true);
        });
    });

    describe('metaPagina', () => {
        it('calcula totalPages redondeando hacia arriba', () => {
            expect(metaPagina(95, { page: 2, limit: 50 })).toEqual({
                page: 2, limit: 50, total: 95, totalPages: 2,
            });
        });

        it('total 0 ⇒ totalPages 1', () => {
            expect(metaPagina(0, {})).toEqual({ page: 1, limit: 20, total: 0, totalPages: 1 });
        });
    });

    describe('filtroBusqueda', () => {
        it('devuelve null sin término', () => {
            expect(filtroBusqueda(undefined, ['nombres'])).toBeNull();
            expect(filtroBusqueda('', ['nombres'])).toBeNull();
        });

        it('construye OR case-insensitive por campo', () => {
            expect(filtroBusqueda('ana', ['nombres', 'apellidos'])).toEqual({
                OR: [
                    { nombres: { contains: 'ana', mode: 'insensitive' } },
                    { apellidos: { contains: 'ana', mode: 'insensitive' } },
                ],
            });
        });
    });
});
