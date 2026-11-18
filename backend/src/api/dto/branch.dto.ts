import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  BOLIVIA_DEPARTMENT_CODES,
  ExpedidoCode,
  TariffStrategy,
} from '../../domain/enums/user-role.enum';

export class CreateBranchDto {
  @ApiProperty({
    enum: BOLIVIA_DEPARTMENT_CODES,
    example: 'SC',
  })
  @IsIn(BOLIVIA_DEPARTMENT_CODES)
  departmentCode!: ExpedidoCode;

  @ApiProperty({ example: 'Sucursal Santa Cruz' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    enum: TariffStrategy,
    default: TariffStrategy.TAXIMETER,
  })
  @IsOptional()
  @IsEnum(TariffStrategy)
  tariffStrategy?: TariffStrategy;
}
