import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ChallengeCategory, ScoringMode } from '@prisma/client';

export class CreateChallengeDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(ChallengeCategory)
  category: ChallengeCategory;

  @IsOptional()
  @IsEnum(ScoringMode)
  scoringMode?: ScoringMode = ScoringMode.STATIC;

  @IsOptional()
  @IsInt()
  @Min(1)
  points?: number = 100;

  @IsOptional()
  @IsInt()
  @Min(1)
  initialPoints?: number = 500;

  @IsOptional()
  @IsInt()
  @Min(1)
  minPoints?: number = 100;

  @IsOptional()
  @IsInt()
  @Min(1)
  decay?: number = 30;

  @IsOptional()
  @IsInt()
  @Min(0)
  firstBloodBonus?: number = 10;

  @IsString()
  @IsNotEmpty()
  flag: string;

  @IsOptional()
  @IsString()
  filePath?: string;
}
