import { Controller, Get, Post, Patch, Body, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermission } from '../../common/decorators/permissions.decorator';
import { PERMISSIONS } from '../../common/constantes';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Post()
    @RequirePermission(PERMISSIONS.USER_CREATE)
    async create(@Body() createUserDto: CreateUserDto, @Req() req: any) {
        const user = await this.usersService.create(
            createUserDto,
            req.user.id,
            req.ip,
            req.headers?.['user-agent'],
        );
        return {
            success: true,
            message: 'Usuario creado exitosamente',
            data: user,
        };
    }

    @Get()
    @RequirePermission(PERMISSIONS.USER_VIEW)
    async findAll() {
        const users = await this.usersService.findAll();
        return {
            success: true,
            message: 'Usuarios recuperados exitosamente',
            data: users,
        };
    }

    @Get(':id')
    @RequirePermission(PERMISSIONS.USER_VIEW)
    async findOne(@Param('id') id: string) {
        const user = await this.usersService.findOne(id);
        return {
            success: true,
            message: 'Usuario recuperado exitosamente',
            data: user,
        };
    }

    @Patch(':id')
    @RequirePermission(PERMISSIONS.USER_UPDATE)
    async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @Req() req: any) {
        const user = await this.usersService.updateUser(
            id,
            updateUserDto,
            req.user.id,
            req.ip,
            req.headers?.['user-agent'],
        );
        return {
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: user,
        };
    }

    @Delete(':id')
    @RequirePermission(PERMISSIONS.USER_DELETE)
    async remove(@Param('id') id: string, @Req() req: any) {
        await this.usersService.remove(
            id,
            req.user.id,
            req.ip,
            req.headers?.['user-agent'],
        );
        return {
            success: true,
            message: 'Usuario eliminado (soft delete) exitosamente',
            data: null,
        };
    }
}

