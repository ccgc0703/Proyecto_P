import { PrismaService } from '../prisma/prisma.service';
export declare class DatosScoutService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
        id: string;
        miembroId: string;
        fechaRegistro: Date | null;
        fechaIngreso: Date | null;
        fechaPromesa: Date | null;
        cargoActual: string | null;
        observaciones: string | null;
    }[]>;
    findByMiembro(miembroId: string): Promise<{
        id: string;
        miembroId: string;
        fechaRegistro: Date | null;
        fechaIngreso: Date | null;
        fechaPromesa: Date | null;
        cargoActual: string | null;
        observaciones: string | null;
    }>;
}
