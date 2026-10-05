import { ExportService, JovenExport, UnidadExport } from './export.service';
import * as ExcelJS from 'exceljs';

const joven = (sobrescribir: Partial<JovenExport> = {}): JovenExport => ({
    miembroId: 'm1',
    nombres: 'JUAN',
    apellidos: 'PEREZ',
    fechaNacimiento: new Date('2012-01-01'),
    unidad: 'Tropa',
    etapas: '3ª, 4ª etapas',
    adelantoActual: { orden: 2, nombre: 'Explorador', umbralPorcentaje: 50 },
    evaluacion: {
        esPruebaAislada: false,
        poolTotal: 10,
        requerido: 5,
        completados: 5,
        porcentajeActual: 50,
        faltantes: 0,
        apto: true,
        bloqueo: null,
    },
    porArea: [
        { area: 'Corporalidad', total: 10, completados: 5, enProceso: 2, pendienteAprobacion: 1, pendientes: 2 },
    ],
    indicadores: [
        ...Array.from({ length: 10 }, (_, i) => ({
            codigo: `c${i + 1}`,
            texto: `Indicador ${i + 1}`,
            area: 'Corporalidad',
            areaTipo: 'AREA_CRECIMIENTO',
            estado: i < 5 ? 'COMPLETADO' : 'PENDIENTE',
        })),
        {
            codigo: '1',
            texto: 'Item de prueba',
            area: 'Prueba de Adelanto',
            areaTipo: 'PRUEBA_ADELANTO',
            estado: 'COMPLETADO',
        },
    ],
    historial: [
        {
            orden: 1,
            nombre: 'Aventurero',
            estado: 'APROBADA',
            fechaInicio: new Date('2025-01-01'),
            fechaCulminacion: new Date('2025-06-01'),
            aprobadoPor: 'user-1',
        },
    ],
    generadoEn: new Date('2026-09-25T10:00:00Z'),
    ...sobrescribir,
});

const unidad = (jovenes: JovenExport[]): UnidadExport => ({
    unidad: { id: 'u1', nombre: 'Tropa', etapas: '3ª, 4ª etapas', poolTotal: 10 },
    adelantos: [
        { orden: 1, nombre: 'Aventurero', umbralPorcentaje: null, requerido: 0 },
        { orden: 2, nombre: 'Explorador', umbralPorcentaje: 50, requerido: 5 },
    ],
    jovenes,
});

const leer = async (buffer: Buffer): Promise<ExcelJS.Workbook> => {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as any);
    return wb;
};

describe('ExportService', () => {
    let service: ExportService;

    beforeEach(() => {
        service = new ExportService();
    });

    it('renderJoven produce un .xlsx válido con las hojas Resumen e Indicadores', async () => {
        const buffer = await service.renderJoven(joven());

        expect(Buffer.isBuffer(buffer)).toBe(true);
        expect(buffer.length).toBeGreaterThan(1000);
        expect(buffer.subarray(0, 2).toString('ascii')).toBe('PK');

        const wb = await leer(buffer);
        expect(wb.worksheets.map((w) => w.name)).toEqual(['Resumen', 'Indicadores']);

        const resumen = wb.getWorksheet('Resumen')!;
        expect(String(resumen.getCell('A1').value)).toContain('CUADRO DE ADELANTO');
        expect(resumen.getCell('B5').value).toBe('PEREZ, JUAN');
        expect(resumen.getCell('B10').value).toBe('N.º 2 — Explorador');
        expect(resumen.getCell('B11').value).toBe('50 % → 5 de 10');
        expect(resumen.getCell('B12').value).toBe('5 de 10 (50 %)');
        expect(resumen.getCell('B14').value).toBe('Apto para solicitar el ascenso');
        expect(resumen.getCell('A18').value).toBe('Corporalidad');
        expect(resumen.getCell('A19').value).toBe('TOTAL');
        expect(resumen.getCell('A23').value).toBe('N.º 1 — Aventurero');
        expect(resumen.getCell('E23').value).toBe('Aprobada');
    });

    it('renderJoven lista los indicadores agrupados por area con su estado', async () => {
        const wb = await leer(await service.renderJoven(joven()));
        const hoja = wb.getWorksheet('Indicadores')!;

        expect(hoja.getCell('A3').value).toBe('CORPORALIDAD');
        expect(hoja.getCell('A4').value).toBe('Código');
        expect(hoja.getCell('A5').value).toBe('c1');
        expect(hoja.getCell('B5').value).toBe('Indicador 1');
        expect(hoja.getCell('C5').value).toBe('Completado');
        expect(hoja.getCell('D5').value).toBe('✓');
        expect(hoja.getCell('C10').value).toBe('Pendiente');
        expect(hoja.getCell('D10').value).toBeFalsy();

        expect(hoja.getCell('A16').value).toBe('PRUEBA DE ADELANTO');
        expect(hoja.getCell('B18').value).toBe('Item de prueba');
        expect(hoja.getCell('D18').value).toBe('✓');
    });

    it('renderUnidad genera el resumen de la unidad y una hoja por joven', async () => {
        const buffer = await service.renderUnidad(
            unidad([joven(), joven({ apellidos: 'PEREZ', nombres: 'JUAN' })]),
        );

        const wb = await leer(buffer);
        expect(wb.worksheets.map((w) => w.name)).toEqual([
            'Resumen',
            'PEREZ JUAN',
            'PEREZ JUAN · Indicadores',
            'PEREZ JUAN (2)',
            'PEREZ JUAN · Indicadores (2)',
        ]);

        const resumen = wb.getWorksheet('Resumen')!;
        expect(String(resumen.getCell('A1').value)).toContain('TROPA');
        expect(resumen.getCell('A10').value).toBe('Aventurero');
        expect(resumen.getCell('D10').value).toBe('Todos los ítems');
        expect(resumen.getCell('D11').value).toBe('5 de 10');
        expect(resumen.getCell('A14').value).toBe('Apellidos');
        expect(resumen.getCell('D15').value).toBe('Explorador');
        expect(resumen.getCell('G15').value).toBe(50);
        expect(resumen.getCell('H15').value).toBe('En curso');
    });

    it('renderUnidad marca "Sin iniciar" y limpia caracteres invalidos de los nombres de hoja', async () => {
        const sinProgresion = joven({
            adelantoActual: null,
            evaluacion: null,
            historial: [],
            apellidos: 'PEREZ/LARA',
            nombres: 'ANA: MARIA',
        });
        const buffer = await service.renderUnidad(unidad([sinProgresion]));

        const wb = await leer(buffer);
        const nombres = wb.worksheets.map((w) => w.name);
        expect(nombres[0]).toBe('Resumen');
        expect(nombres[1]).not.toMatch(/[/\\:*?[\]]/);
        expect(nombres[1].length).toBeLessThanOrEqual(31);

        const hojaJoven = wb.getWorksheet(nombres[1])!;
        expect(hojaJoven.getCell('B10').value).toBe('Sin adelanto iniciado');

        const hojaUnidad = wb.getWorksheet('Resumen')!;
        expect(hojaUnidad.getCell('H15').value).toBe('Sin iniciar');
        expect(hojaUnidad.getCell('E15').value).toBe(0);
    });
});
