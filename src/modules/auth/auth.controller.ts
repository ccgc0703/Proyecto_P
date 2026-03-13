import { Controller, Post, Get, Body, Req, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        const result = await this.authService.login(loginDto);
        return {
            success: true,
            message: 'Inicio de sesión exitoso',
            data: result,
        };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async logout(@Req() req: any) {
        await this.authService.logout(req.user.id);
        return {
            success: true,
            message: 'Sesión cerrada exitosamente',
            data: null,
        };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    @UseGuards(JwtAuthGuard)
    async refresh(@Req() req: any) {
        const result = await this.authService.refreshToken(req.user.id);
        return {
            success: true,
            message: 'Token refrescado',
            data: result,
        };
    }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    async getProfile(@Req() req: any) {
        const profile = await this.authService.getProfile(req.user.id);
        return {
            success: true,
            data: profile,
        };
    }
}

