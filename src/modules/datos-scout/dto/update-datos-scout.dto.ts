import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateDatosScoutDto } from './create-datos-scout.dto';

/** El `miembroId` va en la ruta (`PATCH /datos-scout/miembro/:miembroId`). */
export class UpdateDatosScoutDto extends PartialType(
    OmitType(CreateDatosScoutDto, ['miembroId'] as const),
) { }
