import { Branch } from '../../../domain/entities/branch.entity';
import { User } from '../../../domain/entities/user.entity';
import { UserRole } from '../../../domain/enums/user-role.enum';
import { BranchRepositoryPort } from '../../../domain/ports/branch-repository.port';

export class ListBranchesUseCase {
  constructor(private readonly branchRepo: BranchRepositoryPort) {}

  async execute(actor?: User): Promise<Branch[]> {
    const all = await this.branchRepo.findAll();
    if (
      actor &&
      (actor.role === UserRole.BRANCH_ADMIN || actor.role === UserRole.DRIVER) &&
      actor.branchId
    ) {
      return all.filter((b) => b.id === actor.branchId);
    }
    return all;
  }
}
