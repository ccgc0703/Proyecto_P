import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateAccountDto {
    @IsEmail()
    email: string;

    @IsString() @MinLength(6)
    password: string;

    @IsString()
    rolId: string;
}
