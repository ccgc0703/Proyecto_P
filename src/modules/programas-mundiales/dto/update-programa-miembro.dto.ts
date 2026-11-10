import { OmitType, PartialType } from '@nestjs/mapped-types';
import { CreateProgramaMiembroDto } from './create-programa-miembro.dto';

/**
 * Edición de una inscripción existente. `miembroId` no se reasigna: el enlace
 * pertenece al miembro y mover la inscripción a otro miembro no tiene sentido.
 */
export class UpdateProgramaMiembroDto extends PartialType(
    OmitType(CreateProgramaMiembroDto, ['miembroId'] as const),
) { }
