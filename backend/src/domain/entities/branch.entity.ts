import { ExpedidoCode, TariffStrategy } from '../enums/user-role.enum';

export interface BranchProps {
  id: string;
  departmentCode: ExpedidoCode;
  name: string;
  tariffStrategy: TariffStrategy;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Branch {
  readonly id: string;
  readonly departmentCode: ExpedidoCode;
  readonly name: string;
  readonly tariffStrategy: TariffStrategy;
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(props: BranchProps) {
    this.id = props.id;
    this.departmentCode = props.departmentCode;
    this.name = props.name;
    this.tariffStrategy = props.tariffStrategy;
    this.isActive = props.isActive;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }
}
