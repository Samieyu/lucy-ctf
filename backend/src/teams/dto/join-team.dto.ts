import { IsUUID } from 'class-validator';

export class JoinTeamDto {
  @IsUUID()
  inviteCode: string;
}