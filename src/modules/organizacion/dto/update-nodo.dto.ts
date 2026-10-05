import { IsBoolean, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateNodoDto {
    @IsOptional()
    @IsString({ message: 'El nombre debe ser un texto' })
    @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
    @Transform(({ value }) => value?.trim())
    nombre?: string;

    @IsOptional()
    @IsBoolean({ message: 'El estado activo debe ser un booleano' })
    activo?: boolean;
}
