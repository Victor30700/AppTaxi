import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetDriverDetailUseCase } from '../../application/use-cases/drivers/get-driver-detail.use-case';
import { ListDriversUseCase } from '../../application/use-cases/drivers/list-drivers.use-case';
import { RegisterDriverUseCase } from '../../application/use-cases/drivers/register-driver.use-case';
import { UpdateDriverUseCase } from '../../application/use-cases/drivers/update-driver.use-case';
import { VerifyDriverUseCase } from '../../application/use-cases/drivers/verify-driver.use-case';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { CurrentUser, Roles } from '../decorators/auth.decorators';
import {
  ListDriversQueryDto,
  RegisterDriverDto,
  UpdateDriverDto,
  VerifyDriverDto,
} from '../dto/driver.dto';

@ApiTags('Drivers')
@ApiBearerAuth()
@Controller('drivers')
export class DriversController {
  constructor(
    @Inject(RegisterDriverUseCase)
    private readonly registerDriverUseCase: RegisterDriverUseCase,
    @Inject(ListDriversUseCase)
    private readonly listDriversUseCase: ListDriversUseCase,
    @Inject(GetDriverDetailUseCase)
    private readonly getDriverDetailUseCase: GetDriverDetailUseCase,
    @Inject(UpdateDriverUseCase)
    private readonly updateDriverUseCase: UpdateDriverUseCase,
    @Inject(VerifyDriverUseCase)
    private readonly verifyDriverUseCase: VerifyDriverUseCase,
  ) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.BRANCH_ADMIN)
  @ApiOperation({
    summary:
      'Registra cuenta y perfil completo de conductor (CI boliviano, complemento, expedido, dirección)',
  })
  register(@CurrentUser() actor: User, @Body() dto: RegisterDriverDto) {
    return this.registerDriverUseCase.execute(actor, dto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.BRANCH_ADMIN)
  @ApiOperation({
    summary:
      'Lista conductores (BRANCH_ADMIN queda filtrado automáticamente a su sucursal)',
  })
  list(@CurrentUser() actor: User, @Query() query: ListDriversQueryDto) {
    return this.listDriversUseCase.execute(actor, query);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_ADMIN, UserRole.DRIVER)
  @ApiOperation({
    summary:
      'Obtiene ficha de conductor incluyendo Signed URLs temporales para CI anverso y reverso',
  })
  detail(@CurrentUser() actor: User, @Param('id', ParseUUIDPipe) id: string) {
    return this.getDriverDetailUseCase.execute(actor, id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_ADMIN)
  @ApiOperation({ summary: 'Actualiza datos personales y CI del conductor' })
  update(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.updateDriverUseCase.execute(actor, id, dto);
  }

  @Patch(':id/verify')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_ADMIN)
  @ApiOperation({
    summary: 'Aprueba o rechaza la verificación documental del conductor',
  })
  verify(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyDriverDto,
  ) {
    return this.verifyDriverUseCase.execute(actor, id, dto.status, dto.notes);
  }
}
