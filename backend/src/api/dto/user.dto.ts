import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';
import { UserStatus } from '../../domain/enums/user-role.enum';

export class CreateBranchAdminDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ example: 'Carlos' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Quispe Flores' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: 'admin.lp@taxiapp.bo' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: '71500001' })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ minLength: 6, example: 'AdminSucursal2026*' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class UpdateOwnProfileDto {
  @ApiPropertyOptional({ example: 'Carlos' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Quispe' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  lastName?: string;

  @ApiPropertyOptional({ example: '71500009' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone?: string;
}

export class ChangeUserStatusDto {
  @ApiProperty({ enum: UserStatus, example: UserStatus.SUSPENDED })
  @IsEnum(UserStatus)
  status!: UserStatus;
}
