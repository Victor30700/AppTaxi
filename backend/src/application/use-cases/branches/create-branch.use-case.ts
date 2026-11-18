import { Branch } from '../../../domain/entities/branch.entity';
import { ExpedidoCode, TariffStrategy } from '../../../domain/enums/user-role.enum';
import { ConflictDomainException } from '../../../domain/exceptions/domain.exception';
import { BranchRepositoryPort } from '../../../domain/ports/branch-repository.port';

export interface CreateBranchCommand {
  departmentCode: ExpedidoCode;
  name: string;
  tariffStrategy?: TariffStrategy;
}

export class CreateBranchUseCase {
  constructor(private readonly branchRepo: BranchRepositoryPort) {}

  async execute(command: CreateBranchCommand): Promise<Branch> {
    const existing = await this.branchRepo.findByDepartmentCode(
      command.departmentCode,
    );
    if (existing) {
      throw new ConflictDomainException(
        `Ya existe una sucursal para el departamento ${command.departmentCode}.`,
      );
    }

    return this.branchRepo.create({
      departmentCode: command.departmentCode,
      name: command.name.trim(),
      tariffStrategy: command.tariffStrategy ?? TariffStrategy.TAXIMETER,
    });
  }
}
