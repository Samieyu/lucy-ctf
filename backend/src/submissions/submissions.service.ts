import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SubmitFlagDto } from './dto/submit-flag.dto';

@Injectable()
export class SubmissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async submitFlag(challengeId: string, userId: string, dto: SubmitFlagDto) {
    // 1. Verify user exists and belongs to a team
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, teamId: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.teamId) {
      throw new BadRequestException(
        'You must be a member of a team to submit flags and earn points',
      );
    }

    // 2. Fetch challenge
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found');
    }

    // 3. Block re-solving by the same user
    const existingSolve = await this.prisma.submission.findFirst({
      where: {
        userId: user.id,
        challengeId: challenge.id,
        isCorrect: true,
      },
    });

    if (existingSolve) {
      throw new BadRequestException('You have already solved this challenge');
    }

    // 4. Compare flag against bcrypt flagHash
    const isCorrect =
      (await bcrypt.compare(dto.flag, challenge.flagHash)) ||
      (await bcrypt.compare(dto.flag.trim(), challenge.flagHash));

    // 5. If incorrect: record attempt in Submission and return
    if (!isCorrect) {
      await this.prisma.submission.create({
        data: {
          userId: user.id,
          challengeId: challenge.id,
          isCorrect: false,
        },
      });

      return {
        isCorrect: false,
        message: 'Incorrect flag. Try again!',
      };
    }

    // 6. If correct: record solve and update team score atomically
    await this.prisma.$transaction(async (tx) => {
      const raceCheck = await tx.submission.findFirst({
        where: {
          userId: user.id,
          challengeId: challenge.id,
          isCorrect: true,
        },
      });

      if (raceCheck) {
        throw new BadRequestException('You have already solved this challenge');
      }

      await tx.submission.create({
        data: {
          userId: user.id,
          challengeId: challenge.id,
          isCorrect: true,
        },
      });

      const now = new Date();
      await tx.score.upsert({
        where: { teamId: user.teamId! },
        update: {
          points: {
            increment: challenge.points,
          },
          lastScoredAt: now,
        },
        create: {
          teamId: user.teamId!,
          points: challenge.points,
          lastScoredAt: now,
        },
      });
    });

    return {
      isCorrect: true,
      message: 'Correct flag! Points awarded to your team.',
      points: challenge.points,
    };
  }
}
