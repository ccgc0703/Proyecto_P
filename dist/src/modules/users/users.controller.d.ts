import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findAll(): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    update(id: string, updateUserDto: UpdateUserDto, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    remove(id: string, req: any): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
}
