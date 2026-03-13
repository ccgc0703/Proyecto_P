import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(loginDto: LoginDto): Promise<{
        success: boolean;
        message: string;
        data: {
            accessToken: string;
            usuario: {
                id: string;
                nombre: string;
                email: string;
                unidadId: string;
                permissions: string[];
            };
        };
    }>;
    logout(req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    refresh(req: any): Promise<{
        success: boolean;
        message: string;
        data: {
            accessToken: string;
        };
    }>;
    getProfile(req: any): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
