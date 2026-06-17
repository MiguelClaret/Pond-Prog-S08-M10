import { ApiProperty } from '@nestjs/swagger';

export class ChangeFirstAccessPasswordDto {
  @ApiProperty({
    example: 'novaSenha123',
    description: 'Nova senha definitiva do usuario',
  })
  newPassword: string;
}
