import { Inject, Injectable } from '@nestjs/common';
import { Branch } from '../../../domain/entities/branch.entity';
import {
  ExpedidoCode,
  TariffStrategy,
} from '../../../domain/enums/user-role.enum';
import {
  BranchRepositoryPort,
  CreateBranchInput,
} from '../../../domain/ports/branch-repository.port';
import { DatabaseService } from '../database.service';

interface BranchRow {
  id: string;
  department_code: ExpedidoCode;
  name: string;
  tariff_strategy: TariffStrategy;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

@Injectable()
export class PgBranchRepository extends BranchRepositoryPort {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {
    super();
  }

  private mapRow(row: BranchRow): Branch {
    return new Branch({
      id: row.id,
      departmentCode: row.department_code,
      name: row.name,
      tariffStrategy: row.tariff_strategy,
      isActive: row.is_active,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    });
  }

  async findAll(): Promise<Branch[]> {
    const res = await this.db.query<BranchRow>(
      `SELECT * FROM ${this.db.table('branches')} ORDER BY department_code ASC`,
    );
    return res.rows.map((row) => this.mapRow(row));
  }

  async findById(id: string): Promise<Branch | null> {
    const res = await this.db.query<BranchRow>(
      `SELECT * FROM ${this.db.table('branches')} WHERE id = $1 LIMIT 1`,
      [id],
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async findByDepartmentCode(code: ExpedidoCode): Promise<Branch | null> {
    const res = await this.db.query<BranchRow>(
      `SELECT * FROM ${this.db.table('branches')} WHERE department_code = $1 LIMIT 1`,
      [code],
    );
    return res.rows[0] ? this.mapRow(res.rows[0]) : null;
  }

  async create(input: CreateBranchInput): Promise<Branch> {
    const res = await this.db.query<BranchRow>(
      `
      INSERT INTO ${this.db.table('branches')} (department_code, name, tariff_strategy)
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [input.departmentCode, input.name, input.tariffStrategy],
    );
    return this.mapRow(res.rows[0]);
  }
}
