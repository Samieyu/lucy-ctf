import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitWriteupDto } from './dto/submit-writeup.dto';

@Injectable()
export class WriteupsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitWriteup(
    challengeId: string,
    user: { id: string; teamId: string | null },
    dto: SubmitWriteupDto,
  ) {
    if (!user.teamId) {
      throw new BadRequestException('You must be in a team to submit a writeup');
    }

    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    // Must have solved challenge
    const teamSolve = await this.prisma.submission.findFirst({
      where: {
        challengeId,
        isCorrect: true,
        user: { teamId: user.teamId },
      },
    });

    if (!teamSolve) {
      throw new ForbiddenException(
        'Your team must solve the challenge before submitting a writeup.',
      );
    }

    return this.prisma.writeup.upsert({
      where: {
        teamId_challengeId: {
          teamId: user.teamId,
          challengeId,
        },
      },
      update: {
        content: dto.content,
        userId: user.id,
      },
      create: {
        teamId: user.teamId,
        challengeId,
        userId: user.id,
        content: dto.content,
      },
    });
  }

  async getWriteup(
    challengeId: string,
    user: { id: string; teamId: string | null; isAdmin: boolean },
    requestedTeamId?: string,
  ) {
    if (user.isAdmin && requestedTeamId) {
      return this.prisma.writeup.findUnique({
        where: {
          teamId_challengeId: {
            teamId: requestedTeamId,
            challengeId,
          },
        },
        include: {
          team: { select: { name: true } },
          user: { select: { username: true } },
        },
      });
    }

    if (!user.teamId) {
      return null;
    }

    // Competitors can only view their own team's writeup
    return this.prisma.writeup.findUnique({
      where: {
        teamId_challengeId: {
          teamId: user.teamId,
          challengeId,
        },
      },
      include: {
        team: { select: { name: true } },
        user: { select: { username: true } },
      },
    });
  }

  async listAdminWriteups(challengeId: string) {
    return this.prisma.writeup.findMany({
      where: { challengeId },
      include: {
        team: { select: { id: true, name: true } },
        user: { select: { id: true, username: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }
}
