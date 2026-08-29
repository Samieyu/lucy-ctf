import {
  IsString,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
  MinLength,
} from 'class-validator';
import { ChallengeCategory } from '@prisma/client';

export class CreateChallengeDto {
  @IsString()
  @MinLength(3)
  title: string;

  @IsString()
  @MinLength(10)
  description: string;

  @IsEnum(ChallengeCategory)
  category: ChallengeCategory;

  @IsInt()
  @Min(1)
  points: number;

  @IsString()
  @MinLength(1)
  flag: string; // plain text in the request; hashed before storage, never stored/returned as-is

  @IsOptional()
  @IsString()
  filePath?: string;
}