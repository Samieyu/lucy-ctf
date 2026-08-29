import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
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

  async findAllPublic() {
    return this.prisma.challenge.findMany({
      where: { isActive: true },
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAllAdmin() {
    // Admin view includes inactive challenges too, still never the flag
    return this.prisma.challenge.findMany({
      select: PUBLIC_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOnePublic(id: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });

    if (!challenge || !challenge.isActive) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
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