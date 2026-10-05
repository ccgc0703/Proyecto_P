import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class RechazarProgresionDto {
    @IsOptional()
    @IsString({ message: 'El motivo debe ser texto' })
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @MaxLength(300, { message: 'El motivo no puede exceder 300 caracteres' })
    motivo?: string;
}
