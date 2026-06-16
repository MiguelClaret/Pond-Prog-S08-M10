import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../../auth/domain/enums/role.enum';

export class CreatedPatientResponseEntity {
  @ApiProperty({ example: 'profile-uuid' })
  patientProfileId: string;

  @ApiProperty({ example: 'user-uuid' })
  patientId: string;

  @ApiProperty({ example: 'Joao Silva' })
  fullName: string;

  @ApiProperty({ example: 'joao.silva@example.com' })
  email: string;

  @ApiPropertyOptional({ example: '11999999999' })
  phone: string | null;

  @ApiProperty({ example: 'a1b2c3d4e5f6' })
  provisionalPassword: string;

  @ApiProperty({ enum: Role, example: Role.PATIENT })
  role: Role;

  @ApiProperty({ example: true })
  firstAccess: boolean;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z' })
  createdAt: Date;
}
