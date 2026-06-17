import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedRequestUser } from '../../auth/domain/entities/authenticated-request-user.entity';
import { Role } from '../../auth/domain/enums/role.enum';
import { IStorageService } from '../../storage/domain/interfaces/storage.service.interface';
import { IWeatherService } from '../../weather/domain/interfaces/weather.service.interface';
import { CreateDiaryEntryFormDataDto } from '../domain/dto/create-diary-entry-form-data.dto';
import { ShareDiaryEntryDto } from '../domain/dto/share-diary-entry.dto';
import { CreateDiaryEntryInput } from '../domain/entities/create-diary-entry-input.entity';
import { DiaryEntryEntity } from '../domain/entities/diary-entry.entity';
import { DiaryEntryOwnerRecord } from '../domain/entities/diary-entry-owner-record.entity';
import { UploadedAudioFileEntity } from '../domain/entities/uploaded-audio-file.entity';
import { IDiaryRepository } from '../domain/interfaces/diary.repository.interface';
import { IDiaryService } from '../domain/interfaces/diary.service.interface';

@Injectable()
export class DiaryService implements IDiaryService {
  private readonly logger = new Logger(DiaryService.name);

  constructor(
    @Inject(IDiaryRepository)
    private readonly diaryRepository: IDiaryRepository,
    @Inject(IWeatherService)
    private readonly weatherService: IWeatherService,
    @Inject(IStorageService)
    private readonly storageService: IStorageService,
  ) {}

  async create(
    createDiaryEntryDto: CreateDiaryEntryFormDataDto,
    authenticatedUser: AuthenticatedRequestUser,
    uploadedAudioFile?: UploadedAudioFileEntity,
  ): Promise<DiaryEntryEntity> {
    try {
      this.ensurePatient(authenticatedUser, 'Apenas pacientes podem criar registros no diario.');
      this.validateDiaryEntryContent(
        createDiaryEntryDto.text,
        undefined,
        uploadedAudioFile,
      );
      const intensity = this.parseRequiredNumber(createDiaryEntryDto.intensity, 'intensity');
      this.validateIntensity(intensity);

      const normalizedText = this.normalizeNullableString(createDiaryEntryDto.text);
      let resolvedAudioUrl: string | null = null;

      if (uploadedAudioFile) {
        resolvedAudioUrl = await this.tryUploadDiaryAudio(
          authenticatedUser.sub,
          uploadedAudioFile,
          normalizedText,
          resolvedAudioUrl,
        );
      }

      const latitude = this.parseOptionalNumber(createDiaryEntryDto.latitude);
      const longitude = this.parseOptionalNumber(createDiaryEntryDto.longitude);
      const weatherData =
        latitude !== null && longitude !== null
          ? await this.tryGetCurrentWeather(latitude, longitude)
          : null;

      const input: CreateDiaryEntryInput = {
        patientId: authenticatedUser.sub,
        title: this.normalizeNullableString(createDiaryEntryDto.title),
        text: normalizedText,
        mood: createDiaryEntryDto.mood.trim(),
        intensity,
        audioUrl: resolvedAudioUrl,
        isSharedWithPsychologist: this.parseOptionalBoolean(
          createDiaryEntryDto.isSharedWithPsychologist,
        ),
        weatherTemperature: weatherData?.temperature ?? null,
        weatherDescription: weatherData?.description ?? null,
        latitude,
        longitude,
      };

      return await this.diaryRepository.create(input);
    } catch (error) {
      this.handleError(error, 'Erro interno ao criar registro no diario.');
    }
  }

  async findMine(authenticatedUser: AuthenticatedRequestUser): Promise<DiaryEntryEntity[]> {
    try {
      this.ensurePatient(authenticatedUser, 'Apenas pacientes podem acessar seus registros.');
      return await this.diaryRepository.findByPatientId(authenticatedUser.sub);
    } catch (error) {
      this.handleError(error, 'Erro interno ao buscar registros do diario.');
    }
  }

  async updateShare(
    id: string,
    shareDiaryEntryDto: ShareDiaryEntryDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<DiaryEntryEntity> {
    try {
      this.ensurePatient(
        authenticatedUser,
        'Somente o dono do registro pode alterar o compartilhamento.',
      );

      const entry = await this.getOwnedDiaryEntry(id, authenticatedUser.sub);

      return await this.diaryRepository.updateShare(entry.id, shareDiaryEntryDto.isSharedWithPsychologist);
    } catch (error) {
      this.handleError(error, 'Erro interno ao atualizar compartilhamento.');
    }
  }

  async remove(id: string, authenticatedUser: AuthenticatedRequestUser): Promise<DiaryEntryEntity> {
    try {
      this.ensurePatient(authenticatedUser, 'Somente o dono do registro pode remover o diario.');

      const entry = await this.getOwnedDiaryEntry(id, authenticatedUser.sub);
      return await this.diaryRepository.remove(entry.id);
    } catch (error) {
      this.handleError(error, 'Erro interno ao remover registro do diario.');
    }
  }

  async findSharedDiaryByPatient(
    patientId: string,
    authenticatedUser: AuthenticatedRequestUser,
    daysBack?: string,
  ): Promise<DiaryEntryEntity[]> {
    try {
      this.ensurePsychologist(
        authenticatedUser,
        'Apenas psicologas podem acessar registros compartilhados.',
      );

      const belongsToPsychologist = await this.diaryRepository.patientBelongsToPsychologist(
        patientId,
        authenticatedUser.sub,
      );

      if (!belongsToPsychologist) {
        throw new NotFoundException('Paciente nao encontrado para esta psicologa.');
      }

      const parsedDaysBack = this.parseDaysBack(daysBack);

      return await this.diaryRepository.findSharedByPatientId(patientId, parsedDaysBack);
    } catch (error) {
      this.handleError(error, 'Erro interno ao buscar registros compartilhados.');
    }
  }

  private async getOwnedDiaryEntry(id: string, patientId: string): Promise<DiaryEntryOwnerRecord> {
    const entry = await this.diaryRepository.findOwnerById(id);

    if (!entry) {
      throw new NotFoundException('Registro do diario nao encontrado.');
    }

    if (entry.patientId !== patientId) {
      throw new ForbiddenException('Somente o dono do registro pode alterar este diario.');
    }

    return entry;
  }

  private ensurePatient(authenticatedUser: AuthenticatedRequestUser, message: string): void {
    if (authenticatedUser.role !== Role.PATIENT) {
      throw new ForbiddenException(message);
    }
  }

  private ensurePsychologist(authenticatedUser: AuthenticatedRequestUser, message: string): void {
    if (authenticatedUser.role !== Role.PSYCHOLOGIST) {
      throw new ForbiddenException(message);
    }
  }

  private validateDiaryEntryContent(
    text?: string,
    audioUrl?: string,
    uploadedAudioFile?: UploadedAudioFileEntity,
  ): void {
    const normalizedText = this.normalizeNullableString(text);
    const normalizedAudioUrl = this.normalizeNullableString(audioUrl);

    if (!normalizedText && !normalizedAudioUrl && !uploadedAudioFile) {
      throw new BadRequestException('O registro deve ter texto ou audio.');
    }
  }

  private validateIntensity(intensity: number): void {
    if (intensity < 1 || intensity > 5) {
      throw new BadRequestException('A intensidade deve estar entre 1 e 5.');
    }
  }

  private parseDaysBack(daysBack?: string): number | undefined {
    if (daysBack === undefined || daysBack.trim() === '') {
      return undefined;
    }

    const parsed = Number(daysBack);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      throw new BadRequestException('daysBack deve ser um numero inteiro maior que zero.');
    }

    return parsed;
  }

  private normalizeNullableString(value?: string): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private parseRequiredNumber(value: number | string, fieldName: string): number {
    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`${fieldName} deve ser um numero valido.`);
    }

    return parsed;
  }

  private parseOptionalNumber(value?: number | string | null): number | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }

    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      throw new BadRequestException('Latitude e longitude devem ser numeros validos.');
    }

    return parsed;
  }

  private parseOptionalBoolean(value?: boolean | string | null): boolean {
    if (value === undefined || value === null || value === '') {
      return false;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    return String(value).toLowerCase() === 'true';
  }

  private async tryGetCurrentWeather(latitude: number, longitude: number) {
    try {
      return await this.weatherService.getCurrentWeather(latitude, longitude);
    } catch {
      this.logger.warn(
        `Nao foi possivel buscar clima para o diario do paciente na latitude=${latitude} longitude=${longitude}.`,
      );
      return null;
    }
  }

  private async tryUploadDiaryAudio(
    patientId: string,
    uploadedAudioFile: UploadedAudioFileEntity,
    text: string | null,
    fallbackAudioUrl: string | null,
  ): Promise<string | null> {
    try {
      return await this.storageService.uploadDiaryAudio(patientId, uploadedAudioFile);
    } catch (error) {
      this.logger.warn(`Nao foi possivel enviar o audio do diario do paciente ${patientId}.`);

      if (!text && !fallbackAudioUrl) {
        throw error;
      }

      return fallbackAudioUrl;
    }
  }

  private handleError(error: unknown, defaultMessage: string): never {
    if (
      error instanceof BadRequestException ||
      error instanceof ForbiddenException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    throw new InternalServerErrorException(defaultMessage);
  }
}
