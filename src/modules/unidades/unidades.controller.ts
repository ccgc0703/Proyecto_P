import { Controller, Get, Post, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UnidadesService } from './unidades.service';
import { CreateUnidadDto } from './dto/create-unidad.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

@Controller('unidades')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UnidadesController {
    constructor(private readonly unidadesService: UnidadesService) { }

    @Post()
    @RequirePermission(PERMISSIONS.UNIDAD_CREATE)
    async create(@Body() createUnidadDto: CreateUnidadDto, @Req() req: any) {
        const unidad = await this.unidadesService.create(createUnidadDto, req.user.id);
        return {
            success: true,
            message: 'Unidad creada exitosamente',
            data: unidad,
        };
    }

    @Get()
    @RequirePermission(PERMISSIONS.UNIDAD_VIEW)
    async findAll() {
        const unidades = await this.unidadesService.findAll();
        return {
            success: true,
            message: 'Unidades recuperadas exitosamente',
            data: unidades,
        };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.UNIDAD_VIEW)
    async findOne(@Param('id') id: string) {
        const unidad = await this.unidadesService.findOne(id);
        return {
            success: true,
            message: 'Unidad recuperada exitosamente',
            data: unidad,
        };
    }

    @Delete(':id')
    @RequirePermission(PERMISSIONS.UNIDAD_DELETE)
    async remove(@Param('id') id: string, @Req() req: any) {
        await this.unidadesService.remove(id, req.user.id);
        return {
            success: true,
            message: 'Unidad eliminada exitosamente',
            data: null,
        };
    }
}
