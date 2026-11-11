import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Auto-registro de presencia por QR: el joven envía el código que escaneó
 * en el QR de la actividad (firmado por el backend).
 */
export class PresenciaQrDto {
    @IsString({ message: 'codigo debe ser texto' })
    @MinLength(10, { message: 'codigo demasiado corto' })
    @MaxLength(512, { message: 'codigo demasiado largo' })
    codigo: string;
}
