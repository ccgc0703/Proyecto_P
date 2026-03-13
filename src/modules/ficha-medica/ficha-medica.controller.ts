import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { FichaMedicaService } from './ficha-medica.service';
import { CreateFichaMedicaDto } from './dto/create-ficha-medica.dto';
import { UpdateFichaMedicaDto } from './dto/update-ficha-medica.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

@Controller('ficha-medica')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FichaMedicaController {
    constructor(private readonly fichaMedicaService: FichaMedicaService) {}

    @Post()
    @RequirePermission(PERMISSIONS.MEDICO_EDIT)
    async create(@Body() dto: CreateFichaMedicaDto, @Req() req: any) {
        const ficha = await this.fichaMedicaService.create(dto, req.user.id);
        return { success: true, message: 'Ficha médica creada', data: ficha };
    }

    @Get()
    @RequirePermission(PERMISSIONS.MEDICO_VIEW)
    async findAll() {
        const fichas = await this.fichaMedicaService.findAll();
        return { success: true, message: 'Fichas médicas recuperadas', data: fichas };
    }

    @Get('joven/:jovenId')
    @RequirePermission(PERMISSIONS.MEDICO_VIEW)
    async findByJoven(@Param('jovenId') jovenId: string) {
        const ficha = await this.fichaMedicaService.findByJoven(jovenId);
        return { success: true, message: 'Ficha médica del joven', data: ficha };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.MEDICO_VIEW)
    async findOne(@Param('id') id: string) {
        const ficha = await this.fichaMedicaService.findOne(id);
        return { success: true, message: 'Ficha médica recuperada', data: ficha };
    }

    @Patch(':id')
    @RequirePermission(PERMISSIONS.MEDICO_UPDATE)
    async update(@Param('id') id: string, @Body() dto: UpdateFichaMedicaDto, @Req() req: any) {
        const ficha = await this.fichaMedicaService.update(id, dto, req.user.id);
        return { success: true, message: 'Ficha médica actualizada', data: ficha };
    }

    @Delete(':id')
    @RequirePermission(PERMISSIONS.MEDICO_EDIT)
    async remove(@Param('id') id: string, @Req() req: any) {
        await this.fichaMedicaService.remove(id, req.user.id);
        return { success: true, message: 'Ficha médica eliminada', data: null };
    }
}
