import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { TipoUnidad } from '@prisma/client';

export class CreateUnidadDto {
    @IsString({ message: 'El nombre es requerido' })
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    nombre: string;

    @IsOptional()
    @IsEnum(TipoUnidad, { message: 'tipo debe ser MANADA, TROPA, COMUNIDAD o CLAN' })
    @Transform(({ value }) => (typeof value === 'string' ? value.toUpperCase().trim() : value))
    tipo?: TipoUnidad;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value?.toUpperCase()?.trim())
    descripcion?: string;

    /**
     * Nodo GRUPO al que pertenece (Fase 7c · multi-grupo): una instancia de
     * unidad por grupo (`@@unique([grupoId, tipo])`). Obligatorio para actores
     * con ámbito jerárquico.
     */
    @IsOptional()
    @IsUUID('4', { message: 'grupoId debe ser un UUID válido' })
    grupoId?: string;
}
