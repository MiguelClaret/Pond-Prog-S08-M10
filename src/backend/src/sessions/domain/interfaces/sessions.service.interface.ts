import { AuthenticatedRequestUser } from '../../../auth/domain/entities/authenticated-request-user.entity';
import { CreateSessionDto } from '../dto/create-session.dto';
import { FinishSessionDto } from '../dto/finish-session.dto';
import { UpdateSessionDto } from '../dto/update-session.dto';
import { SessionEntity } from '../entities/session.entity';
import { SessionListResponseEntity } from '../entities/session-list-response.entity';

export abstract class ISessionsService {
  abstract create(
    createSessionDto: CreateSessionDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<SessionEntity>;
  abstract findMine(authenticatedUser: AuthenticatedRequestUser): Promise<SessionListResponseEntity>;
  abstract findOne(id: string, authenticatedUser: AuthenticatedRequestUser): Promise<SessionEntity>;
  abstract update(
    id: string,
    updateSessionDto: UpdateSessionDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<SessionEntity>;
  abstract finish(
    id: string,
    finishSessionDto: FinishSessionDto,
    authenticatedUser: AuthenticatedRequestUser,
  ): Promise<SessionEntity>;
  abstract cancel(id: string, authenticatedUser: AuthenticatedRequestUser): Promise<SessionEntity>;
}
