import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SubmitWriteupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  content: string;
}
