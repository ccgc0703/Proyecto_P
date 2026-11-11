import { BadRequestException } from '@nestjs/common';
import { firmarPresencia, verificarPresencia, PRESENCIA_QR_TTL_MS } from './presencia-qr';

describe('presencia-qr (Fase 7b)', () => {
    const ACTIVIDAD_ID = '11111111-2222-4333-8444-555555555555';

    describe('firmarPresencia', () => {
        it('genera un codigo con formato presencia:v1:<uuid>:<exp>:<firma>', () => {
            const ahora = 1_700_000_000_000;
            const { codigo, expira } = firmarPresencia(ACTIVIDAD_ID, ahora);

            const partes = codigo.split(':');
            expect(partes).toHaveLength(5);
            expect(partes[0]).toBe('presencia');
            expect(partes[1]).toBe('v1');
            expect(partes[2]).toBe(ACTIVIDAD_ID);
            expect(Number(partes[3])).toBe(ahora + PRESENCIA_QR_TTL_MS);
            expect(expira.getTime()).toBe(ahora + PRESENCIA_QR_TTL_MS);
        });

        it('usa base64url (sin +, / ni =)', () => {
            const { codigo } = firmarPresencia(ACTIVIDAD_ID);
            const firma = codigo.split(':')[4];
            expect(firma).not.toMatch(/[+/=]/);
        });
    });

    describe('verificarPresencia', () => {
        it('acepta un codigo recien firmado y devuelve la actividad', () => {
            const ahora = Date.now();
            const { codigo } = firmarPresencia(ACTIVIDAD_ID, ahora);

            const resultado = verificarPresencia(codigo, ahora);
            expect(resultado.actividadId).toBe(ACTIVIDAD_ID);
            expect(resultado.expira.getTime()).toBe(ahora + PRESENCIA_QR_TTL_MS);
        });

        it('rechaza un codigo alterado (id cambiado)', () => {
            const { codigo } = firmarPresencia(ACTIVIDAD_ID);
            const alterado = codigo.replace(ACTIVIDAD_ID, '99999999-9999-4999-8999-999999999999');

            expect(() => verificarPresencia(alterado)).toThrow(BadRequestException);
        });

        it('rechaza una firma manipulada', () => {
            const { codigo } = firmarPresencia(ACTIVIDAD_ID);
            const partes = codigo.split(':');
            partes[4] = partes[4].slice(0, -2) + 'aa';

            expect(() => verificarPresencia(partes.join(':'))).toThrow(BadRequestException);
        });

        it('rechaza un codigo vencido', () => {
            const ahora = Date.now();
            const { codigo } = firmarPresencia(ACTIVIDAD_ID, ahora - PRESENCIA_QR_TTL_MS - 1);

            expect(() => verificarPresencia(codigo, ahora)).toThrow(BadRequestException);
        });

        it('rechaza formatos desconocidos', () => {
            expect(() => verificarPresencia('')).toThrow(BadRequestException);
            expect(() => verificarPresencia('hola-mundo')).toThrow(BadRequestException);
            expect(() => verificarPresencia('presencia:v9:x:1:y')).toThrow(BadRequestException);
            expect(() => verificarPresencia('jwt:a:b:1:c')).toThrow(BadRequestException);
            expect(() => verificarPresencia('presencia:v1:no-uuid:1:abc')).toThrow(
                BadRequestException,
            );
        });

        it('es deterministico: el mismo codigo y instante producen el mismo resultado', () => {
            const ahora = 1_700_000_000_000;
            const { codigo } = firmarPresencia(ACTIVIDAD_ID, ahora);

            expect(verificarPresencia(codigo, ahora)).toEqual(verificarPresencia(codigo, ahora));
        });
    });
});
