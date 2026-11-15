import { Controller, Get } from '@nestjs/common';
import { BOLIVIA_DEPARTMENTS } from '@taxiapp/shared';
import { CurrentTenant } from './common/tenant.decorator';

@Controller()
export class AppController {
  @Get('health')
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
  getBoliviaDepartments() {
    return BOLIVIA_DEPARTMENTS;
  }
}
