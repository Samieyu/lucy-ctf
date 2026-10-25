import { IsNotEmpty, IsString } from 'class-validator';

export class SubmitFlagDto {
  @IsString()
  @IsNotEmpty()
  flag: string;
}
