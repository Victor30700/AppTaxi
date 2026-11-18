import { Branch } from '../entities/branch.entity';
import { ExpedidoCode, TariffStrategy } from '../enums/user-role.enum';

export interface CreateBranchInput {
  departmentCode: ExpedidoCode;
  name: string;
  tariffStrategy: TariffStrategy;
}

export abstract class BranchRepositoryPort {
  abstract findAll(): Promise<Branch[]>;
  abstract findById(id: string): Promise<Branch | null>;
  abstract findByDepartmentCode(code: ExpedidoCode): Promise<Branch | null>;
  abstract create(input: CreateBranchInput): Promise<Branch>;
}
