import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateTeamDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  name: string;
}