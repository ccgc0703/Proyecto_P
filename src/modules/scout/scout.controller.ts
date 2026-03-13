import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ScoutService } from './scout.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

@Controller('scout')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ScoutController {
    constructor(private readonly scoutService: ScoutService) { }

    @Post('progresiones')
    @RequirePermission(PERMISSIONS.PROGRESION_CREATE)
    async createProgresion(@Body() data: any, @Req() req: any) {
        const progresion = await this.scoutService.createProgresion(data, req.user.id);
        return { success: true, message: 'Progresión registrada', data: progresion };
    }

    @Get('progresiones')
    @RequirePermission(PERMISSIONS.PROGRESION_VIEW)
    async findAllProgresiones() {
        const progresiones = await this.scoutService.findAllProgresiones();
        return { success: true, message: 'Progresiones recuperadas', data: progresiones };
    }

    @Get('progresiones/:id')
    @RequirePermission(PERMISSIONS.PROGRESION_VIEW)
    async findProgresion(@Param('id') id: string) {
        const progresion = await this.scoutService.findProgresionById(id);
        return { success: true, message: 'Progresión recuperada', data: progresion };
    }

    @Patch('progresiones/:id')
    @RequirePermission(PERMISSIONS.PROGRESION_UPDATE)
    async updateProgresion(@Param('id') id: string, @Body() data: any, @Req() req: any) {
        const progresion = await this.scoutService.updateProgresion(id, data, req.user.id);
        return { success: true, message: 'Progresión actualizada', data: progresion };
    }

    @Delete('progresiones/:id')
    @RequirePermission(PERMISSIONS.PROGRESION_DELETE)
    async removeProgresion(@Param('id') id: string, @Req() req: any) {
        await this.scoutService.removeProgresion(id, req.user.id);
        return { success: true, message: 'Progresión eliminada', data: null };
    }

    @Post('condecoraciones')
    @RequirePermission(PERMISSIONS.CONDECORACION_CREATE)
    async createCondecoracion(@Body() data: any, @Req() req: any) {
        const condecoracion = await this.scoutService.createCondecoracion(data, req.user.id);
        return { success: true, message: 'Condecoración creada en catálogo', data: condecoracion };
    }

    @Get('condecoraciones')
    @RequirePermission(PERMISSIONS.CONDECORACION_VIEW)
    async findAllCondecoraciones() {
        const condecoraciones = await this.scoutService.findAllCondecoraciones();
        return { success: true, message: 'Condecoraciones recuperadas', data: condecoraciones };
    }

    @Delete('condecoraciones/:id')
    @RequirePermission(PERMISSIONS.CONDECORACION_DELETE)
    async removeCondecoracion(@Param('id') id: string, @Req() req: any) {
        await this.scoutService.removeCondecoracion(id, req.user.id);
        return { success: true, message: 'Condecoración eliminada', data: null };
    }

    @Post('otorgar-condecoracion')
    @RequirePermission(PERMISSIONS.CONDECORACION_OTORGAR)
    async otorgarCondecoracion(@Body() data: { jovenId: string; condecoracionId: string }, @Req() req: any) {
        const result = await this.scoutService.otorgarCondecoracion(data.jovenId, data.condecoracionId, req.user.id);
        return { success: true, message: 'Condecoración otorgada exitosamente', data: result };
    }

    @Get('jovenes/:jovenId/condecoraciones')
    @RequirePermission(PERMISSIONS.CONDECORACION_VIEW)
    async findJovenCondecoraciones(@Param('jovenId') jovenId: string) {
        const condecoraciones = await this.scoutService.findJovenCondecoraciones(jovenId);
        return { success: true, message: 'Condecoraciones del joven', data: condecoraciones };
    }

    @Delete('jovenes-condecoraciones/:id')
    @RequirePermission(PERMISSIONS.CONDECORACION_OTORGAR)
    async removeJovenCondecoracion(@Param('id') id: string, @Req() req: any) {
        await this.scoutService.removeJovenCondecoracion(id, req.user.id);
        return { success: true, message: 'Condecoración removida del joven', data: null };
    }
}
