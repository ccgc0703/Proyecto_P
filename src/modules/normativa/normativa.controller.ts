import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Req,
    Res,
    StreamableFile,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { NormativaService, Actor } from './normativa.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { UpdateDocumentoDto } from './dto/update-documento.dto';
import { QueryDocumentosDto } from './dto/query-documentos.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';
import { resolverOpcionesLista, hayPaginacion, metaPagina } from '../../common/paginacion';
import {
    ArchivoSubido,
    extensionDe,
    eliminarArchivoSiExiste,
    firmaValida,
    nombreDescargaSeguro,
    OPCIONES_MULTER,
} from './archivos';

@Controller('normativa')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NormativaController {
    constructor(private readonly normativaService: NormativaService) { }

    // ── Documentos ─────────────────────────────────────────────────────

    @Get('documentos')
    @RequirePermission(PERMISSIONS.NORMATIVA_VIEW)
    async listar(@Query() query: QueryDocumentosDto, @Req() req: any) {
        const opts = resolverOpcionesLista(req.query ?? {});
        const user = req.user as Actor;
        const data = await this.normativaService.listar(query, user, opts);

        if (!hayPaginacion(opts)) {
            return { success: true, message: 'Documentos recuperados', data };
        }

        const total = await this.normativaService.contar(query, user, opts.q);
        return {
            success: true,
            message: 'Documentos recuperados',
            data,
            meta: metaPagina(total, opts),
        };
    }

    @Get('documentos/:id/archivo')
    @RequirePermission(PERMISSIONS.NORMATIVA_VIEW)
    async descargar(
        @Param('id') id: string,
        @Req() req: any,
        @Res({ passthrough: true }) res: Response,
    ): Promise<StreamableFile> {
        const { ruta, nombreOriginal, mimeType } = await this.normativaService.obtenerArchivo(
            id,
            req.user as Actor,
        );
        const { ascii, utf8 } = nombreDescargaSeguro(nombreOriginal);

        res.setHeader('Content-Type', mimeType);
        res.setHeader(
            'Content-Disposition',
            `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`,
        );
        res.setHeader('X-Content-Type-Options', 'nosniff');

        return new StreamableFile(createReadStream(ruta));
    }

    @Get('documentos/:id')
    @RequirePermission(PERMISSIONS.NORMATIVA_VIEW)
    async obtener(@Param('id') id: string, @Req() req: any) {
        const data = await this.normativaService.obtener(id, req.user as Actor);
        return { success: true, message: 'Documento recuperado', data };
    }

    @Post('documentos')
    @RequirePermission(PERMISSIONS.NORMATIVA_MANAGE)
    @UseInterceptors(FileInterceptor('file', OPCIONES_MULTER))
    async crear(
        @Body() dto: CreateDocumentoDto,
        @UploadedFile() archivo: ArchivoSubido | undefined,
        @Req() req: any,
    ) {
        if (!archivo) {
            throw new BadRequestException('Debes adjuntar un archivo PDF o DOCX en el campo "file"');
        }

        const extension = extensionDe(archivo.filename);
        if (!firmaValida(archivo.path, extension)) {
            eliminarArchivoSiExiste(archivo.path);
            throw new BadRequestException(
                'El contenido del archivo no corresponde a un PDF o DOCX valido',
            );
        }

        try {
            const data = await this.normativaService.crear(dto, archivo, req.user as Actor);
            return { success: true, message: 'Documento cargado exitosamente', data };
        } catch (error) {
            // Si la creación falla (validación de unidad, FK, etc.) no dejamos
            // el archivo huérfano en disco.
            eliminarArchivoSiExiste(archivo.path);
            throw error;
        }
    }

    @Patch('documentos/:id')
    @RequirePermission(PERMISSIONS.NORMATIVA_MANAGE)
    async actualizar(
        @Param('id') id: string,
        @Body() dto: UpdateDocumentoDto,
        @Req() req: any,
    ) {
        const data = await this.normativaService.actualizar(id, dto, req.user as Actor);
        return { success: true, message: 'Documento actualizado exitosamente', data };
    }

    @Delete('documentos/:id')
    @RequirePermission(PERMISSIONS.NORMATIVA_MANAGE)
    async eliminar(@Param('id') id: string, @Req() req: any) {
        await this.normativaService.eliminar(id, req.user as Actor);
        return { success: true, message: 'Documento eliminado exitosamente', data: null };
    }
}
