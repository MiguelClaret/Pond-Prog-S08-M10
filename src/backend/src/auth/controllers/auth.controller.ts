import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Inject,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ChangeFirstAccessPasswordDto } from '../domain/dto/change-first-access-password.dto';
import { LoginAuthDto } from '../domain/dto/login-auth.dto';
import { RegisterAuthDto } from '../domain/dto/register-auth.dto';
import { AuthenticatedRequestUser } from '../domain/entities/authenticated-request-user.entity';
import { AuthResponseEntity } from '../domain/entities/auth-response.entity';
import { UserEntity } from '../domain/entities/user.entity';
import { IAuthService } from '../domain/interfaces/auth.service.interface';
import { AuthGuard } from '../guards/auth.guard';

type AuthenticatedRequest = Request & {
  user: AuthenticatedRequestUser;
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(IAuthService)
    private readonly authService: IAuthService,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiOperation({ summary: 'Cadastra uma psicologa e retorna token JWT' })
  @ApiBody({ type: RegisterAuthDto })
  @ApiCreatedResponse({ description: 'Usuario cadastrado com sucesso', type: AuthResponseEntity })
  @ApiBadRequestResponse({ description: 'Ja existe um usuario cadastrado com este email' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao cadastrar usuario' })
  async register(@Body() registerAuthDto: RegisterAuthDto) {
    return await this.authService.register(registerAuthDto);
  }

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Autentica usuario e retorna token JWT' })
  @ApiBody({ type: LoginAuthDto })
  @ApiOkResponse({ description: 'Usuario autenticado com sucesso', type: AuthResponseEntity })
  @ApiUnauthorizedResponse({ description: 'Email ou senha invalidos' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao autenticar usuario' })
  async login(@Body() loginAuthDto: LoginAuthDto) {
    return await this.authService.login(loginAuthDto);
  }

  @Get('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorna o usuario autenticado' })
  @ApiOkResponse({ description: 'Usuario autenticado encontrado', type: UserEntity })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Usuario autenticado nao encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao buscar usuario autenticado' })
  async me(@Req() request: AuthenticatedRequest) {
    return await this.authService.me(request.user.sub);
  }

  @Patch('first-access/password')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Define a nova senha do usuario no primeiro acesso' })
  @ApiBody({ type: ChangeFirstAccessPasswordDto })
  @ApiOkResponse({
    description: 'Senha de primeiro acesso atualizada com sucesso',
    type: AuthResponseEntity,
  })
  @ApiBadRequestResponse({ description: 'Nova senha invalida ou usuario nao esta em primeiro acesso' })
  @ApiUnauthorizedResponse({ description: 'Token de acesso nao informado ou invalido' })
  @ApiNotFoundResponse({ description: 'Usuario autenticado nao encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Erro interno ao atualizar senha de primeiro acesso' })
  async changeFirstAccessPassword(
    @Body() changeFirstAccessPasswordDto: ChangeFirstAccessPasswordDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return await this.authService.changeFirstAccessPassword(
      request.user.sub,
      changeFirstAccessPasswordDto,
    );
  }
}
