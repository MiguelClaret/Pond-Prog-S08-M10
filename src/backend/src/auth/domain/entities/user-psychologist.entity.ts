import { ApiProperty } from '@nestjs/swagger';

export class UserPsychologistEntity {
  @ApiProperty({ example: '1dba8f18-b920-4594-9cb8-95690f0c7450' })
  id: string;

  @ApiProperty({ example: 'Dra. Maria Silva' })
  fullName: string;

  @ApiProperty({ example: 'maria.silva@example.com' })
  email: string;
}
