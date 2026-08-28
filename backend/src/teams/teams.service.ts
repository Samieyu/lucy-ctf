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
      data: { name: dto.name },
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

    return user?.team || null;
  }

  async leaveTeam(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user?.teamId) {
      throw new BadRequestException('You are not on a team');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { teamId: null },
    });

    return { success: true };
  }
}