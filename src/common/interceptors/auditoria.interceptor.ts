import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
    constructor(private readonly prisma: PrismaService) { }

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const request = context.switchToHttp().getRequest();
        const usuario = request.user;
        const ip = request.ip;
        const tabla = context.getClass().name.replace('Controller', '');
        const accion = context.getHandler().name;
        const datosAntes = request.body; // In a real scenario, you'd fetch the record first if it's an update

        return next.handle().pipe(
            tap(async (datosDespues) => {
                try {
                    await this.prisma.bitacoraAuditoria.create({
                        data: {
                            usuarioId: usuario?.id || null,
                            accion,
                            tabla,
                            registroId: datosDespues?.id?.toString() || 'N/A',
                            datosAntes: datosAntes ? JSON.parse(JSON.stringify(datosAntes)) : null,
                            datosDespues: datosDespues ? JSON.parse(JSON.stringify(datosDespues)) : null,
                            ip,
                            createdBy: usuario?.id || 'SYSTEM',
                        },
                    });
                } catch (error) {
                    console.error('Error logging audit:', error);
                }
            }),
        );
    }
}
