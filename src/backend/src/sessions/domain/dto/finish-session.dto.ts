import { ApiPropertyOptional } from '@nestjs/swagger';

export class FinishSessionDto {
  @ApiPropertyOptional({ example: 'Sessao concluida com boa evolucao do paciente.' })
  notes?: string | null;
}
