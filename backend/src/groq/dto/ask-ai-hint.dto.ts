import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AskAiHintDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  question: string;
}
