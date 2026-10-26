import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateHintDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
