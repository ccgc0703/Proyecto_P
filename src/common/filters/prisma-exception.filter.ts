import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class PrismaExceptionFilter implements ExceptionFilter {
    catch(exception: any, host: ArgumentsHost) {
        console.error('--- Global Exception Caught ---');
        console.error('Type:', exception?.constructor?.name);
        console.error('Code:', exception?.code);
        console.error('Message:', exception?.message);
        console.error('-------------------------------');

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // Si es una excepción de Prisma (P2002, P2003, etc.)
        const isPrismaError = exception?.code?.startsWith('P');

        if (isPrismaError) {
            switch (exception.code) {
                case 'P2002': {
                    return response.status(HttpStatus.CONFLICT).json({
                        statusCode: HttpStatus.CONFLICT,
                        message: 'Conflicto: Ya existe un registro con este identificador único (email o cédula).',
                        error: 'Conflict',
                    });
                }
                case 'P2003': {
                    return response.status(HttpStatus.BAD_REQUEST).json({
                        statusCode: HttpStatus.BAD_REQUEST,
                        message: 'Error de Relación: El ID de la Unidad o Relación proporcionado no existe.',
                        error: 'Bad Request',
                        details: exception.meta,
                    });
                }
                case 'P2025': {
                    return response.status(HttpStatus.NOT_FOUND).json({
                        statusCode: HttpStatus.NOT_FOUND,
                        message: 'No Encontrado: El registro solicitado no existe o fue eliminado.',
                        error: 'Not Found',
                    });
                }
                default: {
                    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
                        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                        message: `Error de Base de Datos (${exception.code})`,
                        error: 'Internal Server Error',
                    });
                }
            }
        }

        // Si es un error de Nest (ej. UnauthorizedException, ForbiddenException)
        if (exception instanceof Error && 'getResponse' in exception) {
            const status = (exception as any).getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR;
            return response.status(status).json((exception as any).getResponse());
        }

        // Error genérico 500
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            message: 'Error interno del servidor',
            error: 'Internal Server Error',
        });
    }
}
