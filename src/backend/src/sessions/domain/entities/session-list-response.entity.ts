import { ApiProperty } from '@nestjs/swagger';
import { SessionEntity } from './session.entity';

export class SessionListResponseEntity {
  @ApiProperty({ type: SessionEntity, isArray: true })
  past: SessionEntity[];

  @ApiProperty({ type: SessionEntity, isArray: true })
  future: SessionEntity[];
}
