import { Body, Controller, Inject, Post, Req, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { AuthenticatedRequestUser } from '../../auth/domain/entities/authenticated-request-user.entity';
import { CreatePatientDto } from '../domain/dto/create-patient.dto';
import { CreatedPatientResponseEntity } from '../domain/entities/created-patient-response.entity';
import { IPatientsService } from '../domain/interfaces/patients.service.interface';

type AuthenticatedRequest = Request & {
  user: AuthenticatedRequestUser;
};

@ApiTags('patients')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('patients')
export class PatientsController {
  constructor(
    @Inject(IPatientsService)
    private readonly patientsService: IPatientsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Cadastra um paciente com senha provisoria' })
  @ApiCreatedResponse({
    description: 'Paciente cadastrado com sucesso',
    type: CreatedPatientResponseEntity,
  })
  @ApiBadRequestResponse({ description: 'Ja existe um usuario cadastrado com este email' })
  @ApiForbiddenResponse({ description: 'Apenas psicologas podem cadastrar pacientes' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao cadastrar paciente' })
  async create(
    @Body() createPatientDto: CreatePatientDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.patientsService.create(createPatientDto, request.user);
  }
}
