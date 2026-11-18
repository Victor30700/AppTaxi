import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PaymentMethod } from '../../domain/enums/user-role.enum';

export class LoginDto {
  @ApiProperty({
    description: 'Correo electrónico o número de celular (+591 o 8 dígitos)',
    example: 'admin@taxiapp.bo',
  })
  @IsString()
  @IsNotEmpty()
  identifier!: string;

  @ApiProperty({ example: 'AdminTaxi2026*' })
  @IsString()
  @MinLength(6)
  password!: string;
}

export class RegisterPassengerDto {
  @ApiProperty({ example: 'Ana' })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: 'Pérez Mamani' })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({
    description: 'Celular boliviano (8 dígitos) o E.164',
    example: '70012345',
  })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiPropertyOptional({ example: 'ana.perez@correo.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ minLength: 6, example: 'MiPassword123*' })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.CASH })
  @IsOptional()
  @IsEnum(PaymentMethod)
  defaultPaymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ example: 'Luis Pérez' })
  @IsOptional()
  @IsString()
  emergencyContactName?: string;

  @ApiPropertyOptional({ example: '71500002' })
  @IsOptional()
  @IsString()
  emergencyContactPhone?: string;
}

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token emitido por Supabase Auth' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
