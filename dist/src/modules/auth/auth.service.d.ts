import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: string;
            nombre: string;
            email: string;
            unidadId: string;
            roles: string[];
            permissions: string[];
        };
    }>;
    getProfile(userId: string): Promise<{
        id: string;
        nombre: string;
        email: string;
        unidadId: string;
        roles: string[];
        permissions: string[];
    }>;
    logout(userId: string): Promise<void>;
    refreshToken(userId: string): Promise<{
        accessToken: string;
    }>;
    loadUserPermissions(usuarioId: string): Promise<string[]>;
    loadUserRoles(usuarioId: string): Promise<string[]>;
}
