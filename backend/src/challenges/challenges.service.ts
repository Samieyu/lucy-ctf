import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { ChallengeCategory } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';

const SALT_ROUNDS = 12;

// Fields safe to expose publicly — flagHash is deliberately never included
const PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  points: true,
  filePath: true,
  isActive: true,
  createdAt: true,
};

@Injectable()
export class ChallengesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateChallengeDto) {
    const flagHash = await bcrypt.hash(dto.flag, SALT_ROUNDS);

    return this.prisma.challenge.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        points: dto.points,
        flagHash,
        filePath: dto.filePath,
      },
      select: PUBLIC_SELECT,
    });
  }

  async findAllPublic(
    user?: { id: string; teamId?: string | null },
    category?: ChallengeCategory,
  ) {
    const where: { isActive: boolean; category?: ChallengeCategory } = {
      isActive: true,
    };
    if (category) {
      where.category = category;
    }

    const challenges = await this.prisma.challenge.findMany({
      where,
      select: {
        ...PUBLIC_SELECT,
        submissions: {
          where: { isCorrect: true },
          select: {
            userId: true,
            user: {
              select: { teamId: true },
            },
          },
        },
      },
      orderBy: { points: 'asc' },
    });

    return challenges.map((challenge) => {
      const { submissions, ...data } = challenge;

      const solved = Boolean(
        user?.teamId
          ? submissions.some((s) => s.user.teamId === user.teamId)
          : user?.id && submissions.some((s) => s.userId === user.id),
      );

      const distinctSolvers = new Set(
        submissions.map((s) => s.user.teamId || s.userId),
      );

      return {
        ...data,
        solved,
        solveCount: distinctSolvers.size,
      };
    });
  }

  async findAllAdmin() {
    // Admin view includes inactive challenges too, still never the flag
    return this.prisma.challenge.findMany({
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOnePublic(
    id: string,
    user?: { id: string; teamId?: string | null },
  ) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      select: {
        ...PUBLIC_SELECT,
        submissions: {
          where: { isCorrect: true },
          select: {
            userId: true,
            user: {
              select: { teamId: true },
            },
          },
        },
      },
    });

    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found');
    }

    const { submissions, ...data } = challenge;

    const solved = Boolean(
      user?.teamId
        ? submissions.some((s) => s.user.teamId === user.teamId)
        : user?.id && submissions.some((s) => s.userId === user.id),
    );

    const distinctSolvers = new Set(
      submissions.map((s) => s.user.teamId || s.userId),
    );

    return {
      ...data,
      solved,
      solveCount: distinctSolvers.size,
    };
  }

  async update(id: string, dto: UpdateChallengeDto) {
    const data: Record<string, unknown> = { ...dto };

    if (dto.flag) {
      data.flagHash = await bcrypt.hash(dto.flag, SALT_ROUNDS);
    }
    delete data.flag;

    const challenge = await this.prisma.challenge
      .update({
        where: { id },
        data,
        select: PUBLIC_SELECT,
      })
      .catch(() => null);

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  async remove(id: string) {
    await this.prisma.challenge.delete({ where: { id } }).catch(() => {
      throw new NotFoundException('Challenge not found');
    });

    return { success: true };
  }
}
