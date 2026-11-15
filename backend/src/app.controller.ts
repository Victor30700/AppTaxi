import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { BOLIVIA_DEPARTMENTS } from '@taxiapp/shared';
import { CurrentTenant } from './common/tenant.decorator';

@ApiTags('Health & Catalogs')
@Controller()
export class AppController {
  @Get('health')
  @ApiOperation({ summary: 'Verifica estado del servidor y tenant activo' })
  getHealth(@CurrentTenant() tenantId?: string) {
    return {
      status: 'ok',
      service: 'taxiapp-backend',
      multiTenant: true,
      currentTenant: tenantId ?? null,
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
