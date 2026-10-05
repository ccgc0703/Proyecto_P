import { IsUUID } from 'class-validator';

export class AsignarUnidadDto {
    @IsUUID('4', { message: 'ID de grupo inválido' })
    grupoId: string;
}
