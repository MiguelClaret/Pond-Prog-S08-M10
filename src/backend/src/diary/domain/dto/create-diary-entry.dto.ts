import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDiaryEntryDto {
  @ApiPropertyOptional({ example: 'Discussao no trabalho' })
  title?: string;

  @ApiPropertyOptional({ example: 'Hoje me senti ansioso durante a reuniao.' })
  text?: string;

  @ApiProperty({ example: 'ansioso' })
  mood: string;

  @ApiProperty({ example: 4, description: 'Valor de 1 a 5' })
  intensity: number;

  @ApiPropertyOptional({ example: 'https://storage.example.com/audio/registro-1.m4a' })
  audioUrl?: string;

  @ApiPropertyOptional({ example: false })
  isSharedWithPsychologist?: boolean;

  @ApiPropertyOptional({ example: -23.55052 })
  latitude?: number;

  @ApiPropertyOptional({ example: -46.633308 })
  longitude?: number;
}
