import { PartialType } from '@nestjs/mapped-types';
import { CreateIndicadorDto } from './create-indicador.dto';

export class UpdateIndicadorDto extends PartialType(CreateIndicadorDto) { }
