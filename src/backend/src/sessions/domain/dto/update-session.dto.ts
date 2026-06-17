import { ApiPropertyOptional } from '@nestjs/swagger';
import { SessionType } from '../enums/session-type.enum';

export class UpdateSessionDto {
  @ApiPropertyOptional({ example: '2026-06-21T18:00:00.000Z' })
  scheduledAt?: string;

  @ApiPropertyOptional({ example: 60 })
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: SessionType, example: SessionType.IN_PERSON })
  type?: SessionType;

  @ApiPropertyOptional({ example: 'Sessao remarcada e com nova observacao.' })
  notes?: string | null;
}
