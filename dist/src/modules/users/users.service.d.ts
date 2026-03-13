import { PrismaService } from '../prisma/prisma.service';
import { BaseService } from '../../common/base.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuditService } from '../audit/audit.service';
export declare class UsersService extends BaseService<any> {
    private readonly auditService;
    constructor(prisma: PrismaService, auditService: AuditService);
    findAll(where?: any): Promise<any>;
    findOne(id: string): Promise<any>;
    create(createUserDto: CreateUserDto, creatorId?: string, ip?: string, userAgent?: string): Promise<any>;
    updateUser(id: string, dto: UpdateUserDto, actorId: string, ip?: string, userAgent?: string): Promise<any>;
    remove(id: string, userId?: string, ip?: string, userAgent?: string): Promise<any>;
    private excludePassword;
}
