import { ApiProperty } from '@nestjs/swagger';

export class LoginAuthDto {
  @ApiProperty({
    example: 'maria.silva@example.com',
    description: 'Email do usuario',
  })
  email: string;

  @ApiProperty({
    example: 'senha123',
    description: 'Senha do usuario',
  })
  password: string;
}
