import { Test, TestingModule } from '@nestjs/testing';
import { AdultosService } from './adultos.service';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AdultosService', () => {
    let service: AdultosService;

    const mockPrisma = {
        adulto: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
        miembro: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        usuarioRol: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        rol: {
            findFirst: jest.fn(),
        },
    };

    const mockUsersService = {
        create: jest.fn(),
        remove: jest.fn(),
    };

    const mockAuditService = {
        logAction: jest.fn().mockResolvedValue(undefined),
    };

    const adultoCompleto = {
        id: 'a1',
        miembroId: 'm1',
        usuarioId: 'u1',
        ocupacion: 'DOCENTE',
        telefono: '099111222',
        direccion: 'Calle 1',
        Miembro: {
            id: 'm1',
            nombres: 'ANA',
            apellidos: 'PEREZ',
            estado: 'ACTIVO',
            unidadId: 'uni-1',
            Unidad: { id: 'uni-1', nombre: 'Manada' },
        },
        Usuario: {
            id: 'u1',
            email: 'ana@test.com',
            UsuarioRoles: [{ Rol: { nombre: 'ADULTO_MANADA' } }],
        },
        Formaciones: [],
    };

    const dtoBase = {
        nombres: 'ANA',
        apellidos: 'PEREZ',
        cedula: '12345678',
        fechaNacimiento: '1990-05-10',
        genero: 'FEMENINO',
        unidadId: 'uni-1',
        ocupacion: 'DOCENTE',
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AdultosService,
                { provide: PrismaService, useValue: mockPrisma },
                { provide: UsersService, useValue: mockUsersService },
                { provide: AuditService, useValue: mockAuditService },
            ],
        }).compile();

        service = module.get<AdultosService>(AdultosService);
        jest.clearAllMocks();
    });

    describe('findAll', () => {
        it('aplana Miembro y Usuario y expone email, activo y roles', async () => {
            mockPrisma.adulto.findMany.mockResolvedValue([adultoCompleto]);

            const result = await service.findAll();

            expect(mockPrisma.adulto.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { Miembro: { deletedAt: null } },
                    include: expect.objectContaining({ Formaciones: true }),
                }),
            );
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual(
                expect.objectContaining({
                    id: 'a1',
                    miembroId: 'm1',
                    nombres: 'ANA',
                    apellidos: 'PEREZ',
                    ocupacion: 'DOCENTE',
                    email: 'ana@test.com',
                    activo: true,
                    roles: ['ADULTO_MANADA'],
                    Unidad: { id: 'uni-1', nombre: 'Manada' },
                    Usuario: adultoCompleto.Usuario,
                }),
            );
            expect((result[0] as any).Miembro).toBeUndefined();
        });
    });

    describe('findOne', () => {
        it('lanza NotFoundException cuando el adulto no existe', async () => {
            mockPrisma.adulto.findFirst.mockResolvedValue(null);

            await expect(service.findOne('no-existe')).rejects.toThrow(NotFoundException);
            await expect(service.findOne('no-existe')).rejects.toThrow('Adulto no encontrado');
        });
    });

    describe('create', () => {
        it('rechaza la creación si la cédula ya está registrada', async () => {
            mockPrisma.miembro.findUnique.mockResolvedValue({ id: 'm9', cedula: '12345678' });

            await expect(service.create(dtoBase as any, 'creator-1')).rejects.toThrow(
                ConflictException,
            );
            expect(mockUsersService.create).not.toHaveBeenCalled();
            expect(mockPrisma.adulto.create).not.toHaveBeenCalled();
            expect(mockPrisma.miembro.findUnique).toHaveBeenCalledWith({
                where: { cedula: '12345678' },
            });
        });

        it('crea la cuenta y asigna el rol inicial tras validar la jerarquía', async () => {
            mockPrisma.miembro.findUnique.mockResolvedValue(null);
            mockPrisma.rol.findFirst.mockResolvedValue({ id: 'rol-1', nombre: 'ADULTO_MANADA' });
            mockPrisma.usuarioRol.findMany.mockResolvedValue([{ Rol: { nombre: 'SYSTEM_ADMIN' } }]);
            mockUsersService.create.mockResolvedValue({ id: 'u9' });
            mockPrisma.usuarioRol.create.mockResolvedValue({});
            mockPrisma.adulto.create.mockResolvedValue({ id: 'a9' });
            mockPrisma.adulto.findFirst.mockResolvedValue(adultoCompleto);

            const result = await service.create(
                {
                    ...dtoBase,
                    email: 'ana@test.com',
                    password: '123456',
                    rolId: 'rol-1',
                } as any,
                'creator-1',
            );

            expect(mockPrisma.rol.findFirst).toHaveBeenCalledWith({
                where: { id: 'rol-1', deletedAt: null, activo: true },
            });
            expect(mockUsersService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombre: 'ANA',
                    apellido: 'PEREZ',
                    email: 'ana@test.com',
                    password: '123456',
                    unidadId: 'uni-1',
                }),
                'creator-1',
            );
            expect(mockPrisma.usuarioRol.create).toHaveBeenCalledWith({
                data: { usuarioId: 'u9', rolId: 'rol-1', asignadoPor: 'creator-1' },
            });
            expect(mockPrisma.adulto.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        ocupacion: 'DOCENTE',
                        Usuario: { connect: { id: 'u9' } },
                        Miembro: {
                            create: expect.objectContaining({
                                tipo: 'ADULTO',
                                cedula: '12345678',
                                createdBy: 'creator-1',
                                fechaNacimiento: new Date('1990-05-10'),
                            }),
                        },
                    }),
                }),
            );
            expect(mockAuditService.logAction).toHaveBeenCalledWith(
                expect.objectContaining({ action: 'ADULTO_CREATED', module: 'adultos' }),
            );
            expect(result.id).toBe('a1');
            expect(result.email).toBe('ana@test.com');
        });

        it('no crea la cuenta si el rol a asignar es igual o superior al del actor', async () => {
            mockPrisma.miembro.findUnique.mockResolvedValue(null);
            mockPrisma.rol.findFirst.mockResolvedValue({ id: 'rol-x', nombre: 'SYSTEM_ADMIN' });
            mockPrisma.usuarioRol.findMany.mockResolvedValue([
                { Rol: { nombre: 'ADULTO_MANADA' } },
            ]);

            await expect(
                service.create(
                    { ...dtoBase, email: 'ana@test.com', password: '123456', rolId: 'rol-x' } as any,
                    'creator-1',
                ),
            ).rejects.toThrow(ForbiddenException);
            expect(mockUsersService.create).not.toHaveBeenCalled();
            expect(mockPrisma.adulto.create).not.toHaveBeenCalled();
        });
    });

    describe('createAccount', () => {
        it('rechaza si el adulto ya tiene una cuenta vinculada', async () => {
            mockPrisma.adulto.findFirst.mockResolvedValue({
                id: 'a1',
                usuarioId: 'u1',
                Miembro: { id: 'm1', nombres: 'ANA', apellidos: 'PEREZ', unidadId: 'uni-1' },
            });

            await expect(
                service.createAccount('a1', { email: 'x@test.com', password: '123456' }, 'creator-1'),
            ).rejects.toThrow(ConflictException);
            expect(mockUsersService.create).not.toHaveBeenCalled();
        });

        it('crea el usuario y vincula el adulto sin asignar rol', async () => {
            mockPrisma.adulto.findFirst
                .mockResolvedValueOnce({
                    id: 'a1',
                    usuarioId: null,
                    Miembro: { id: 'm1', nombres: 'ANA', apellidos: 'PEREZ', unidadId: 'uni-1' },
                })
                .mockResolvedValue(adultoCompleto);
            mockUsersService.create.mockResolvedValue({ id: 'u7' });
            mockPrisma.adulto.update.mockResolvedValue({ id: 'a1' });

            const result = await service.createAccount(
                'a1',
                { email: 'ana@test.com', password: '123456' },
                'creator-1',
            );

            expect(mockUsersService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    nombre: 'ANA',
                    apellido: 'PEREZ',
                    email: 'ana@test.com',
                    password: '123456',
                    unidadId: 'uni-1',
                }),
                'creator-1',
            );
            expect(mockPrisma.usuarioRol.create).not.toHaveBeenCalled();
            expect(mockPrisma.adulto.update).toHaveBeenCalledWith({
                where: { id: 'a1' },
                data: { usuarioId: 'u7' },
            });
            expect(result.id).toBe('a1');
            expect(result.email).toBe('ana@test.com');
        });
    });

    describe('remove', () => {
        it('hace soft delete del miembro y elimina la cuenta vinculada', async () => {
            mockPrisma.adulto.findFirst.mockResolvedValue({
                id: 'a1',
                miembroId: 'm1',
                usuarioId: 'u1',
                Miembro: { id: 'm1' },
            });
            mockPrisma.miembro.update.mockResolvedValue({ id: 'm1', deletedAt: new Date() });
            mockUsersService.remove.mockResolvedValue(undefined);

            const result = await service.remove('a1', 'actor-1');

            expect(mockPrisma.miembro.update).toHaveBeenCalledWith({
                where: { id: 'm1' },
                data: expect.objectContaining({
                    deletedAt: expect.any(Date),
                    updatedBy: 'actor-1',
                }),
            });
            expect(mockUsersService.remove).toHaveBeenCalledWith('u1', 'actor-1');
            expect(result).toEqual({ message: 'Adulto eliminado lógicamente' });
        });
    });
});
