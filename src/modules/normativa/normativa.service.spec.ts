import 'dotenv/config';
import * as fs from 'fs';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { NormativaService, Actor } from './normativa.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { UnitPolicy } from '../../common/policies/unit.policy';

describe('NormativaService', () => {
    let service: NormativaService;

    const actor: Actor = { id: 'u1', roles: ['SYSTEM_ADMIN'], unidadId: null, nodoId: null };

    const mockPrisma = {
        documento: {
            findMany: jest.fn(),
            count: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockAudit = { logAction: jest.fn().mockResolvedValue(undefined) };
    const mockUnitPolicy = {
        unidadesAlcance: jest.fn().mockResolvedValue(null),
        assertCanManageUnit: jest.fn().mockResolvedValue(undefined),
    };

    const archivo = {
        fieldname: 'file',
        originalname: 'ley-promesa.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1234,
        destination: 'uploads/normativa',
        filename: '11111111-2222-3333-4444-555555555555.pdf',
        path: 'uploads/normativa/11111111-2222-3333-4444-555555555555.pdf',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                NormativaService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: AuditService, useValue: mockAudit },
                { provide: UnitPolicy, useValue: mockUnitPolicy },
            ],
        }).compile();

        service = module.get<NormativaService>(NormativaService);
        jest.clearAllMocks();
        mockAudit.logAction.mockResolvedValue(undefined);
        mockUnitPolicy.unidadesAlcance.mockResolvedValue(null);
        mockUnitPolicy.assertCanManageUnit.mockResolvedValue(undefined);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('listar', () => {
        it('aplica categoria, vigencia, busqueda y paginacion', async () => {
            mockPrisma.documento.findMany.mockResolvedValue([]);

            await service.listar(
                { categoria: 'REGLAMENTO', vigente: 'true' } as any,
                actor,
                { page: 2, limit: 10, q: 'promesa' },
            );

            expect(mockPrisma.documento.findMany).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    categoria: 'REGLAMENTO',
                    vigente: true,
                    AND: [
                        {
                            OR: [
                                { titulo: { contains: 'promesa', mode: 'insensitive' } },
                                { descripcion: { contains: 'promesa', mode: 'insensitive' } },
                            ],
                        },
                    ],
                },
                include: expect.any(Object),
                orderBy: [{ createdAt: 'desc' }],
                skip: 10,
                take: 10,
            });
        });

        it('sin paginacion devuelve la lista completa y sin filtros opcionales', async () => {
            mockPrisma.documento.findMany.mockResolvedValue([]);

            await service.listar({} as any, actor, {});

            const args = mockPrisma.documento.findMany.mock.calls[0][0];
            expect(args.where).toEqual({ deletedAt: null });
            expect(args.skip).toBeUndefined();
            expect(args.take).toBeUndefined();
        });

        it('limita a las unidades del alcance y mantiene los documentos nacionales', async () => {
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-1']);
            mockPrisma.documento.findMany.mockResolvedValue([]);

            await service.listar({} as any, actor, {});

            const { where } = mockPrisma.documento.findMany.mock.calls[0][0];
            expect(where.AND).toEqual([
                { OR: [{ unidadId: { in: ['unidad-1'] } }, { unidadId: null }] },
            ]);
        });

        it('cuenta con los mismos filtros que el listado', async () => {
            mockPrisma.documento.count.mockResolvedValue(3);

            const total = await service.contar({ vigente: 'false' } as any, actor, 'acta');

            expect(total).toBe(3);
            expect(mockPrisma.documento.count).toHaveBeenCalledWith({
                where: {
                    deletedAt: null,
                    vigente: false,
                    AND: [
                        {
                            OR: [
                                { titulo: { contains: 'acta', mode: 'insensitive' } },
                                { descripcion: { contains: 'acta', mode: 'insensitive' } },
                            ],
                        },
                    ],
                },
            });
        });
    });

    describe('crear', () => {
        it('guarda el nombre aleatorio, normaliza texto y audita', async () => {
            mockPrisma.documento.create.mockResolvedValue({
                id: 'doc-1',
                titulo: 'Ley Promesa',
            });

            const documento = await service.crear(
                {
                    titulo: '  Ley Promesa  ',
                    categoria: 'LEY_PROMESA',
                    descripcion: '  texto  ',
                } as any,
                archivo as any,
                actor,
            );

            expect(documento).toEqual({ id: 'doc-1', titulo: 'Ley Promesa' });
            expect(mockPrisma.documento.create).toHaveBeenCalledWith({
                data: {
                    titulo: 'Ley Promesa',
                    categoria: 'LEY_PROMESA',
                    descripcion: 'texto',
                    archivoUrl: `normativa/${archivo.filename}`,
                    mimeType: archivo.mimetype,
                    tamano: archivo.size,
                    nombreOriginal: archivo.originalname,
                    unidadId: null,
                    createdBy: 'u1',
                },
                include: expect.any(Object),
            });
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({
                    actorId: 'u1',
                    action: 'DOCUMENTO_CREATED',
                    module: 'normativa',
                    targetId: 'doc-1',
                }),
            );
        });

        it('exige potestad sobre la unidad cuando el documento no es nacional', async () => {
            mockPrisma.documento.create.mockResolvedValue({ id: 'doc-1', titulo: 'Acta' });

            await service.crear(
                { titulo: 'Acta', categoria: 'ACTA', unidadId: 'unidad-9' } as any,
                archivo as any,
                actor,
            );

            expect(mockUnitPolicy.assertCanManageUnit).toHaveBeenCalledWith(actor, 'unidad-9');
        });

        it('normaliza el MIME cuando el cliente envia application/octet-stream', async () => {
            mockPrisma.documento.create.mockResolvedValue({ id: 'doc-1', titulo: 'Doc' });

            await service.crear(
                { titulo: 'Doc', categoria: 'OTRO' } as any,
                { ...archivo, mimetype: 'application/octet-stream' } as any,
                actor,
            );

            expect(mockPrisma.documento.create.mock.calls[0][0].data.mimeType).toBe(
                'application/pdf',
            );
        });

        it('convierte descripcion vacia en null', async () => {
            mockPrisma.documento.create.mockResolvedValue({ id: 'doc-1', titulo: 'Doc' });

            await service.crear(
                { titulo: 'Doc', categoria: 'OTRO', descripcion: '   ' } as any,
                archivo as any,
                actor,
            );

            expect(mockPrisma.documento.create.mock.calls[0][0].data.descripcion).toBeNull();
        });
    });

    describe('obtener / actualizar / eliminar', () => {
        it('lanza NotFound si el documento no existe o esta borrado', async () => {
            mockPrisma.documento.findFirst.mockResolvedValue(null);

            await expect(service.obtener('no-existe')).rejects.toBeInstanceOf(NotFoundException);
            expect(mockPrisma.documento.findFirst).toHaveBeenCalledWith({
                where: { id: 'no-existe', deletedAt: null },
                include: expect.any(Object),
            });
        });

        it('oculta un documento de otra unidad al leerlo por id', async () => {
            mockPrisma.documento.findFirst.mockResolvedValue({ id: 'doc-1', unidadId: 'unidad-2' });
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-1']);

            await expect(
                service.obtener('doc-1', { ...actor, unidadId: 'unidad-1' } as any),
            ).rejects.toBeInstanceOf(NotFoundException);
        });

        it('mantiene visibles los documentos nacionales con alcance limitado', async () => {
            mockPrisma.documento.findFirst.mockResolvedValue({ id: 'doc-1', unidadId: null });
            mockUnitPolicy.unidadesAlcance.mockResolvedValue(['unidad-1']);

            const documento = await service.obtener('doc-1', {
                ...actor,
                unidadId: 'unidad-1',
            } as any);

            expect(documento.id).toBe('doc-1');
        });

        it('actualiza metadata normalizada y audita', async () => {
            mockPrisma.documento.findFirst.mockResolvedValue({
                id: 'doc-1',
                unidadId: null,
                titulo: 'Viejo',
            });
            mockPrisma.documento.update.mockResolvedValue({ id: 'doc-1', titulo: 'Nuevo' });

            const documento = await service.actualizar(
                'doc-1',
                { titulo: ' Nuevo ', vigente: false } as any,
                actor,
            );

            expect(documento).toEqual({ id: 'doc-1', titulo: 'Nuevo' });
            expect(mockPrisma.documento.update).toHaveBeenCalledWith({
                where: { id: 'doc-1' },
                data: { titulo: 'Nuevo', vigente: false, updatedBy: 'u1' },
                include: expect.any(Object),
            });
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'DOCUMENTO_UPDATED', targetId: 'doc-1' }),
            );
        });

        it('elimina de forma logica (deletedAt) y audita', async () => {
            mockPrisma.documento.findFirst.mockResolvedValue({
                id: 'doc-1',
                titulo: 'Acta',
                archivoUrl: 'normativa/a.pdf',
            });
            mockPrisma.documento.update.mockResolvedValue({ id: 'doc-1' });

            await service.eliminar('doc-1', actor);

            const { data } = mockPrisma.documento.update.mock.calls[0][0];
            expect(data.deletedAt).toBeInstanceOf(Date);
            expect(data.updatedBy).toBe('u1');
            expect(mockAudit.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'DOCUMENTO_DELETED', targetId: 'doc-1' }),
            );
        });
    });

    describe('obtenerArchivo', () => {
        it('resuelve la ruta y devuelve metadatos de descarga', async () => {
            mockPrisma.documento.findFirst.mockResolvedValue({
                id: 'doc-1',
                titulo: 'Acta',
                archivoUrl: 'normativa/a.pdf',
                nombreOriginal: 'acta.pdf',
                mimeType: 'application/pdf',
            });
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);

            const archivoDescarga = await service.obtenerArchivo('doc-1');

            expect(archivoDescarga.nombreOriginal).toBe('acta.pdf');
            expect(archivoDescarga.mimeType).toBe('application/pdf');
            expect(archivoDescarga.ruta.endsWith('a.pdf')).toBe(true);
        });

        it('lanza NotFound si el archivo fisico no esta disponible', async () => {
            mockPrisma.documento.findFirst.mockResolvedValue({
                id: 'doc-1',
                titulo: 'Acta',
                archivoUrl: 'normativa/a.pdf',
                nombreOriginal: 'acta.pdf',
                mimeType: 'application/pdf',
            });
            jest.spyOn(fs, 'existsSync').mockReturnValue(false);

            await expect(service.obtenerArchivo('doc-1')).rejects.toBeInstanceOf(NotFoundException);
        });

        it('bloquea rutas fuera de la carpeta de subidas', async () => {
            mockPrisma.documento.findFirst.mockResolvedValue({
                id: 'doc-1',
                titulo: 'Malicioso',
                archivoUrl: '../../etc/passwd',
                nombreOriginal: 'passwd',
                mimeType: 'text/plain',
            });
            jest.spyOn(fs, 'existsSync').mockReturnValue(true);

            await expect(service.obtenerArchivo('doc-1')).rejects.toBeInstanceOf(BadRequestException);
        });
    });
});
