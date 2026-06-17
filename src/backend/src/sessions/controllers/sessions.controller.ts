import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthenticatedRequestUser } from '../../auth/domain/entities/authenticated-request-user.entity';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { CreateSessionDto } from '../domain/dto/create-session.dto';
import { FinishSessionDto } from '../domain/dto/finish-session.dto';
import { UpdateSessionDto } from '../domain/dto/update-session.dto';
import { SessionEntity } from '../domain/entities/session.entity';
import { SessionListResponseEntity } from '../domain/entities/session-list-response.entity';
import { ISessionsService } from '../domain/interfaces/sessions.service.interface';

type AuthenticatedRequest = Request & {
  user: AuthenticatedRequestUser;
};

@ApiTags('sessions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('sessions')
export class SessionsController {
  constructor(
    @Inject(ISessionsService)
    private readonly sessionsService: ISessionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cria uma nova sessao para um paciente vinculado' })
  @ApiCreatedResponse({ description: 'Sessao criada com sucesso', type: SessionEntity })
  @ApiBadRequestResponse({ description: 'Dados invalidos para criar sessao' })
  @ApiForbiddenResponse({ description: 'Apenas psicologas podem criar sessoes' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Paciente nao encontrado para esta psicologa' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao criar sessao' })
  async create(
    @Body() createSessionDto: CreateSessionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.sessionsService.create(createSessionDto, request.user);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lista sessoes do usuario autenticado, futuras e ultimos 7 dias' })
  @ApiOkResponse({ description: 'Sessoes encontradas', type: SessionListResponseEntity })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao buscar sessoes' })
  async findMine(@Req() request: AuthenticatedRequest) {
    return await this.sessionsService.findMine(request.user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Busca detalhes de uma sessao especifica' })
  @ApiParam({ name: 'id', example: '6b4178d9-8032-4158-95cd-560575d44f87' })
  @ApiOkResponse({ description: 'Sessao encontrada', type: SessionEntity })
  @ApiForbiddenResponse({ description: 'Usuario nao pode acessar esta sessao' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Sessao nao encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao buscar sessao' })
  async findOne(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return await this.sessionsService.findOne(id, request.user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edita data, horario, tipo, duracao e notas de uma sessao' })
  @ApiParam({ name: 'id', example: '6b4178d9-8032-4158-95cd-560575d44f87' })
  @ApiOkResponse({ description: 'Sessao atualizada com sucesso', type: SessionEntity })
  @ApiBadRequestResponse({ description: 'Dados invalidos ou nenhuma alteracao enviada' })
  @ApiForbiddenResponse({ description: 'Apenas psicologas podem editar sessoes ativas' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Sessao nao encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao atualizar sessao' })
  async update(
    @Param('id') id: string,
    @Body() updateSessionDto: UpdateSessionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.sessionsService.update(id, updateSessionDto, request.user);
  }

  @Patch(':id/finish')
  @ApiOperation({ summary: 'Marca uma sessao como concluida' })
  @ApiParam({ name: 'id', example: '6b4178d9-8032-4158-95cd-560575d44f87' })
  @ApiOkResponse({ description: 'Sessao concluida com sucesso', type: SessionEntity })
  @ApiForbiddenResponse({ description: 'Apenas psicologas podem concluir sessoes ativas' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Sessao nao encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao concluir sessao' })
  async finish(
    @Param('id') id: string,
    @Body() finishSessionDto: FinishSessionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.sessionsService.finish(id, finishSessionDto, request.user);
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Marca uma sessao como cancelada' })
  @ApiParam({ name: 'id', example: '6b4178d9-8032-4158-95cd-560575d44f87' })
  @ApiOkResponse({ description: 'Sessao cancelada com sucesso', type: SessionEntity })
  @ApiForbiddenResponse({ description: 'Apenas psicologas podem cancelar sessoes ativas' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Sessao nao encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao cancelar sessao' })
  async cancel(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return await this.sessionsService.cancel(id, request.user);
  }
}
