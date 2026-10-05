import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { PrismaClient, RamaUnidad, TipoArea } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const ROOT = path.resolve(__dirname, '..');
const ACTOR = 'importar-indicadores';

// ─── Catálogo base ────────────────────────────────────────────────────────

interface AreaDef {
    sheet: string;
    nombre: string;
    orden: number;
    tipo?: TipoArea;
}

const AREAS: AreaDef[] = [
    { sheet: '1. Corporalidad', nombre: 'Corporalidad', orden: 1 },
    { sheet: '2. Creatividad', nombre: 'Creatividad', orden: 2 },
    { sheet: '3. Caracter', nombre: 'Carácter', orden: 3 },
    { sheet: '4. Afectividad', nombre: 'Afectividad', orden: 4 },
    { sheet: '5. Sociabilidad', nombre: 'Sociabilidad', orden: 5 },
    { sheet: '6. Espiritualidad', nombre: 'Espiritualidad', orden: 6 },
    { sheet: '', nombre: 'Prueba de Adelanto', orden: 7, tipo: 'PRUEBA_ADELANTO' },
];

const ETAPAS = [
    { numero: 1, nombre: '1ª Etapa', rama: 'MANADA' as RamaUnidad },
    { numero: 2, nombre: '2ª Etapa', rama: 'MANADA' as RamaUnidad },
    { numero: 3, nombre: '3ª Etapa', rama: 'TROPA' as RamaUnidad },
    { numero: 4, nombre: '4ª Etapa', rama: 'TROPA' as RamaUnidad },
    { numero: 5, nombre: '5ª Etapa', rama: 'COMUNIDAD' as RamaUnidad },
    { numero: 6, nombre: '6ª Etapa', rama: 'CLAN' as RamaUnidad },
];

/** Ramas que heredan el pool completo de cada etapa. */
const ETAPA_RAMA: Record<number, RamaUnidad> = {
    1: 'MANADA',
    2: 'MANADA',
    3: 'TROPA',
    4: 'TROPA',
    5: 'COMUNIDAD',
    6: 'CLAN',
};

/**
 * Split de la 5ª etapa: Comunidad se queda con los primeros N de cada área,
 * el resto (20 indicadores) queda como pool de Clan. Total 84 / 59.
 */
const COMUNIDAD_QUOTA: Record<string, number> = {
    Corporalidad: 14,
    Creatividad: 12,
    'Carácter': 13,
    Afectividad: 14,
    Sociabilidad: 22,
    Espiritualidad: 9,
};

/** Archivos Excel por unidad y columna de cada etapa (índice de columna en la fila). */
const ARCHIVOS = [
    { unidad: 'Manada', prefijo: '(MANADA)', columnas: [{ col: 0, etapa: 1 }, { col: 4, etapa: 2 }] },
    { unidad: 'Tropa', prefijo: '(TROPA)', columnas: [{ col: 0, etapa: 3 }, { col: 4, etapa: 4 }] },
    { unidad: 'Clan', prefijo: '(CLAN)', columnas: [{ col: 0, etapa: 5 }, { col: 4, etapa: 6 }] },
];

interface AdelantoDef {
    orden: number;
    nombre: string;
    umbral: number | null;
}

const ADELANTOS: Record<RamaUnidad, AdelantoDef[]> = {
    MANADA: [
        { orden: 1, nombre: 'Huella Fresca', umbral: null },
        { orden: 2, nombre: 'Huella Alerta', umbral: 50 },
        { orden: 3, nombre: 'Huella Ágil', umbral: 70 },
        { orden: 4, nombre: 'Huella Libre', umbral: 80 },
        { orden: 5, nombre: 'Lobo Saltarín', umbral: 100 },
    ],
    TROPA: [
        { orden: 1, nombre: 'Aventurero', umbral: null },
        { orden: 2, nombre: 'Explorador', umbral: 50 },
        { orden: 3, nombre: 'Pionero', umbral: 70 },
        { orden: 4, nombre: 'Scout de Bolívar', umbral: 100 },
    ],
    COMUNIDAD: [
        { orden: 1, nombre: 'Peregrino', umbral: null },
        { orden: 2, nombre: 'Precursor', umbral: 50 },
        { orden: 3, nombre: 'Viajero', umbral: 70 },
        { orden: 4, nombre: 'Visionario', umbral: 100 },
    ],
    CLAN: [
        { orden: 1, nombre: 'Expedicionario', umbral: null },
        { orden: 2, nombre: 'Descubridor', umbral: 50 },
        { orden: 3, nombre: 'Fundador', umbral: 70 },
        { orden: 4, nombre: 'Rover Ciudadano', umbral: 100 },
    ],
};

/** Pruebas aisladas (adelanto #1): hojas especiales del Excel. */
interface PruebaDef {
    rama: RamaUnidad;
    etapa: number;
    hoja: string;
    columnas: number[];
    /** Unidad cuyo Excel se lee (identificador en ARCHIVOS). */
    archivo: string;
}

const PRUEBAS: PruebaDef[] = [
    { rama: 'MANADA', etapa: 1, hoja: 'Lobato(a)', columnas: [0], archivo: 'Manada' },
    { rama: 'TROPA', etapa: 3, hoja: 'Aventurero', columnas: [0], archivo: 'Tropa' },
    { rama: 'CLAN', etapa: 6, hoja: 'Precursor', columnas: [0, 12], archivo: 'Clan' },
    // Peregrino (Comunidad) reutiliza los 6 ítems de la hoja "Precursor" del Excel del Clan.
    { rama: 'COMUNIDAD', etapa: 5, hoja: 'Precursor', columnas: [0, 12], archivo: 'Clan' },
];

const ESPERADO_POOL: Record<RamaUnidad, number> = {
    MANADA: 181,
    TROPA: 197,
    COMUNIDAD: 84,
    CLAN: 59,
};

const ESPERADO_PRUEBA: Record<RamaUnidad, number> = {
    MANADA: 13,
    TROPA: 9,
    COMUNIDAD: 6,
    CLAN: 6,
};

const ESPERADO_ADELANTOS: Record<RamaUnidad, number> = {
    MANADA: 5,
    TROPA: 4,
    COMUNIDAD: 4,
    CLAN: 4,
};

// ─── Utilidades ───────────────────────────────────────────────────────────

/**
 * Correcciones de texto aplicadas al importar. La fuente oficial (Excel) manda,
 * pero estos erratas se normalizan para que el sistema muestre el texto correcto
 * aunque se vuelva a ejecutar la importación.
 */
const CORRECCIONES: Record<string, string> = {
    Instropección: 'Introspección',
};

const clean = (v: unknown): string => {
    const s = String(v ?? '')
        .replace(/\s+/g, ' ')
        .trim();
    return CORRECCIONES[s] ?? s;
};

const ERROR = { hubo: false, detalle: [] as string[] };

function check(cond: boolean, msg: string): void {
    if (!cond) {
        ERROR.hubo = true;
        ERROR.detalle.push(msg);
    }
    console.log(`  ${cond ? '✅' : '❌'} ${msg}`);
}

function buscarExcel(prefijo: string): string {
    const hit = fs.readdirSync(ROOT).find((f) => f.startsWith(prefijo) && f.endsWith('.xlsx'));
    if (!hit) throw new Error(`No se encontró el Excel con prefijo "${prefijo}" en ${ROOT}`);
    return path.join(ROOT, hit);
}

interface IndicadorPendiente {
    etapa: number;
    area: string;
    rama: RamaUnidad;
    codigo: string;
    texto: string;
    orden: number;
}

function leerIndicadores(): IndicadorPendiente[] {
    const out: IndicadorPendiente[] = [];

    for (const archivo of ARCHIVOS) {
        const file = buscarExcel(archivo.prefijo);
        const wb = XLSX.readFile(file);
        console.log(`\n📖 ${archivo.unidad}: ${path.basename(file)}`);

        for (const area of AREAS.filter((a) => a.sheet)) {
            const ws = wb.Sheets[area.sheet];
            if (!ws) throw new Error(`Falta la hoja "${area.sheet}" en ${path.basename(file)}`);
            const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) as unknown[][];

            for (const col of archivo.columnas) {
                const esImpar = col.etapa % 2 === 1;
                const re = esImpar ? /^[a-z]{1,2}$/ : /^[A-Z]{1,2}$/;
                let orden = 0;

                rows.forEach((row, i) => {
                    const codigo = clean(row[col.col]);
                    const texto = clean(row[col.col + 1]);
                    if (!codigo) return; // filas de encabezado o vacías

                    if (!re.test(codigo)) {
                        console.log(`      ⚠ fila ${i} col ${col.col} (etapa ${col.etapa}) código no reconocido: "${codigo}"`);
                        return;
                    }
                    if (!texto) {
                        throw new Error(`${area.sheet} etapa ${col.etapa} código "${codigo}" sin texto`);
                    }

                    orden += 1;
                    out.push({
                        etapa: col.etapa,
                        area: area.nombre,
                        rama: ETAPA_RAMA[col.etapa],
                        codigo,
                        texto,
                        orden,
                    });
                });
            }
        }
    }

    return out;
}

function leerPrueba(p: PruebaDef): string[] {
    const archivo = ARCHIVOS.find((a) => a.unidad === p.archivo)!;
    const wb = XLSX.readFile(buscarExcel(archivo.prefijo));
    const ws = wb.Sheets[p.hoja];
    if (!ws) throw new Error(`Falta la hoja "${p.hoja}"`);
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null, raw: true }) as unknown[][];

    const EXCLUIR = new Set(['precursor', 'basicas', 'opcionales']);
    const items: string[] = [];

    for (const col of p.columnas) {
        rows.forEach((row, i) => {
            if (i === 0) return; // título de la hoja
            const texto = clean(row[col]);
            if (!texto) return;
            if (EXCLUIR.has(texto.toLowerCase())) return;
            items.push(texto);
        });
    }
    return items;
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

    console.log('🚚 Importación de indicadores de logro\n');

    // 2. Áreas de crecimiento
    const areas: Record<string, string> = {};
    for (const a of AREAS) {
        const row = await prisma.areaCrecimiento.upsert({
            where: { nombre: a.nombre },
            update: { orden: a.orden, tipo: a.tipo ?? 'AREA_CRECIMIENTO', activo: true, deletedAt: null, updatedBy: ACTOR },
            create: { nombre: a.nombre, orden: a.orden, tipo: a.tipo ?? 'AREA_CRECIMIENTO', createdBy: ACTOR },
        });
        areas[a.nombre] = row.id;
    }
    console.log(`✅ ${AREAS.length} áreas de crecimiento`);

    // 3. Etapas
    const etapas: Record<number, string> = {};
    for (const e of ETAPAS) {
        const row = await prisma.etapa.upsert({
            where: { numero: e.numero },
            update: { nombre: e.nombre, rama: e.rama, activo: true, deletedAt: null, updatedBy: ACTOR },
            create: {
                numero: e.numero,
                nombre: e.nombre,
                rama: e.rama,
                createdBy: ACTOR,
            },
        });
        etapas[e.numero] = row.id;
    }
    console.log(`✅ ${ETAPAS.length} etapas`);

    // 4. Indicadores desde Excel
    const pendientes = leerIndicadores();
    console.log(`\n📄 Indicadores leídos del Excel: ${pendientes.length}`);

    // Split de la 5ª etapa: Comunidad se lleva los primeros N de cada área.
    for (const p of pendientes) {
        if (p.etapa !== 5) continue;
        const quota = COMUNIDAD_QUOTA[p.area];
        if (quota === undefined) throw new Error(`Sin cuota para el área "${p.area}"`);
        p.rama = p.orden <= quota ? 'COMUNIDAD' : 'CLAN';
    }

    // 5. Pruebas aisladas → área "Prueba de Adelanto"
    const pruebas: IndicadorPendiente[] = [];
    for (const p of PRUEBAS) {
        const items = leerPrueba(p);
        console.log(`   🔹 Prueba ${p.rama} (${p.hoja}): ${items.length} ítems`);
        items.forEach((texto, i) => {
            pruebas.push({
                etapa: p.etapa,
                area: 'Prueba de Adelanto',
                rama: p.rama,
                codigo: String(i + 1),
                texto,
                orden: i + 1,
            });
        });
    }

    const todos = [...pendientes, ...pruebas];

    // 6. Upsert por (etapa, área, código)
    const clavesComputadas = new Set<string>();
    for (const t of todos) {
        const key = `${etapas[t.etapa]}|${areas[t.area]}|${t.codigo}`;
        clavesComputadas.add(key);
        await prisma.indicadorLogro.upsert({
            where: { etapaId_areaId_codigo: { etapaId: etapas[t.etapa], areaId: areas[t.area], codigo: t.codigo } },
            update: {
                texto: t.texto,
                orden: t.orden,
                rama: t.rama,
                activo: true,
                deletedAt: null,
                updatedBy: ACTOR,
            },
            create: {
                codigo: t.codigo,
                texto: t.texto,
                etapaId: etapas[t.etapa],
                areaId: areas[t.area],
                rama: t.rama,
                orden: t.orden,
                createdBy: ACTOR,
            },
        });
    }

    // Baja de indicadores que ya no existen en el Excel
    const existentes = await prisma.indicadorLogro.findMany({
        where: { deletedAt: null },
        select: { id: true, etapaId: true, areaId: true, codigo: true },
    });
    const aDarDeBaja = existentes.filter(
        (e) => !clavesComputadas.has(`${e.etapaId}|${e.areaId}|${e.codigo}`),
    );
    if (aDarDeBaja.length) {
        await prisma.indicadorLogro.updateMany({
            where: { id: { in: aDarDeBaja.map((e) => e.id) } },
            data: { deletedAt: new Date(), updatedBy: ACTOR },
        });
    }
    console.log(`✅ ${todos.length} indicadores importados (${aDarDeBaja.length} dados de baja)`);

    // 7. Adelantos
    for (const [rama, lista] of Object.entries(ADELANTOS) as [RamaUnidad, AdelantoDef[]][]) {
        for (const a of lista) {
            await prisma.adelanto.upsert({
                where: { rama_orden: { rama, orden: a.orden } },
                update: {
                    nombre: a.nombre,
                    umbralPorcentaje: a.umbral,
                    edadMinima: null,
                    activo: true,
                    deletedAt: null,
                    updatedBy: ACTOR,
                },
                create: {
                    rama,
                    orden: a.orden,
                    nombre: a.nombre,
                    umbralPorcentaje: a.umbral,
                    createdBy: ACTOR,
                },
            });
        }
    }
    console.log(`✅ ${Object.values(ADELANTOS).reduce((n, l) => n + l.length, 0)} adelantos`);

    // 8. Verificación
    console.log('\n🔍 Verificación');

    const filas = await prisma.indicadorLogro.findMany({
        where: { deletedAt: null },
        select: { rama: true, areaId: true, Area: { select: { tipo: true } } },
    });

    const totalIndicadores = filas.length;
    const poolEsperadoTotal = Object.values(ESPERADO_POOL).reduce((a, b) => a + b, 0);
    const pruebaEsperadaTotal = Object.values(ESPERADO_PRUEBA).reduce((a, b) => a + b, 0);
    check(
        totalIndicadores === poolEsperadoTotal + pruebaEsperadaTotal,
        `Total de indicadores = ${totalIndicadores} (esperado ${poolEsperadoTotal} de pool + ${pruebaEsperadaTotal} de prueba = ${poolEsperadoTotal + pruebaEsperadaTotal})`,
    );

    const poolDe = (rama: RamaUnidad, tipo: TipoArea) =>
        filas.filter((f) => f.rama === rama && f.Area.tipo === tipo);

    for (const [rama, esperado] of Object.entries(ESPERADO_POOL) as [RamaUnidad, number][]) {
        const n = poolDe(rama, 'AREA_CRECIMIENTO').length;
        check(n === esperado, `Pool ${rama} = ${n} (esperado ${esperado})`);
    }

    const poolSuma = Object.values(ESPERADO_POOL).reduce((a, b) => a + b, 0);
    check(poolSuma === 521, `Suma de pools = ${poolSuma} (esperado 521)`);

    for (const [rama, esperado] of Object.entries(ESPERADO_PRUEBA) as [RamaUnidad, number][]) {
        const n = poolDe(rama, 'PRUEBA_ADELANTO').length;
        check(n === esperado, `Prueba aislada ${rama} = ${n} (esperado ${esperado})`);
    }

    for (const [rama, esperado] of Object.entries(ESPERADO_ADELANTOS) as [RamaUnidad, number][]) {
        const n = await prisma.adelanto.count({ where: { rama, deletedAt: null } });
        check(n === esperado, `Adelantos ${rama} = ${n} (esperado ${esperado})`);
    }

    // Cada rama tiene indicadores de las 6 áreas de crecimiento
    for (const rama of Object.keys(ESPERADO_POOL) as RamaUnidad[]) {
        const areasCon = new Set(poolDe(rama, 'AREA_CRECIMIENTO').map((f) => f.areaId));
        check(areasCon.size === 6, `${rama}: ${areasCon.size} áreas de crecimiento con indicadores (esperado 6)`);
    }

    // Umbrales calculados con floor
    console.log('\n📐 Umbrales (floor(pool × pct / 100))');
    for (const [rama, lista] of Object.entries(ADELANTOS) as [RamaUnidad, AdelantoDef[]][]) {
        const pool = ESPERADO_POOL[rama];
        const umbrales = lista
            .map((a) => (a.umbral === null ? `${a.nombre} (prueba aislada)` : `${a.nombre} → ${Math.floor((pool * a.umbral) / 100)}`))
            .join(' · ');
        console.log(`   ${rama} (pool ${pool}): ${umbrales}`);
    }

    await prisma.$disconnect();

    if (ERROR.hubo) {
        console.error('\n❌ La importación NO superó la verificación:');
        ERROR.detalle.forEach((d) => console.error(`   - ${d}`));
        process.exit(1);
    }
    console.log('\n✅ Importación completa y verificada.');
}

main().catch((e) => {
    console.error('\n❌ Error:', e);
    process.exit(1);
});
