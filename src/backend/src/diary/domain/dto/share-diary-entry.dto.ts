import { ApiProperty } from '@nestjs/swagger';

export class ShareDiaryEntryDto {
  @ApiProperty({ example: true })
  isSharedWithPsychologist: boolean;
}
