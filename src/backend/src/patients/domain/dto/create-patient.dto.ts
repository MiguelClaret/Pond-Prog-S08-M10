import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePatientDto {
  @ApiProperty({
    example: 'Joao Silva',
    description: 'Nome completo do paciente',
  })
  fullName: string;

  @ApiProperty({
    example: 'joao.silva@example.com',
    description: 'Email unico do paciente',
  })
  email: string;

  @ApiPropertyOptional({
    example: '11999999999',
    description: 'Telefone do paciente',
  })
  phone?: string;
}
