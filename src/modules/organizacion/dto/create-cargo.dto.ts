import { IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCargoDto {
    @IsUUID()
    usuarioId!: string;

    @IsString()
    cargo!: string;

    @IsOptional()
    @IsDateString()
    desde?: string;
}
