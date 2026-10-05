import { PartialType } from '@nestjs/mapped-types';
import { CreateAdelantoDto } from './create-adelanto.dto';

export class UpdateAdelantoDto extends PartialType(CreateAdelantoDto) { }
