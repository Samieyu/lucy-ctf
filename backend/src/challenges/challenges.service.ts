import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { ChallengeCategory, ScoringMode } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';
import { calculateDynamicPoints } from './scoring.util';

const SALT_ROUNDS = 12;

const PUBLIC_SELECT = {
  id: true,
  title: true,
  description: true,
  category: true,
  points: true,
  scoringMode: true,
  initialPoints: true,
  minPoints: true,
  decay: true,
  firstBloodBonus: true,
  filePath: true,
  isActive: true,
  isDynamicInstance: true,
  createdAt: true,
  firstBlood: {
    select: {
      team: { select: { name: true } },
      createdAt: true,
    },
  },
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
        points: dto.points ?? 100,
        scoringMode: dto.scoringMode ?? ScoringMode.STATIC,
        initialPoints: dto.initialPoints ?? 500,
        minPoints: dto.minPoints ?? 100,
        decay: dto.decay ?? 30,
        firstBloodBonus: dto.firstBloodBonus ?? 10,
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
      const { submissions, firstBlood, ...data } = challenge;

      const solved = Boolean(
        user?.teamId
          ? submissions.some((s) => s.user.teamId === user.teamId)
          : user?.id && submissions.some((s) => s.userId === user.id),
      );

      const distinctSolvers = new Set(
        submissions.map((s) => s.user.teamId || s.userId),
      );
      const solveCount = distinctSolvers.size;

      const currentPoints =
        data.scoringMode === ScoringMode.DYNAMIC
          ? calculateDynamicPoints(
              data.initialPoints,
              data.minPoints,
              data.decay,
              solveCount,
            )
          : data.points;

      return {
        ...data,
        points: currentPoints,
        solved,
        solveCount,
        firstBlood: firstBlood
          ? { teamName: firstBlood.team.name, at: firstBlood.createdAt }
          : null,
      };
    });
  }

  async findAllAdmin() {
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

    const { submissions, firstBlood, ...data } = challenge;

    const solved = Boolean(
      user?.teamId
        ? submissions.some((s) => s.user.teamId === user.teamId)
        : user?.id && submissions.some((s) => s.userId === user.id),
    );

    const distinctSolvers = new Set(
      submissions.map((s) => s.user.teamId || s.userId),
    );
    const solveCount = distinctSolvers.size;

    const currentPoints =
      data.scoringMode === ScoringMode.DYNAMIC
        ? calculateDynamicPoints(
            data.initialPoints,
            data.minPoints,
            data.decay,
            solveCount,
          )
        : data.points;

    return {
      ...data,
      points: currentPoints,
      solved,
      solveCount,
      firstBlood: firstBlood
        ? { teamName: firstBlood.team.name, at: firstBlood.createdAt }
        : null,
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
