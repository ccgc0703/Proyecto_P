import 'dotenv/config';
import { PrismaService } from '../modules/prisma/prisma.service';
import { AuditService } from '../modules/audit/audit.service';
import { NormativaService, Actor } from '../modules/normativa/normativa.service';
import { UnitPolicy } from '../common/policies/unit.policy';
import { NodoPolicy } from '../common/policies/nodo.policy';

describe('NormativaService (integracion con PostgreSQL)', () => {
    const prisma = new PrismaService();
    const service = new NormativaService(
        prisma,
        new AuditService(prisma),
        new UnitPolicy(new NodoPolicy(prisma)),
    );

    const sufijo = Date.now().toString().slice(-8);
    let actor: Actor;

    const archivo = {
        fieldname: 'file',
        originalname: `norma-${sufijo}.pdf`,
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 2048,
        destination: 'uploads/normativa',
        filename: `integracion-${sufijo}.pdf`,
        path: `uploads/normativa/integracion-${sufijo}.pdf`,
    };

    let reglamentoId: string;
    let actaId: string;

    beforeAll(async () => {
        const usuario = await prisma.usuario.create({
            data: {
                nombre: 'Integracion Normativa',
                email: `normativa-integracion-${sufijo}@test.com`,
                password: 'no-usada',
            },
        });
        actor = { id: usuario.id, roles: ['SYSTEM_ADMIN'] };

        const reglamento = await service.crear(
            {
                titulo: `Reglamento integracion ${sufijo}`,
                categoria: 'REGLAMENTO',
                descripcion: 'Documento de prueba',
            } as any,
            archivo as any,
            actor,
        );
        reglamentoId = reglamento.id;

        const acta = await service.crear(
            {
                titulo: `Acta integracion ${sufijo}`,
                categoria: 'ACTA',
                descripcion: 'Documento historico',
            } as any,
            { ...archivo, filename: `acta-${sufijo}.pdf` } as any,
            actor,
        );
        actaId = acta.id;
    });

    afterAll(async () => {
        await prisma.auditLog.deleteMany({
            where: { module: 'normativa', targetId: { in: [reglamentoId, actaId] } },
        });
        await prisma.documento.deleteMany({
            where: { id: { in: [reglamentoId, actaId] } },
        });
        await prisma.usuario.delete({ where: { id: actor.id } });
        await prisma.onModuleDestroy();
    });

    it('crea el documento con ruta relativa y metadatos del archivo', async () => {
        const documento = await service.obtener(reglamentoId);

        expect(documento.archivoUrl).toBe(`normativa/integracion-${sufijo}.pdf`);
        expect(documento.mimeType).toBe('application/pdf');
        expect(documento.tamano).toBe(2048);
        expect(documento.nombreOriginal).toBe(`norma-${sufijo}.pdf`);
        expect(documento.version).toBe(1);
        expect(documento.vigente).toBe(true);
        expect(documento.unidadId).toBeNull();
    });

    it('filtra por categoria y busqueda', async () => {
        const reglamentos = await service.listar(
            { categoria: 'REGLAMENTO' } as any,
            actor,
            { q: sufijo },
        );

        expect(reglamentos.map((d) => d.id)).toContain(reglamentoId);
        expect(reglamentos.map((d) => d.id)).not.toContain(actaId);
    });

    it('pagina y cuenta con los mismos filtros', async () => {
        const pagina = await service.listar(
            { categoria: 'ACTA' } as any,
            actor,
            { page: 1, limit: 1, q: sufijo },
        );
        const total = await service.contar({ categoria: 'ACTA' } as any, actor, sufijo);

        expect(pagina).toHaveLength(1);
        expect(pagina[0].id).toBe(actaId);
        expect(pagina[0].Unidad).toBeNull();
        expect(total).toBeGreaterThanOrEqual(1);
    });

    it('actualiza la vigencia y conserva el archivo', async () => {
        const actualizado = await service.actualizar(
            reglamentoId,
            { vigente: false, version: 2 } as any,
            actor,
        );

        expect(actualizado.vigente).toBe(false);
        expect(actualizado.version).toBe(2);
        expect(actualizado.archivoUrl).toBe(`normativa/integracion-${sufijo}.pdf`);
    });

    it('aplica soft-delete y deja de aparecer en los listados', async () => {
        await service.eliminar(actaId, actor);

        const listado = await service.listar({} as any, actor, { q: sufijo });
        expect(listado.map((d) => d.id)).not.toContain(actaId);
        await expect(service.obtener(actaId)).rejects.toThrow('Documento no encontrado');
    });
});
