import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateHintDto {
  @IsString()
  @IsNotEmpty()
  challengeId: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  cost?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number = 1;
}
