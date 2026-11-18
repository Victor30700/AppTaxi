import { Body, Controller, Inject, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ChangeUserStatusUseCase } from '../../application/use-cases/users/change-user-status.use-case';
import { CreateBranchAdminUseCase } from '../../application/use-cases/users/create-branch-admin.use-case';
import { UpdateOwnProfileUseCase } from '../../application/use-cases/users/update-own-profile.use-case';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { CurrentUser, Roles } from '../decorators/auth.decorators';
import {
  ChangeUserStatusDto,
  CreateBranchAdminDto,
  UpdateOwnProfileDto,
} from '../dto/user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(
    @Inject(CreateBranchAdminUseCase)
    private readonly createBranchAdminUseCase: CreateBranchAdminUseCase,
    @Inject(UpdateOwnProfileUseCase)
    private readonly updateOwnProfileUseCase: UpdateOwnProfileUseCase,
    @Inject(ChangeUserStatusUseCase)
    private readonly changeUserStatusUseCase: ChangeUserStatusUseCase,
  ) {}

  @Post('branch-admins')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Crea una cuenta BRANCH_ADMIN asignada a una sucursal (solo ADMIN)',
  })
  createBranchAdmin(
    @CurrentUser() actor: User,
    @Body() dto: CreateBranchAdminDto,
  ) {
    return this.createBranchAdminUseCase.execute(actor, dto);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Actualiza nombres, apellidos o celular propios' })
  updateMe(@CurrentUser() actor: User, @Body() dto: UpdateOwnProfileDto) {
    return this.updateOwnProfileUseCase.execute(actor.id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.BRANCH_ADMIN)
  @ApiOperation({
    summary:
      'Activa, inactiva o suspende un usuario (BRANCH_ADMIN solo sobre conductores de su sucursal)',
  })
  changeStatus(
    @CurrentUser() actor: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ChangeUserStatusDto,
  ) {
    return this.changeUserStatusUseCase.execute(actor, id, dto.status);
  }
}
