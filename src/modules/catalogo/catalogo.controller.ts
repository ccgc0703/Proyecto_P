import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { CatalogoService } from './catalogo.service';
import { CreateAreaDto } from './dto/create-area.dto';
import { UpdateAreaDto } from './dto/update-area.dto';
import { UpdateEtapaDto } from './dto/update-etapa.dto';
import { CreateIndicadorDto } from './dto/create-indicador.dto';
import { UpdateIndicadorDto } from './dto/update-indicador.dto';
import { CreateAdelantoDto } from './dto/create-adelanto.dto';
import { UpdateAdelantoDto } from './dto/update-adelanto.dto';
import { QueryAdelantosDto, QueryEtapasDto, QueryIndicadoresDto } from './dto/query-catalogo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

@Controller('catalogo')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CatalogoController {
    constructor(private readonly catalogoService: CatalogoService) { }

    @Get('areas')
    @RequirePermission(PERMISSIONS.CATALOGO_VIEW)
    async findAllAreas() {
        const data = await this.catalogoService.findAreas();
        return { success: true, message: 'Areas de crecimiento recuperadas', data };
    }

    @Post('areas')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async createArea(@Body() dto: CreateAreaDto, @Req() req: any) {
        const data = await this.catalogoService.createArea(dto, req.user.id);
        return { success: true, message: 'Area creada exitosamente', data };
    }

    @Patch('areas/:id')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async updateArea(@Param('id') id: string, @Body() dto: UpdateAreaDto, @Req() req: any) {
        const data = await this.catalogoService.updateArea(id, dto, req.user.id);
        return { success: true, message: 'Area actualizada exitosamente', data };
    }

    @Delete('areas/:id')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async removeArea(@Param('id') id: string, @Req() req: any) {
        await this.catalogoService.removeArea(id, req.user.id);
        return { success: true, message: 'Area eliminada exitosamente', data: null };
    }

    @Get('etapas')
    @RequirePermission(PERMISSIONS.CATALOGO_VIEW)
    async findAllEtapas(@Query() query: QueryEtapasDto) {
        const data = await this.catalogoService.findEtapas(query);
        return { success: true, message: 'Etapas recuperadas', data };
    }

    @Patch('etapas/:id')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async updateEtapa(@Param('id') id: string, @Body() dto: UpdateEtapaDto, @Req() req: any) {
        const data = await this.catalogoService.updateEtapa(id, dto, req.user.id);
        return { success: true, message: 'Etapa actualizada exitosamente', data };
    }

    @Get('indicadores')
    @RequirePermission(PERMISSIONS.CATALOGO_VIEW)
    async findAllIndicadores(@Query() query: QueryIndicadoresDto) {
        const data = await this.catalogoService.findIndicadores(query);
        return { success: true, message: 'Indicadores de logro recuperados', data };
    }

    @Post('indicadores')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async createIndicador(@Body() dto: CreateIndicadorDto, @Req() req: any) {
        const data = await this.catalogoService.createIndicador(dto, req.user.id);
        return { success: true, message: 'Indicador creado exitosamente', data };
    }

    @Patch('indicadores/:id')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async updateIndicador(@Param('id') id: string, @Body() dto: UpdateIndicadorDto, @Req() req: any) {
        const data = await this.catalogoService.updateIndicador(id, dto, req.user.id);
        return { success: true, message: 'Indicador actualizado exitosamente', data };
    }

    @Delete('indicadores/:id')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async removeIndicador(@Param('id') id: string, @Req() req: any) {
        await this.catalogoService.removeIndicador(id, req.user.id);
        return { success: true, message: 'Indicador eliminado exitosamente', data: null };
    }

    @Get('adelantos')
    @RequirePermission(PERMISSIONS.CATALOGO_VIEW)
    async findAllAdelantos(@Query() query: QueryAdelantosDto) {
        const data = await this.catalogoService.findAdelantos(query);
        return { success: true, message: 'Adelantos recuperados', data };
    }

    @Post('adelantos')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async createAdelanto(@Body() dto: CreateAdelantoDto, @Req() req: any) {
        const data = await this.catalogoService.createAdelanto(dto, req.user.id);
        return { success: true, message: 'Adelanto creado exitosamente', data };
    }

    @Patch('adelantos/:id')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async updateAdelanto(@Param('id') id: string, @Body() dto: UpdateAdelantoDto, @Req() req: any) {
        const data = await this.catalogoService.updateAdelanto(id, dto, req.user.id);
        return { success: true, message: 'Adelanto actualizado exitosamente', data };
    }

    @Delete('adelantos/:id')
    @RequirePermission(PERMISSIONS.CATALOGO_MANAGE)
    async removeAdelanto(@Param('id') id: string, @Req() req: any) {
        await this.catalogoService.removeAdelanto(id, req.user.id);
        return { success: true, message: 'Adelanto eliminado exitosamente', data: null };
    }
}
