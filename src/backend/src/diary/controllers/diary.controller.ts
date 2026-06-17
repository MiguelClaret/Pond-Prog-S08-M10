import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthenticatedRequestUser } from '../../auth/domain/entities/authenticated-request-user.entity';
import { AuthGuard } from '../../auth/guards/auth.guard';
import { CreateDiaryEntryFormDataDto } from '../domain/dto/create-diary-entry-form-data.dto';
import { ShareDiaryEntryDto } from '../domain/dto/share-diary-entry.dto';
import { DiaryEntryEntity } from '../domain/entities/diary-entry.entity';
import { UploadedAudioFileEntity } from '../domain/entities/uploaded-audio-file.entity';
import { IDiaryService } from '../domain/interfaces/diary.service.interface';

type AuthenticatedRequest = Request & {
  user: AuthenticatedRequestUser;
};

@ApiTags('diary')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('diary')
export class DiaryController {
  constructor(
    @Inject(IDiaryService)
    private readonly diaryService: IDiaryService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('audio'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cria um registro no diario do paciente autenticado' })
  @ApiBody({ type: CreateDiaryEntryFormDataDto })
  @ApiCreatedResponse({ description: 'Registro criado com sucesso', type: DiaryEntryEntity })
  @ApiBadRequestResponse({ description: 'Dados invalidos para criar registro' })
  @ApiForbiddenResponse({ description: 'Apenas pacientes podem criar registros no diario' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao criar registro no diario' })
  async create(
    @Body() createDiaryEntryDto: CreateDiaryEntryFormDataDto,
    @UploadedFile() uploadedAudioFile: Express.Multer.File | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    const mappedAudioFile: UploadedAudioFileEntity | undefined = uploadedAudioFile
      ? {
          buffer: uploadedAudioFile.buffer,
          mimetype: uploadedAudioFile.mimetype,
          originalname: uploadedAudioFile.originalname,
          size: uploadedAudioFile.size,
        }
      : undefined;

    return await this.diaryService.create(createDiaryEntryDto, request.user, mappedAudioFile);
  }

  @Get('me')
  @ApiOperation({ summary: 'Lista todos os registros do paciente autenticado' })
  @ApiOkResponse({ description: 'Registros encontrados', type: DiaryEntryEntity, isArray: true })
  @ApiForbiddenResponse({ description: 'Apenas pacientes podem acessar seus registros' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao buscar registros do diario' })
  async findMine(@Req() request: AuthenticatedRequest) {
    return await this.diaryService.findMine(request.user);
  }

  @Patch(':id/share')
  @ApiOperation({ summary: 'Atualiza o compartilhamento de um registro do paciente autenticado' })
  @ApiParam({ name: 'id', example: 'f4b91f4a-7b31-4ec2-9242-39ebc9f768e9' })
  @ApiOkResponse({ description: 'Compartilhamento atualizado com sucesso', type: DiaryEntryEntity })
  @ApiBadRequestResponse({ description: 'Dados invalidos para atualizar compartilhamento' })
  @ApiForbiddenResponse({ description: 'Somente o dono do registro pode alterar o compartilhamento' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Registro do diario nao encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao atualizar compartilhamento' })
  async updateShare(
    @Param('id') id: string,
    @Body() shareDiaryEntryDto: ShareDiaryEntryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.diaryService.updateShare(id, shareDiaryEntryDto, request.user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove um registro do diario do paciente autenticado' })
  @ApiParam({ name: 'id', example: 'f4b91f4a-7b31-4ec2-9242-39ebc9f768e9' })
  @ApiOkResponse({ description: 'Registro removido com sucesso', type: DiaryEntryEntity })
  @ApiForbiddenResponse({ description: 'Somente o dono do registro pode remover o diario' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Registro do diario nao encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao remover registro do diario' })
  async remove(@Param('id') id: string, @Req() request: AuthenticatedRequest) {
    return await this.diaryService.remove(id, request.user);
  }

  @Get('shared-diary/:patientId')
  @ApiOperation({ summary: 'Lista os registros compartilhados de um paciente vinculado a psicologa autenticada' })
  @ApiParam({ name: 'patientId', example: 'cfc8053f-0b93-4e9a-b021-96c330d996c1' })
  @ApiQuery({
    name: 'daysBack',
    required: false,
    example: '7',
    description: 'Quantidade de dias para tras a partir de hoje',
  })
  @ApiOkResponse({
    description: 'Registros compartilhados encontrados',
    type: DiaryEntryEntity,
    isArray: true,
  })
  @ApiForbiddenResponse({ description: 'Apenas psicologas podem acessar registros compartilhados' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Paciente nao encontrado para esta psicologa' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao buscar registros compartilhados' })
  async findSharedDiaryByPatient(
    @Param('patientId') patientId: string,
    @Query('daysBack') daysBack: string | undefined,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.diaryService.findSharedDiaryByPatient(patientId, request.user, daysBack);
  }
}
