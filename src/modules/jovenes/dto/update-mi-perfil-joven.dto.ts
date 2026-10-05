import { OmitType } from '@nestjs/mapped-types';
import { UpdateJovenDto } from './update-joven.dto';

/**
 * Autoedición de perfil por el propio joven (rol JOVEN).
 * Excluye unidadId y estado: son datos bajo control de la adulta/o responsable.
 */
export class UpdateMiPerfilJovenDto extends OmitType(UpdateJovenDto, [
    'unidadId',
    'estado',
] as const) {}
