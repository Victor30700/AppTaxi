import { Body, Controller, Get, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetCurrentUserUseCase } from '../../application/use-cases/auth/get-current-user.use-case';
import { LoginUseCase } from '../../application/use-cases/auth/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/refresh-token.use-case';
import { RegisterPassengerUseCase } from '../../application/use-cases/auth/register-passenger.use-case';
import { User } from '../../domain/entities/user.entity';
import { CurrentUser, Public } from '../decorators/auth.decorators';
import {
  LoginDto,
  RefreshTokenDto,
  RegisterPassengerDto,
} from '../dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(LoginUseCase) private readonly loginUseCase: LoginUseCase,
    @Inject(RegisterPassengerUseCase)
    private readonly registerPassengerUseCase: RegisterPassengerUseCase,
    @Inject(RefreshTokenUseCase)
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    @Inject(GetCurrentUserUseCase)
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Inicia sesión con correo electrónico o número de celular + contraseña',
  })
  login(@Body() dto: LoginDto) {
    return this.loginUseCase.execute(dto);
  }

  @Public()
  @Post('register-passenger')
  @ApiOperation({
    summary:
      'Registro público de pasajero (celular/correo + contraseña sin SMS OTP)',
  })
  registerPassenger(@Body() dto: RegisterPassengerDto) {
    return this.registerPassengerUseCase.execute(dto);
  }

  @Public()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renueva el access token usando un refresh token' })
  refreshToken(@Body() dto: RefreshTokenDto) {
    return this.refreshTokenUseCase.execute(dto.refreshToken);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({
    summary: 'Retorna el perfil completo del usuario autenticado',
  })
  me(@CurrentUser() user: User) {
    return this.getCurrentUserUseCase.execute(user.id);
  }
}
