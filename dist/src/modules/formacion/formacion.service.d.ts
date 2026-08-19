import { PrismaService } from '../prisma/prisma.service';
export declare class FormacionService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<({
        Adulto: {
            id: string;
            usuarioId: string | null;
            miembroId: string;
            ocupacion: string | null;
            telefono: string | null;
            direccion: string | null;
        };
    } & {
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        fecha: Date;
        director: string;
        adultoId: string;
    })[]>;
    findByAdulto(adultoId: string): Promise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        fecha: Date;
        director: string;
        adultoId: string;
    }[]>;
}
