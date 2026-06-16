import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { AuthenticatedRequestUser } from '../../auth/domain/entities/authenticated-request-user.entity';
import { Role } from '../../auth/domain/enums/role.enum';
import { CreatePatientDto } from '../domain/dto/create-patient.dto';
import { CreatedPatientResponseEntity } from '../domain/entities/created-patient-response.entity';
import { ICreatePatientRepository } from '../domain/interfaces/create-patient.repository.interface';
import { IPatientsService } from '../domain/interfaces/patients.service.interface';
import { UserEntity } from 'src/auth/domain/entities/user.entity';

@Injectable()
export class PatientsService implements IPatientsService {
  constructor(
    @Inject(ICreatePatientRepository)
    private readonly createPatientRepository: ICreatePatientRepository,
  ) {}

  async create(
    createPatientDto: CreatePatientDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<CreatedPatientResponseEntity> {
    try {
      this.ensurePsychologist(authenticatedUser);

      const fullName = createPatientDto.fullName.trim();
      const email = this.normalizeEmail(createPatientDto.email);
      const phone = createPatientDto.phone?.trim() || null;

      const existingUser = await this.createPatientRepository.findUserByEmail(email);
      if (existingUser) {
        throw new BadRequestException('Ja existe um usuario cadastrado com este email.');
      }

      const provisionalPassword = this.generateTemporaryPassword();
      const passwordHash = await bcrypt.hash(provisionalPassword, 10);

      return await this.createPatientRepository.create({
        psychologistId: authenticatedUser.sub,
        fullName,
        email,
        phone,
        passwordHash,
        provisionalPassword,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async findPatientsByPsychologistEmail(psychologistEmail: string): Promise<UserEntity[]> {
    try {
      const normalizedEmail = this.normalizeEmail(psychologistEmail);

      this.ensurePsychologist({ email: normalizedEmail, role: Role.PSYCHOLOGIST, sub: '' });

      return await this.createPatientRepository.findPatientsByPsychologistEmail(normalizedEmail);
    } catch (error) {
      this.handleError(error);
    }
  }

  private ensurePsychologist(authenticatedUser: AuthenticatedRequestUser): void {
    if (authenticatedUser.role !== Role.PSYCHOLOGIST) {
      throw new ForbiddenException('Apenas psicologas podem acessar esta funcionalidade.');
    }
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateTemporaryPassword(): string {
    return randomBytes(6).toString('hex');
  }

  private handleError(error: unknown): never {
    if (error instanceof BadRequestException || error instanceof ForbiddenException) {
      throw error;
    }

    throw new InternalServerErrorException('Erro interno ao processar pacientes.');
  }
}
