import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../enums/role.enum';

export class UserEntity {
  @ApiProperty({ example: 'b2cc4650-4dc4-4b8c-a7b9-d17d7dbf31ba' })
  id: string;

  @ApiProperty({ example: 'Dra. Maria Silva' })
  fullName: string;

  @ApiProperty({ example: 'maria.silva@example.com' })
  email: string;

  @ApiProperty({ enum: Role, example: Role.PSYCHOLOGIST })
  role: Role;

  @ApiProperty({ example: false })
  firstAccess: boolean;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z' })
  createdAt: Date;
}
