import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.eventSettings.findUnique({
      where: { id: 'default' },
    });

    if (!settings) {
      const now = new Date();
      const endsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      settings = await this.prisma.eventSettings.create({
        data: {
          id: 'default',
          name: 'Lucy CTF',
          startsAt: now,
          endsAt,
          isPaused: false,
        },
      });
    }

    const now = new Date();
    const isStarted = now >= settings.startsAt;
    const isEnded = now > settings.endsAt;
    const isFrozen = settings.freezeLeaderboardAt
      ? now >= settings.freezeLeaderboardAt
      : false;
    const isActive = isStarted && !isEnded && !settings.isPaused;

    return {
      ...settings,
      isStarted,
      isEnded,
      isFrozen,
      isActive,
    };
  }

  async updateSettings(dto: UpdateEventDto) {
    await this.getSettings();

    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.startsAt !== undefined) data.startsAt = new Date(dto.startsAt);
    if (dto.endsAt !== undefined) data.endsAt = new Date(dto.endsAt);
    if (dto.freezeLeaderboardAt !== undefined) {
      data.freezeLeaderboardAt = dto.freezeLeaderboardAt
        ? new Date(dto.freezeLeaderboardAt)
        : null;
    }
    if (dto.isPaused !== undefined) data.isPaused = dto.isPaused;

    return this.prisma.eventSettings.update({
      where: { id: 'default' },
      data,
    });
  }

  async checkSubmissionAllowed(): Promise<{ allowed: boolean; reason?: string }> {
    const settings = await this.getSettings();
    const now = new Date();

    if (settings.isPaused) {
      return {
        allowed: false,
        reason: 'The CTF is currently paused by administrators.',
      };
    }
    if (now < settings.startsAt) {
      return {
        allowed: false,
        reason: `The CTF has not started yet. Starts at ${settings.startsAt.toISOString()}.`,
      };
    }
    if (now > settings.endsAt) {
      return {
        allowed: false,
        reason: 'The CTF has ended. Flag submissions are closed.',
      };
    }

    return { allowed: true };
  }
}
