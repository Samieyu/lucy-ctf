import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHintDto } from './dto/create-hint.dto';
import { UpdateHintDto } from './dto/update-hint.dto';

@Injectable()
export class HintsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateHintDto) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: dto.challengeId },
    });
    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return this.prisma.hint.create({
      data: {
        challengeId: dto.challengeId,
        text: dto.text,
        cost: dto.cost ?? 0,
        order: dto.order ?? 1,
      },
    });
  }

  async update(id: string, dto: UpdateHintDto) {
    const hint = await this.prisma.hint.findUnique({ where: { id } });
    if (!hint) {
      throw new NotFoundException('Hint not found');
    }

    return this.prisma.hint.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    const hint = await this.prisma.hint.findUnique({ where: { id } });
    if (!hint) {
      throw new NotFoundException('Hint not found');
    }

    await this.prisma.hint.delete({ where: { id } });
    return { success: true };
  }

  async getHintsForChallenge(
    challengeId: string,
    teamId?: string | null,
    isAdmin = false,
  ) {
    const hints = await this.prisma.hint.findMany({
      where: { challengeId },
      orderBy: { order: 'asc' },
      include: {
        unlocks: teamId ? { where: { teamId } } : false,
      },
    });

    return hints.map((hint) => {
      const isUnlocked =
        isAdmin || (hint.unlocks && hint.unlocks.length > 0) || hint.cost === 0;

      return {
        id: hint.id,
        challengeId: hint.challengeId,
        cost: hint.cost,
        order: hint.order,
        isUnlocked: Boolean(isUnlocked),
        text: isUnlocked ? hint.text : null,
      };
    });
  }

  async unlockHint(hintId: string, user: { id: string; teamId: string | null }) {
    if (!user.teamId) {
      throw new BadRequestException('You must be in a team to unlock hints');
    }

    const hint = await this.prisma.hint.findUnique({
      where: { id: hintId },
    });

    if (!hint) {
      throw new NotFoundException('Hint not found');
    }

    const existingUnlock = await this.prisma.hintUnlock.findUnique({
      where: {
        teamId_hintId: {
          teamId: user.teamId,
          hintId: hint.id,
        },
      },
    });

    if (existingUnlock) {
      return {
        id: hint.id,
        text: hint.text,
        cost: hint.cost,
        isUnlocked: true,
        message: 'Hint already unlocked by your team.',
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.hintUnlock.create({
        data: {
          teamId: user.teamId!,
          hintId: hint.id,
        },
      });

      if (hint.cost > 0) {
        await tx.score.upsert({
          where: { teamId: user.teamId! },
          update: {
            points: {
              decrement: hint.cost,
            },
          },
          create: {
            teamId: user.teamId!,
            points: -hint.cost,
          },
        });
      }
    });

    return {
      id: hint.id,
      text: hint.text,
      cost: hint.cost,
      isUnlocked: true,
      message: `Hint unlocked! ${hint.cost} points deducted from team score.`,
    };
  }
}
