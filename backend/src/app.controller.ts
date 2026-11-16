import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BOLIVIA_DEPARTMENTS } from '@taxiapp/shared';
import { CurrentTenant } from './common/tenant.decorator';
import { DatabaseService } from './database/database.service';

@ApiTags('Health & Catalogs')
@Controller()
export class AppController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get('health')
  @ApiOperation({
    summary: 'Verifica estado del servidor, conexión Supabase PostgreSQL + PostGIS y tenant activo',
  })
  async getHealth(@CurrentTenant() tenantId?: string) {
    const database = await this.databaseService.checkConnection();

    return {
      status: database.connected ? 'ok' : 'degraded',
      service: 'taxiapp-backend',
      multiTenant: true,
      currentTenant: tenantId ?? null,
      database,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('catalogs/bolivia-departments')
  @ApiOperation({
    summary: 'Retorna los 9 departamentos de Bolivia para Expedido de DNI/CI',
  })
  getBoliviaDepartments() {
    return BOLIVIA_DEPARTMENTS;
  }
}
