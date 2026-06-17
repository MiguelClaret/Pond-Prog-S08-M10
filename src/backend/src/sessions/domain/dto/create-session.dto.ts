import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionType } from '../enums/session-type.enum';

export class CreateSessionDto {
  @ApiProperty({ example: 'cfc8053f-0b93-4e9a-b021-96c330d996c1' })
  patientId: string;

  @ApiProperty({ example: '2026-06-20T18:00:00.000Z' })
  scheduledAt: string;

  @ApiProperty({ example: 50 })
  durationMinutes: number;

  @ApiProperty({ enum: SessionType, example: SessionType.ONLINE })
  type: SessionType;

  @ApiPropertyOptional({ example: 'Paciente pediu foco em ansiedade no trabalho.' })
  notes?: string;
}
