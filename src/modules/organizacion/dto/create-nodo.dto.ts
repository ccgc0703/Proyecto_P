import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoNodoOrganizacion } from '@prisma/client';

export class CreateNodoDto {
    @IsEnum(TipoNodoOrganizacion, {
        message: 'Tipo de nodo inválido (CONSEJO_NACIONAL, DIRECCION_EJECUTIVA, REGION, DISTRITO o GRUPO)',
    })
    tipo: TipoNodoOrganizacion;

    @IsString({ message: 'El nombre es requerido' })
    @IsNotEmpty({ message: 'El nombre es requerido' })
    @Transform(({ value }) => value?.trim())
    nombre: string;

    @IsOptional()
    @IsUUID('4', { message: 'ID de nodo padre inválido' })
    padreId?: string;
}
