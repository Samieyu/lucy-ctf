import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AdminPaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 20;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset: number = 0;

  @IsOptional()
  @IsString()
  search?: string;
}

export class RoleUpdateDto {
  @IsBoolean()
  isAdmin: boolean;
}

export class BanUpdateDto {
  @IsBoolean()
  isBanned: boolean;

  @IsOptional()
  @IsString()
  banReason?: string;
}

export class AuditQueryDto extends AdminPaginationDto {
  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsString()
  targetType?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  suspiciousOnly?: boolean;
}
