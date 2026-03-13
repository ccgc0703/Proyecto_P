import { PrismaService } from '../modules/prisma/prisma.service';
export declare abstract class BaseService<T> {
    protected readonly prisma: PrismaService;
    protected readonly model: string;
    constructor(prisma: PrismaService, model: string);
    findAll(where?: any): Promise<any>;
    findOne(id: string): Promise<any>;
    create(data: any, userId?: string): Promise<any>;
    update(id: string, data: any, userId?: string): Promise<any>;
    remove(id: string, userId?: string): Promise<any>;
}
