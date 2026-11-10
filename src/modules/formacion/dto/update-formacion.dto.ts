import { PartialType } from '@nestjs/mapped-types';
import { CreateFormacionDto } from './create-formacion.dto';

export class UpdateFormacionDto extends PartialType(CreateFormacionDto) { }
