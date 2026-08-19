import { ProgramasMundialesService } from './programas-mundiales.service';
export declare class ProgramasMundialesController {
    private readonly programasMundialesService;
    constructor(programasMundialesService: ProgramasMundialesService);
    findAllCatalog(): Promise<{
        id: string;
        nombre: string;
        activo: boolean;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        descripcion: string | null;
        tipo: import(".prisma/client").$Enums.TipoProgramaMundial;
    }[]>;
    findByMiembro(miembroId: string): Promise<({
        ProgramaMundial: {
            id: string;
            nombre: string;
            activo: boolean;
            createdAt: Date;
            updatedAt: Date;
            deletedAt: Date | null;
            descripcion: string | null;
            tipo: import(".prisma/client").$Enums.TipoProgramaMundial;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        deletedAt: Date | null;
        miembroId: string;
        estado: import(".prisma/client").$Enums.EstadoProgramaMundial;
        fechaInicio: Date;
        programaMundialId: string;
        fechaCompletado: Date | null;
    })[]>;
}
