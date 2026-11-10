import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

// multer 2.x llega como dependencia transitiva de @nestjs/platform-express y el
// proyecto no instala @types/multer: lo cargamos sin tipos para no acoplar el
// backend a un paquete que no declaramos. La configuración se valida en runtime.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const multer = require('multer');

/** Raíz de subidas (configurable para tests/despliegue). */
export const DIRECTORIO_SUBIDAS = path.resolve(
    process.env.UPLOADS_DIR ?? path.join(process.cwd(), 'uploads'),
);

/** Carpeta concreta de la biblioteca (Fase 5). */
export const DIRECTORIO_NORMATIVA = path.join(DIRECTORIO_SUBIDAS, 'normativa');

/** 10 MB — límite del plan §5.2. */
export const TAMANO_MAXIMO_ARCHIVO = 10 * 1024 * 1024;

/** MIME canónico por extensión permitida. */
const MIME_POR_EXTENSION: Record<string, string> = {
    '.pdf': 'application/pdf',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

/** Forma mínima del archivo que entrega multer (sin @types/multer). */
export interface ArchivoSubido {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination: string;
    filename: string;
    path: string;
}

/** Extensión normalizada de un nombre de archivo ('' si no tiene). */
export function extensionDe(nombre: string): string {
    return path.extname(nombre).toLowerCase();
}

/**
 * MIME canónico para una extensión permitida. Algunos clientes envían
 * `application/octet-stream`; la base de datos siempre guarda el MIME real
 * para que la descarga sirva el `Content-Type` correcto.
 */
export function mimeCanonico(extension: string): string {
    return MIME_POR_EXTENSION[extension] ?? 'application/octet-stream';
}

export function asegurarDirectorio(dir: string = DIRECTORIO_NORMATIVA): void {
    fs.mkdirSync(dir, { recursive: true });
}

/**
 * Valida la firma real del archivo (magic bytes), no solo la extensión:
 *  - PDF: `%PDF`
 *  - DOCX: contenedor ZIP (`PK\x03\x04`)
 */
export function firmaValida(ruta: string, extension: string): boolean {
    const cabecera = Buffer.alloc(4);
    let fd: number | undefined;
    try {
        fd = fs.openSync(ruta, 'r');
        const leidos = fs.readSync(fd, cabecera, 0, 4, 0);
        if (leidos < 4) return false;
    } catch {
        return false;
    } finally {
        if (fd !== undefined) fs.closeSync(fd);
    }

    if (extension === '.pdf') return cabecera.toString('latin1') === '%PDF';
    if (extension === '.docx') {
        return (
            cabecera[0] === 0x50 &&
            cabecera[1] === 0x4b &&
            cabecera[2] === 0x03 &&
            cabecera[3] === 0x04
        );
    }
    return false;
}

/** Borra un archivo temporal sin propagar errores (limpieza best-effort). */
export function eliminarArchivoSiExiste(ruta?: string): void {
    if (!ruta) return;
    try {
        fs.unlinkSync(ruta);
    } catch {
        // El archivo ya no existe o está bloqueado: no es un error de negocio.
    }
}

/**
 * Resuelve una ruta relativa (`normativa/<uuid>.pdf`) dentro de la raíz de
 * subidas y bloquea cualquier intento de path traversal.
 */
export function rutaAbsolutaArchivo(archivoUrl: string): string {
    const absoluta = path.resolve(DIRECTORIO_SUBIDAS, archivoUrl.replace(/\//g, path.sep));
    const relativa = path.relative(DIRECTORIO_SUBIDAS, absoluta);
    if (relativa.startsWith('..') || path.isAbsolute(relativa)) {
        throw new BadRequestException('Ruta de archivo invalida');
    }
    return absoluta;
}

/**
 * Sanea el nombre original para la cabecera `Content-Disposition`:
 * quita comillas, saltos de línea y caracteres de control.
 */
export function nombreDescargaSeguro(nombre: string): { ascii: string; utf8: string } {
    const limpio = nombre.replace(/["\r\n]/g, '_').trim() || 'documento';
    const ascii = limpio.replace(/[^\x20-\x7E]/g, '_');
    return { ascii, utf8: encodeURIComponent(limpio) };
}

/** Opciones de multer: disco, nombre aleatorio, whitelist y 10 MB. */
export const OPCIONES_MULTER = {
    storage: multer.diskStorage({
        destination: (_req: unknown, _file: unknown, cb: (error: Error | null, destino: string) => void) => {
            try {
                asegurarDirectorio();
                cb(null, DIRECTORIO_NORMATIVA);
            } catch (error) {
                cb(error as Error, DIRECTORIO_NORMATIVA);
            }
        },
        filename: (_req: unknown, file: ArchivoSubido, cb: (error: Error | null, nombre: string) => void) => {
            // Nunca se usa el nombre original en disco: uuid + extensión.
            cb(null, `${randomUUID()}${extensionDe(file.originalname)}`);
        },
    }),
    limits: { fileSize: TAMANO_MAXIMO_ARCHIVO, files: 1 },
    fileFilter: (_req: unknown, file: ArchivoSubido, cb: (error: Error | null, aceptar: boolean) => void) => {
        const extension = extensionDe(file.originalname);
        const mimeEsperado = MIME_POR_EXTENSION[extension];

        if (!mimeEsperado) {
            cb(new BadRequestException('Solo se permiten archivos PDF o DOCX'), false);
            return;
        }

        // Algunos navegadores/SO envían application/octet-stream para .docx:
        // la firma real se valida después de escribir el archivo.
        const mimeAceptable =
            file.mimetype === mimeEsperado || file.mimetype === 'application/octet-stream';
        if (!mimeAceptable) {
            cb(new BadRequestException('El tipo MIME no corresponde a un PDF o DOCX'), false);
            return;
        }

        cb(null, true);
    },
};
