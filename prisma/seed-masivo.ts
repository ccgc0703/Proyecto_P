/**
 * F4.6 · Seed masivo: crea ~1000 jóvenes (Miembro + Joven + Representante + DatosScout)
 * distribuidos entre las unidades activas, respetando el rango de edad de cada rama.
 *
 * Uso:
 *   npm run seed:masivo                 # crea hasta 1000 (idempotente: completa lo que falte)
 *   npm run seed:masivo -- --limpiar    # elimina antes lo creado por este seed
 *   npm run seed:masivo -- --objetivo 500
 *
 * Idempotencia: se identifica por Miembro.createdBy = 'seed-masivo'.
 */
import { PrismaClient, Genero } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const MARCA = 'seed-masivo';
const OBJETIVO_DEFECTO = 1000;
const JOVENES_POR_REPRESENTANTE = 4;
const TAMANO_LOTE = 200;

/** Rangos de edad por rama (misma regla que JovenesService). */
const RANGOS: Record<string, { min: number; max: number }> = {
    Manada: { min: 6, max: 10 },
    Tropa: { min: 10, max: 15 },
    Comunidad: { min: 15, max: 18 },
    Clan: { min: 18, max: 21 },
};

const NOMBRES = [
    'JUAN', 'MARIA', 'JOSE', 'ANA', 'LUIS', 'LAURA', 'CARLOS', 'SOFIA',
    'PEDRO', 'VALERIA', 'DIEGO', 'ISABELA', 'ANDRES', 'CAMILA', 'MIGUEL',
    'LUCIA', 'FRANCISCO', 'PAULA', 'RAFAEL', 'ELENA', 'DANIEL', 'TRIANA',
    'SEBASTIAN', 'MARTINA', 'ALEJANDRO', 'JULIANA', 'GABRIEL', 'RENATA',
    'FELILO', 'ANTONIA', 'EMILIO', 'CONCEPCION', 'MATEO', 'SARA', 'TOMAS',
    'ADELA', 'IGNACIO', 'BEATRIZ', 'HUGO', 'CECILIA',
];

const APELLIDOS = [
    'GARCIA', 'RODRIGUEZ', 'LOPEZ', 'MARTINEZ', 'HERNANDEZ', 'GONZALEZ',
    'PEREZ', 'SANCHEZ', 'RAMIREZ', 'TORRES', 'FLORES', 'RIVERA', 'MORALES',
    'CASTRO', 'ORTIZ', 'RUIZ', 'ACOSTA', 'VARGA', 'MENDOZA', 'CABRERA',
    'SOLANO', 'PONCE', 'AGUILAR', 'CAMPOS', 'GUERRERO', 'ESPINOZA',
    'BENAVIDES', 'CARDENAS', 'DELGADO', 'ESPINOLA', 'FRANCO', 'GOMEZ',
    'IBARRA', 'JARA', 'KIEFFER', 'LEON', 'MEDINA', 'NAVARRO', 'OCAMPO', 'PANIAGUA',
];

const PARENTESCOS = ['MADRE', 'PADRE', 'TUTOR', 'TUTORA'];

/** PRNG determinista (LCG) para que dos corridas produzcan los mismos datos. */
let semilla = 20261004;
function rnd(): number {
    semilla = (semilla * 1664525 + 1013904223) % 4294967296;
    return semilla / 4294967296;
}
function pick<T>(arr: T[]): T {
    return arr[Math.floor(rnd() * arr.length)];
}
function entero(min: number, max: number): number {
    return min + Math.floor(rnd() * (max - min + 1));
}

/** Fecha de nacimiento que produce exactamente `edad` años según el cálculo del servicio. */
function nacimientoConEdad(edad: number): Date {
    const hoy = new Date();
    const mes = entero(0, 11);
    const dia = entero(1, 28);
    const despues = mes > hoy.getMonth() || (mes === hoy.getMonth() && dia > hoy.getDate());
    const anio = despues ? hoy.getFullYear() - edad - 1 : hoy.getFullYear() - edad;
    return new Date(anio, mes, dia);
}

async function limpiar(): Promise<void> {
    const miembros = await prisma.miembro.findMany({
        where: { createdBy: MARCA },
        select: { id: true },
    });
    const ids = miembros.map((m) => m.id);

    let jovenes = 0;
    let fichas = 0;
    for (let i = 0; i < ids.length; i += 500) {
        const lote = ids.slice(i, i + 500);
        jovenes += (await prisma.joven.deleteMany({ where: { miembroId: { in: lote } } })).count;
        fichas += (await prisma.datosScout.deleteMany({ where: { miembroId: { in: lote } } })).count;
    }
    const miembroBorrados = (await prisma.miembro.deleteMany({ where: { createdBy: MARCA } })).count;
    const representantes = (await prisma.representante.deleteMany({ where: { createdBy: MARCA } })).count;

    console.log(
        `Limpieza: ${jovenes} jovenes, ${fichas} fichas scout, ${miembroBorrados} miembros, ${representantes} representantes eliminados.`,
    );
}

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const objetivoIdx = args.indexOf('--objetivo');
    const objetivo = objetivoIdx >= 0 && args[objetivoIdx + 1]
        ? parseInt(args[objetivoIdx + 1], 10)
        : OBJETIVO_DEFECTO;

    if (!Number.isFinite(objetivo) || objetivo <= 0) {
        console.error('Objetivo inválido.');
        process.exit(1);
    }

    if (args.includes('--limpiar')) {
        await limpiar();
        return;
    }

    const inicio = Date.now();

    const unidades = await prisma.unidad.findMany({
        where: { deletedAt: null },
        select: { id: true, nombre: true },
        orderBy: { nombre: 'asc' },
    });
    if (unidades.length === 0) {
        console.error('No hay unidades activas. Ejecuta primero `npm run seed`.');
        process.exit(1);
    }

    const existentes = await prisma.miembro.count({ where: { createdBy: MARCA } });
    const porCrear = Math.max(0, objetivo - existentes);

    if (porCrear === 0) {
        const porUnidad = await prisma.miembro.groupBy({
            by: ['unidadId'],
            where: { createdBy: MARCA },
            _count: { _all: true },
        });
        console.log(`Seed masivo ya completo: ${existentes} miembros (objetivo ${objetivo}).`);
        console.log('Distribucion actual:');
        for (const u of unidades) {
            const c = porUnidad.find((p) => p.unidadId === u.id)?._count._all ?? 0;
            console.log(`  - ${u.nombre}: ${c}`);
        }
        return;
    }

    // Representantes compartidos entre hermanos (4 jóvenes c/u)
    const representantesExistentes = await prisma.representante.count({ where: { createdBy: MARCA } });
    const necesarios = Math.ceil(porCrear / JOVENES_POR_REPRESENTANTE);
    const porCrearRep = Math.max(0, necesarios - representantesExistentes);

    const reps = await prisma.representante.findMany({
        where: { createdBy: MARCA },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
    });
    const representanteIds = reps.map((r) => r.id);

    for (let i = 0; i < porCrearRep; i += TAMANO_LOTE) {
        const lote = Array.from({ length: Math.min(TAMANO_LOTE, porCrearRep - i) }, (_, k) => {
            const n = representantesExistentes + i + k + 1;
            return {
                nombre: `${pick(NOMBRES)} ${pick(APELLIDOS)}`,
                cedula: String(89000000 + n),
                telefono: `09${String(entero(10000000, 99999999)).slice(0, 8)}`,
                direccion: `Av. ${pick(APELLIDOS)} ${entero(1, 999)}`,
                parentesco: pick(PARENTESCOS),
                createdBy: MARCA,
            };
        });
        const creados = await prisma.representante.createManyAndReturn({ data: lote });
        representanteIds.push(...creados.map((r) => r.id));
    }

    console.log(
        `Seed masivo: ${existentes}/${objetivo} existentes, creando ${porCrear} jovenes en ${unidades.length} unidades...`,
    );

    let creadosMiembros = 0;
    const porUnidad: Record<string, number> = {};

    for (let inicioLote = 0; inicioLote < porCrear; inicioLote += TAMANO_LOTE) {
        const tam = Math.min(TAMANO_LOTE, porCrear - inicioLote);
        const filasMiembro: any[] = [];

        for (let k = 0; k < tam; k++) {
            const n = existentes + inicioLote + k + 1;
            const unidad = unidades[(n - 1) % unidades.length];
            const rango = RANGOS[unidad.nombre] ?? { min: 8, max: 14 };
            const edad = entero(rango.min, rango.max);

            filasMiembro.push({
                nombres: pick(NOMBRES),
                apellidos: pick(APELLIDOS),
                cedula: String(80000000 + n),
                fechaNacimiento: nacimientoConEdad(edad),
                genero: rnd() < 0.5 ? ('MASCULINO' as Genero) : ('FEMENINO' as Genero),
                tipo: 'JOVEN' as const,
                estado: 'ACTIVO' as const,
                unidadId: unidad.id,
                createdBy: MARCA,
            });
        }

        const miembros = await prisma.miembro.createManyAndReturn({ data: filasMiembro });

        await prisma.joven.createMany({
            data: miembros.map((m, idx) => ({
                miembroId: m.id,
                representanteId: representanteIds[(existentes + inicioLote + idx) % representanteIds.length],
            })),
        });

        await prisma.datosScout.createMany({
            data: miembros.map((m) => ({
                miembroId: m.id,
                fechaRegistro: m.createdAt,
                fechaIngreso: m.createdAt,
                fechaPromesa: rnd() < 0.7 ? m.createdAt : null,
                cargoActual: rnd() < 0.3 ? 'MONITOR' : null,
            })),
        });

        creadosMiembros += miembros.length;
        for (const m of miembros) {
            const u = unidades.find((x) => x.id === m.unidadId);
            const nombre = u?.nombre ?? 's/u';
            porUnidad[nombre] = (porUnidad[nombre] ?? 0) + 1;
        }

        process.stdout.write(`  lote ${inicioLote + tam}/${porCrear}\r`);
    }

    const total = await prisma.miembro.count({ where: { tipo: 'JOVEN', deletedAt: null } });
    const ms = Date.now() - inicio;

    console.log(`\nCreados: ${creadosMiembros} en ${ms} ms.`);
    console.log(`Total de jóvenes activos en el sistema: ${total}.`);
    console.log('Distribucion creada:');
    for (const u of unidades) {
        console.log(`  - ${u.nombre}: ${porUnidad[u.nombre] ?? 0}`);
    }
}

main()
    .catch((err) => {
        console.error('Error en seed masivo:', err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
        await pool.end();
    });
