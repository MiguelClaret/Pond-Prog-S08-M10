import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SessionStatus } from '../enums/session-status.enum';
import { SessionType } from '../enums/session-type.enum';

export class SessionEntity {
  @ApiProperty({ example: '6b4178d9-8032-4158-95cd-560575d44f87' })
  id: string;

  @ApiProperty({ example: 'e64b295b-8b5c-4651-b59e-50e9ae2cbf6e' })
  patientProfileId: string;

  @ApiProperty({ example: 'cfc8053f-0b93-4e9a-b021-96c330d996c1' })
  patientId: string;

  @ApiProperty({ example: '1dba8f18-b920-4594-9cb8-95690f0c7450' })
  psychologistId: string;

  @ApiProperty({ example: '2026-06-20T18:00:00.000Z' })
  scheduledAt: Date | string;

  @ApiProperty({ example: 50 })
  durationMinutes: number;

  @ApiProperty({ enum: SessionType, example: SessionType.ONLINE })
  type: SessionType;

  @ApiProperty({ enum: SessionStatus, example: SessionStatus.SCHEDULED })
  status: SessionStatus;

  @ApiPropertyOptional({ example: 'Sessao focada em ansiedade no trabalho.' })
  notes: string | null;

  @ApiProperty({ example: '2026-06-17T12:00:00.000Z' })
  createdAt: Date | string;

  @ApiProperty({ example: '2026-06-17T12:00:00.000Z' })
  updatedAt: Date | string;
}
