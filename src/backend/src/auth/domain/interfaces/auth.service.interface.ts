import { AuthResponseEntity } from '../entities/auth-response.entity';
import { UserEntity } from '../entities/user.entity';
import { ChangeFirstAccessPasswordDto } from '../dto/change-first-access-password.dto';
import { LoginAuthDto } from '../dto/login-auth.dto';
import { RegisterAuthDto } from '../dto/register-auth.dto';

export abstract class IAuthService {
  abstract register(registerAuthDto: RegisterAuthDto): Promise<AuthResponseEntity>;
  abstract login(loginAuthDto: LoginAuthDto): Promise<AuthResponseEntity>;
  abstract me(userId: string): Promise<UserEntity>;
  abstract changeFirstAccessPassword(
    userId: string,
    changeFirstAccessPasswordDto: ChangeFirstAccessPasswordDto,
  ): Promise<AuthResponseEntity>;
}
