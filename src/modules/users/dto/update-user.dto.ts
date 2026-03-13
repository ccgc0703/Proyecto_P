import { IsOptional, IsString, IsEmail } from 'class-validator';

export class UpdateUserDto {
    @IsOptional()
    @IsString()
    nombre?: string;

    @IsOptional()
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    unidadId?: string;
}
