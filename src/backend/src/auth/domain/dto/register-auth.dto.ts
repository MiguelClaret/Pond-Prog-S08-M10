import { ApiProperty } from '@nestjs/swagger';

export class RegisterAuthDto {
  @ApiProperty({
    example: 'Dra. Maria Silva',
    description: 'Nome completo da psicologa',
  })
  fullName: string;

  @ApiProperty({
    example: 'maria.silva@example.com',
    description: 'Email unico do usuario',
  })
  email: string;

  @ApiProperty({
    example: 'senha123',
    description: 'Senha em texto puro para gerar o hash no backend',
  })
  password: string;
}
