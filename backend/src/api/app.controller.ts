import { Controller, Get, Inject } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BOLIVIA_DEPARTMENTS } from '@taxiapp/shared';
import { DatabaseService } from '../infrastructure/database/database.service';
import { Public } from './decorators/auth.decorators';

@ApiTags('Health & Catalogs')
@Controller()
export class AppController {
  constructor(@Inject(DatabaseService) private readonly db: DatabaseService) {}

  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Verifica estado del servidor y conexión a BD' })
  async getHealth() {
    const dbStatus = await this.db.checkConnection();
    return {
      status: dbStatus.connected ? 'ok' : 'degraded',
      service: 'taxiapp-backend',
      database: dbStatus,
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('catalogs/bolivia-departments')
  @ApiOperation({
    summary: 'Retorna los 9 departamentos de Bolivia para Expedido de DNI/CI',
  })
  getBoliviaDepartments() {
    return BOLIVIA_DEPARTMENTS;
  }
}
