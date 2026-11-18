import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import {
  AffiliateType,
  BOLIVIA_DEPARTMENT_CODES,
  ExpedidoCode,
  VerificationStatus,
} from '../../domain/enums/user-role.enum';

export class RegisterDriverDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Obligatorio para ADMIN general; para BRANCH_ADMIN se toma automáticamente su sucursal.',
  })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ example: 'Juan Pablo' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Mamani Condori' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiPropertyOptional({ example: 'juan.conductor@taxiapp.bo' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '72011223' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ minLength: 6, example: 'Conductor2026*' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: '1992-05-14' })
  @IsDateString()
  birthDate!: string;

  @ApiProperty({ example: '8345120' })
  @IsString()
  @IsNotEmpty()
  ciNumber!: string;

  @ApiPropertyOptional({ example: '1A' })
  @IsOptional()
  @IsString()
  ciComplement?: string;

  @ApiProperty({ enum: BOLIVIA_DEPARTMENT_CODES, example: 'LP' })
  @IsIn(BOLIVIA_DEPARTMENT_CODES)
  ciIssuedDept!: ExpedidoCode;

  @ApiProperty({ example: 'Av. 6 de Agosto #1420, Sopocachi' })
  @IsString()
  @IsNotEmpty()
  address!: string;

  @ApiPropertyOptional({
    enum: AffiliateType,
    default: AffiliateType.SOCIO_TITULAR,
  })
  @IsOptional()
  @IsEnum(AffiliateType)
  affiliateType?: AffiliateType;
}

export class UpdateDriverDto {
  @ApiPropertyOptional({ example: 'Juan Pablo' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Mamani Condori' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiPropertyOptional({ example: '72011224' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;

  @ApiPropertyOptional({ example: '1992-05-14' })
  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @ApiPropertyOptional({ example: '8345120' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  ciNumber?: string;

  @ApiPropertyOptional({ example: '1A', nullable: true })
  @IsOptional()
  @IsString()
  ciComplement?: string | null;

  @ApiPropertyOptional({ enum: BOLIVIA_DEPARTMENT_CODES })
  @IsOptional()
  @IsIn(BOLIVIA_DEPARTMENT_CODES)
  ciIssuedDept?: ExpedidoCode;

  @ApiPropertyOptional({ example: 'Zona Miraflores, Calle 3 #45' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  address?: string;

  @ApiPropertyOptional({ enum: AffiliateType })
  @IsOptional()
  @IsEnum(AffiliateType)
  affiliateType?: AffiliateType;
}

export class VerifyDriverDto {
  @ApiProperty({ enum: VerificationStatus, example: VerificationStatus.APPROVED })
  @IsEnum(VerificationStatus)
  status!: VerificationStatus;

  @ApiPropertyOptional({ example: 'CI anverso y reverso legibles y vigentes.' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ListDriversQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ enum: VerificationStatus })
  @IsOptional()
  @IsEnum(VerificationStatus)
  verificationStatus?: VerificationStatus;
}
