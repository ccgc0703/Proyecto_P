import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OrganizacionService } from './organizacion.service';
import { CreateNodoDto } from './dto/create-nodo.dto';
import { UpdateNodoDto } from './dto/update-nodo.dto';
import { AsignarUnidadDto } from './dto/asignar-unidad.dto';
import { CreateCargoDto } from './dto/create-cargo.dto';
import { UpdateCargoDto } from './dto/update-cargo.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS, ROLES_EDITORES_ORGANIZACION } from '../../common/constantes';
import { TipoNodoOrganizacion } from '@prisma/client';

/**
 * Árbol organizacional nacional:
 * Consejo Nacional → Dirección Ejecutiva → Regiones → Distritos → Grupos → Unidades (ramas).
 *
 * Lectura: cualquier rol con `organizacion:view`.
 * Escritura (nodos y cargos): SYSTEM_ADMIN, NATIONAL_BOARD, NATIONAL_EXECUTIVE
 * (además de `organizacion:create/update/delete`).
 */
@Controller('organizacion')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrganizacionController {
    constructor(private readonly organizacionService: OrganizacionService) { }

    private assertEditor(user: any) {
        const roles: string[] = Array.isArray(user?.roles) ? user.roles : [];
        if (!roles.some((r) => ROLES_EDITORES_ORGANIZACION.includes(r))) {
            throw new ForbiddenException('Solo la estructura nacional gestiona la organización y sus cargos');
        }
    }

    @Get('arbol')
    @RequirePermission(PERMISSIONS.ORGANIZACION_VIEW)
    async getArbol() {
        const arbol = await this.organizacionService.getArbol();
        return {
            success: true,
            message: 'Árbol organizacional recuperado',
            data: arbol,
        };
    }

    @Get('nodos')
    @RequirePermission(PERMISSIONS.ORGANIZACION_VIEW)
    async listarNodos(@Query('tipo') tipo?: TipoNodoOrganizacion) {
        const nodos = await this.organizacionService.listarNodos(tipo);
        return {
            success: true,
            message: 'Nodos de organización recuperados',
            data: nodos,
        };
    }

    @Post('nodos')
    @RequirePermission(PERMISSIONS.ORGANIZACION_CREATE)
    async create(@Body() dto: CreateNodoDto, @Req() req: any) {
        this.assertEditor(req.user);
        const nodo = await this.organizacionService.create(dto, req.user.id);
        return {
            success: true,
            message: 'Nodo de organización creado exitosamente',
            data: nodo,
        };
    }

    @Patch('nodos/:id')
    @RequirePermission(PERMISSIONS.ORGANIZACION_UPDATE)
    async update(@Param('id') id: string, @Body() dto: UpdateNodoDto, @Req() req: any) {
        this.assertEditor(req.user);
        const nodo = await this.organizacionService.update(id, dto, req.user.id);
        return {
            success: true,
            message: 'Nodo de organización actualizado',
            data: nodo,
        };
    }

    @Delete('nodos/:id')
    @RequirePermission(PERMISSIONS.ORGANIZACION_DELETE)
    async remove(@Param('id') id: string, @Req() req: any) {
        this.assertEditor(req.user);
        await this.organizacionService.remove(id, req.user.id);
        return {
            success: true,
            message: 'Nodo de organización eliminado',
            data: null,
        };
    }

    @Patch('unidades/:unidadId/grupo')
    @RequirePermission(PERMISSIONS.ORGANIZACION_UPDATE)
    async asignarUnidad(
        @Param('unidadId') unidadId: string,
        @Body() dto: AsignarUnidadDto,
        @Req() req: any,
    ) {
        this.assertEditor(req.user);
        const unidad = await this.organizacionService.asignarUnidad(
            unidadId,
            dto.grupoId,
            req.user.id,
        );
        return {
            success: true,
            message: 'Unidad asignada al grupo',
            data: unidad,
        };
    }

    // ── Cargos por nodo ────────────────────────────────────────────────────

    @Get('cargos-permitidos')
    @RequirePermission(PERMISSIONS.ORGANIZACION_VIEW)
    async cargosPermitidos(@Query('tipo') tipo?: TipoNodoOrganizacion) {
        if (!tipo) {
            return {
                success: true,
                message: 'Indicá un tipo de nodo (?tipo=REGION)',
                data: [],
            };
        }
        return {
            success: true,
            message: 'Cargos permitidos para el tipo de nodo',
            data: this.organizacionService.cargosPermitidos(tipo),
        };
    }

    @Get('nodos/:id/cargos')
    @RequirePermission(PERMISSIONS.ORGANIZACION_VIEW)
    async getCargos(@Param('id') id: string) {
        const cargos = await this.organizacionService.getCargos(id);
        return {
            success: true,
            message: 'Cargos del nodo recuperados',
            data: cargos,
        };
    }

    @Post('nodos/:id/cargos')
    @RequirePermission(PERMISSIONS.ORGANIZACION_UPDATE)
    async crearCargo(@Param('id') id: string, @Body() dto: CreateCargoDto, @Req() req: any) {
        this.assertEditor(req.user);
        const cargo = await this.organizacionService.crearCargo(id, dto, req.user.id);
        return {
            success: true,
            message: 'Cargo asignado exitosamente',
            data: cargo,
        };
    }

    @Patch('cargos/:id')
    @RequirePermission(PERMISSIONS.ORGANIZACION_UPDATE)
    async actualizarCargo(@Param('id') id: string, @Body() dto: UpdateCargoDto, @Req() req: any) {
        this.assertEditor(req.user);
        const cargo = await this.organizacionService.actualizarCargo(id, dto, req.user.id);
        return {
            success: true,
            message: 'Cargo actualizado',
            data: cargo,
        };
    }

    @Delete('cargos/:id')
    @RequirePermission(PERMISSIONS.ORGANIZACION_DELETE)
    async eliminarCargo(@Param('id') id: string, @Req() req: any) {
        this.assertEditor(req.user);
        await this.organizacionService.eliminarCargo(id, req.user.id);
        return {
            success: true,
            message: 'Cargo eliminado',
            data: null,
        };
    }
}
