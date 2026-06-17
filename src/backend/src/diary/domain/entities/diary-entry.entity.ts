import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DiaryEntryEntity {
  @ApiProperty({ example: 'f4b91f4a-7b31-4ec2-9242-39ebc9f768e9' })
  id: string;

  @ApiProperty({ example: 'cfc8053f-0b93-4e9a-b021-96c330d996c1' })
  patientId: string;

  @ApiPropertyOptional({ example: 'Discussao no trabalho' })
  title: string | null;

  @ApiPropertyOptional({ example: 'Hoje me senti ansioso durante a reuniao.' })
  text: string | null;

  @ApiProperty({ example: 'ansioso' })
  mood: string;

  @ApiProperty({ example: 4 })
  intensity: number;

  @ApiPropertyOptional({ example: 'https://storage.example.com/audio/registro-1.m4a' })
  audioUrl: string | null;

  @ApiProperty({ example: false })
  isSharedWithPsychologist: boolean;

  @ApiPropertyOptional({ example: 23.4 })
  weatherTemperature: number | null;

  @ApiPropertyOptional({ example: 'Parcialmente nublado' })
  weatherDescription: string | null;

  @ApiPropertyOptional({ example: -23.55052 })
  latitude: number | null;

  @ApiPropertyOptional({ example: -46.633308 })
  longitude: number | null;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-06-16T12:00:00.000Z' })
  updatedAt: Date;
}
