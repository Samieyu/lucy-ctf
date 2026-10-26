import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminPaginationDto,
  AuditQueryDto,
  BanUpdateDto,
  RoleUpdateDto,
} from './dto/admin-management.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(dto: AdminPaginationDto) {
    const limit = dto.limit || 20;
    const offset = dto.offset || 0;
    const where: Record<string, unknown> = {};

    if (dto.search) {
      where.OR = [
        { username: { contains: dto.search, mode: 'insensitive' } },
        { email: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          username: true,
          isAdmin: true,
          isBanned: true,
          banReason: true,
          emailVerified: true,
          twoFactorEnabled: true,
          createdAt: true,
          team: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    return { total, limit, offset, users };
  }

  async updateUserRole(
    userId: string,
    dto: RoleUpdateDto,
    actorId: string,
    ip?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isAdmin: dto.isAdmin },
      select: { id: true, username: true, isAdmin: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: dto.isAdmin ? 'PROMOTE_ADMIN' : 'DEMOTE_ADMIN',
        targetType: 'USER',
        targetId: userId,
        ip,
        metadata: JSON.stringify({ targetUsername: user.username }),
      },
    });

    return updated;
  }

  async updateUserBan(
    userId: string,
    dto: BanUpdateDto,
    actorId: string,
    ip?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.isAdmin && dto.isBanned) {
      throw new BadRequestException('Cannot ban an administrator');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isBanned: dto.isBanned,
        banReason: dto.isBanned ? dto.banReason || 'Banned by admin' : null,
      },
      select: { id: true, username: true, isBanned: true, banReason: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId,
        action: dto.isBanned ? 'BAN_USER' : 'UNBAN_USER',
        targetType: 'USER',
        targetId: userId,
        ip,
        metadata: JSON.stringify({
          targetUsername: user.username,
          reason: dto.banReason,
        }),
      },
    });

    return updated;
  }

  async listTeams(dto: AdminPaginationDto) {
    const limit = dto.limit || 20;
    const offset = dto.offset || 0;
    const where: Record<string, unknown> = {};

    if (dto.search) {
      where.name = { contains: dto.search, mode: 'insensitive' };
    }

    const [total, teams] = await Promise.all([
      this.prisma.team.count({ where }),
      this.prisma.team.findMany({
        where,
        include: {
          captain: { select: { id: true, username: true } },
          members: { select: { id: true, username: true, email: true } },
          scores: { select: { points: true, lastScoredAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    const formatted = teams.map((team) => ({
      id: team.id,
      name: team.name,
      inviteCode: team.inviteCode,
      captain: team.captain,
      memberCount: team.members.length,
      members: team.members,
      points: team.scores[0]?.points || 0,
      lastScoredAt: team.scores[0]?.lastScoredAt || team.createdAt,
      createdAt: team.createdAt,
    }));

    return { total, limit, offset, teams: formatted };
  }

  async deleteTeam(teamId: string, actorId: string, ip?: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true },
    });
    if (!team) throw new NotFoundException('Team not found');

    await this.prisma.$transaction(async (tx) => {
      // Reassign members to no team
      await tx.user.updateMany({
        where: { teamId },
        data: { teamId: null },
      });

      // Delete team
      await tx.team.delete({ where: { id: teamId } });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'DELETE_TEAM',
          targetType: 'TEAM',
          targetId: teamId,
          ip,
          metadata: JSON.stringify({
            teamName: team.name,
            memberCount: team.members.length,
          }),
        },
      });
    });

    return { success: true, message: `Team ${team.name} deleted successfully` };
  }

  async resetTeamScore(teamId: string, actorId: string, ip?: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team) throw new NotFoundException('Team not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.score.upsert({
        where: { teamId },
        update: { points: 0, lastScoredAt: new Date() },
        create: { teamId, points: 0, lastScoredAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'RESET_SCORE',
          targetType: 'TEAM',
          targetId: teamId,
          ip,
          metadata: JSON.stringify({ teamName: team.name }),
        },
      });
    });

    return { success: true, message: `Score for ${team.name} reset to 0` };
  }

  async listAuditLogs(dto: AuditQueryDto) {
    const limit = dto.limit || 50;
    const offset = dto.offset || 0;
    const where: Record<string, unknown> = {};

    if (dto.action) where.action = dto.action;
    if (dto.targetType) where.targetType = dto.targetType;
    if (dto.suspiciousOnly) {
      where.action = { startsWith: 'SUSPICIOUS_' };
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        include: {
          actor: { select: { id: true, username: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
    ]);

    return { total, limit, offset, logs };
  }
}
