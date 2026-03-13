import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        usuario: {
            id: string;
            nombre: string;
            email: string;
            unidadId: string;
            permissions: string[];
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        nombre: string;
        email: string;
        unidadId: string;
        roles: {
            id: string;
            nombre: string;
            descripcion: string;
        }[];
        permisos: string[];
    }>;
    logout(userId: string): Promise<void>;
    refreshToken(userId: string): Promise<{
        accessToken: string;
    }>;
    loadUserPermissions(usuarioId: string): Promise<string[]>;
}
