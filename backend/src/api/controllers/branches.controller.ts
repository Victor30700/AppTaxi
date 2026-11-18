import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateBranchUseCase } from '../../application/use-cases/branches/create-branch.use-case';
import { ListBranchesUseCase } from '../../application/use-cases/branches/list-branches.use-case';
import { User } from '../../domain/entities/user.entity';
import { UserRole } from '../../domain/enums/user-role.enum';
import { CurrentUser, Roles } from '../decorators/auth.decorators';
import { CreateBranchDto } from '../dto/branch.dto';

@ApiTags('Branches')
@ApiBearerAuth()
@Controller('branches')
export class BranchesController {
  constructor(
    @Inject(CreateBranchUseCase)
    private readonly createBranchUseCase: CreateBranchUseCase,
    @Inject(ListBranchesUseCase)
    private readonly listBranchesUseCase: ListBranchesUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Lista sucursales (ADMIN/PASSENGER ven todas; BRANCH_ADMIN/DRIVER ven su sucursal)',
  })
  list(@CurrentUser() user: User) {
    return this.listBranchesUseCase.execute(user);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Crea una nueva sucursal departamental (solo ADMIN)' })
  create(@Body() dto: CreateBranchDto) {
    return this.createBranchUseCase.execute(dto);
  }
}
