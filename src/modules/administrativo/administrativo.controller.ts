import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AdministrativoService } from './administrativo.service';
import { CreateRepresentanteDto } from './dto/create-representante.dto';
import { UpdateRepresentanteDto } from './dto/update-representante.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

@Controller('administrativo')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AdministrativoController {
    constructor(private readonly administrativoService: AdministrativoService) { }

    @Post('representantes')
    @RequirePermission(PERMISSIONS.REPRESENTANTE_CREATE)
    async createRepresentante(@Body() dto: CreateRepresentanteDto, @Req() req: any) {
        const representante = await this.administrativoService.createRepresentante(dto, req.user.id);
        return {
            success: true,
            message: 'Representante registrado exitosamente',
            data: representante,
        };
    }

    @Get('representantes')
    @RequirePermission(PERMISSIONS.REPRESENTANTE_VIEW)
    async findAllRepresentantes() {
        const representantes = await this.administrativoService.findAll();
        return {
            success: true,
            message: 'Representantes recuperados exitosamente',
            data: representantes,
        };
    }

    @Get('representantes/:id')
    @RequirePermission(PERMISSIONS.REPRESENTANTE_VIEW)
    async findOneRepresentante(@Param('id') id: string) {
        const representante = await this.administrativoService.findOne(id);
        return {
            success: true,
            message: 'Representante recuperado exitosamente',
            data: representante,
        };
    }

    @Patch('representantes/:id')
    @RequirePermission(PERMISSIONS.REPRESENTANTE_UPDATE)
    async updateRepresentante(
        @Param('id') id: string,
        @Body() dto: UpdateRepresentanteDto,
        @Req() req: any,
    ) {
        const representante = await this.administrativoService.updateRepresentante(id, dto, req.user.id);
        return {
            success: true,
            message: 'Representante actualizado exitosamente',
            data: representante,
        };
    }

    @Delete('representantes/:id')
    @RequirePermission(PERMISSIONS.REPRESENTANTE_DELETE)
    async removeRepresentante(@Param('id') id: string, @Req() req: any) {
        await this.administrativoService.remove(id, req.user.id);
        return {
            success: true,
            message: 'Representante eliminado exitosamente',
            data: null,
        };
    }
}
