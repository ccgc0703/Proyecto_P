import { DatosScoutService } from './datos-scout.service';
export declare class DatosScoutController {
    private readonly datosScoutService;
    constructor(datosScoutService: DatosScoutService);
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
