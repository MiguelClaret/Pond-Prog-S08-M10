import { ApiProperty } from '@nestjs/swagger';
import { UserEntity } from './user.entity';

export class AuthResponseEntity {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken: string;

  @ApiProperty({ type: UserEntity })
  user: UserEntity;
}
