import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { FichaMedicaService } from './ficha-medica.service';
import { CreateFichaMedicaDto } from './dto/create-ficha-medica.dto';
import { UpdateFichaMedicaDto } from './dto/update-ficha-medica.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { SelfScopePolicy } from '../../common/policies/self-scope.policy';

@Controller('ficha-medica')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FichaMedicaController {
    constructor(
        private readonly fichaMedicaService: FichaMedicaService,
        private readonly selfScope: SelfScopePolicy,
    ) {}

    @Post()
    @RequirePermission(PERMISSIONS.MEDICO_EDIT)
    async create(@Body() dto: CreateFichaMedicaDto, @Req() req: any) {
        // Self-scope: el rol JOVEN solo puede crear su propia ficha
        this.selfScope.assertSelf(req.user, dto.miembroId);
        const ficha = await this.fichaMedicaService.create(dto, req.user.id);
        return { success: true, message: 'Ficha médica creada', data: ficha };
    }

    @Get()
    @RequirePermission(PERMISSIONS.MEDICO_VIEW)
    async findAll(@Req() req: any) {
        // Listado global: prohibido para cuentas jóvenes
        this.selfScope.assertNotJoven(req.user);
        const fichas = await this.fichaMedicaService.findAll();
        return { success: true, message: 'Fichas médicas recuperadas', data: fichas };
    }

    @Get('miembro/:miembroId')
    @RequirePermission(PERMISSIONS.MEDICO_VIEW)
    async findByMiembro(@Param('miembroId') miembroId: string, @Req() req: any) {
        // Self-scope: el rol JOVEN solo lee su propia ficha
        this.selfScope.assertSelf(req.user, miembroId);
        const ficha = await this.fichaMedicaService.findByMiembro(miembroId);
        return { success: true, message: 'Ficha médica del miembro', data: ficha };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.MEDICO_VIEW)
    async findOne(@Param('id') id: string, @Req() req: any) {
        const ficha = await this.fichaMedicaService.findOne(id);
        this.selfScope.assertSelf(req.user, ficha.miembroId);
        return { success: true, message: 'Ficha médica recuperada', data: ficha };
    }

    @Patch(':id')
    @RequirePermission(PERMISSIONS.MEDICO_UPDATE)
    async update(@Param('id') id: string, @Body() dto: UpdateFichaMedicaDto, @Req() req: any) {
        const existente = await this.fichaMedicaService.findOne(id);
        this.selfScope.assertSelf(req.user, existente.miembroId);
        const ficha = await this.fichaMedicaService.update(id, dto, req.user.id);
        return { success: true, message: 'Ficha médica actualizada', data: ficha };
    }

    @Delete(':id')
    @RequirePermission(PERMISSIONS.MEDICO_EDIT)
    async remove(@Param('id') id: string, @Req() req: any) {
        // El rol JOVEN no elimina fichas (solo lectura/edición de la propia)
        this.selfScope.assertNotJoven(req.user);
        await this.fichaMedicaService.remove(id, req.user.id);
        return { success: true, message: 'Ficha médica eliminada', data: null };
    }
}
