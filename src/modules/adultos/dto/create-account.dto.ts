import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateAccountDto {
    @IsEmail()
    email: string;

    @IsString() @MinLength(6)
    password: string;

    // Opcional: si se omite (cuentas de joven) se asigna el rol correspondiente por defecto
    @IsOptional()
    @IsString()
    rolId?: string;
}
