import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinTeamDto } from './dto/join-team.dto';

const MAX_TEAM_SIZE = 4;

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  async createTeam(userId: string, dto: CreateTeamDto) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  if (user?.teamId) {
    throw new ConflictException('You are already on a team');
  }

  const existingName = await this.prisma.team.findUnique({
    where: { name: dto.name },
  });

  if (existingName) {
    throw new ConflictException('Team name already taken');
  }

  const team = await this.prisma.team.create({
    data: { name: dto.name, captainId: userId },
  });

  await this.prisma.user.update({
    where: { id: userId },
    data: { teamId: team.id },
  });

  return team;
}

  async joinTeam(userId: string, dto: JoinTeamDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.teamId) {
      throw new ConflictException('You are already on a team');
    }

    const team = await this.prisma.team.findUnique({
      where: { inviteCode: dto.inviteCode },
      include: { members: true },
    });

    if (!team) {
      throw new NotFoundException('Invalid invite code');
    }

    if (team.members.length >= MAX_TEAM_SIZE) {
      throw new BadRequestException('This team is full');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: team.id },
    });

    return team;
  }

  async getMyTeam(userId: string) {
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      team: {
        include: {
          members: {
            select: { id: true, username: true, email: true },
          },
        },
      },
    },
  });

  if (!user?.team) return null;

  return {
    ...user.team,
    isCaptain: user.team.captainId === userId,
  };
}

  async leaveTeam(userId: string) {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });

  if (!user?.teamId) {
    throw new BadRequestException('You are not on a team');
  }

  const teamId = user.teamId;

  await this.prisma.user.update({
    where: { id: userId },
    data: { teamId: null },
  });

  const team = await this.prisma.team.findUnique({
    where: { id: teamId },
    include: { members: true },
  });

  if (!team) {
    return { success: true };
  }

  const wasCaptain = team.captainId === userId;

  if (team.members.length === 0) {
    // Last member left — clean up the now-empty team
    await this.prisma.team.delete({ where: { id: teamId } });
  } else if (wasCaptain) {
    // Promote the next remaining member to captain
    const newCaptain = team.members[0];
    await this.prisma.team.update({
      where: { id: teamId },
      data: { captainId: newCaptain.id },
    });
  }

  return { success: true };
}
}