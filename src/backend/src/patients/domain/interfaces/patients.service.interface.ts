import { AuthenticatedRequestUser } from '../../../auth/domain/entities/authenticated-request-user.entity';
import { CreatePatientDto } from '../dto/create-patient.dto';
import { CreatedPatientResponseEntity } from '../entities/created-patient-response.entity';

export abstract class IPatientsService {
  abstract create(
    createPatientDto: CreatePatientDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<CreatedPatientResponseEntity>;
}
