import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

export interface LeaderboardTeamEntry {
  rank: number;
  name: string;
  points: number;
  solves: number;
}

export interface LeaderboardUserEntry {
  rank: number;
  name: string;
  points: number;
  solves: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeamsLeaderboard(
    query: LeaderboardQueryDto,
    isAdmin = false,
  ): Promise<LeaderboardTeamEntry[]> {
    const limit = Math.min(query.limit ?? 100, 100);
    const offset = query.offset ?? 0;

    const event = await this.prisma.eventSettings.findFirst();
    const isFrozen =
      !isAdmin &&
      !!event?.freezeLeaderboardAt &&
      new Date() >= new Date(event.freezeLeaderboardAt);

    if (isFrozen && event?.freezeLeaderboardAt) {
      // Calculate snapshot up to freezeLeaderboardAt
      const freezeTime = new Date(event.freezeLeaderboardAt);

      const submissions = await this.prisma.submission.findMany({
        where: {
          isCorrect: true,
          submittedAt: { lte: freezeTime },
          user: { teamId: { not: null }, isBanned: false },
        },
        include: {
          challenge: true,
          user: { select: { team: true } },
        },
        orderBy: { submittedAt: 'asc' },
      });

      const teamStats = new Map<
        string,
        {
          name: string;
          points: number;
          solves: number;
          lastScoredAt: Date;
          solvedChallenges: Set<string>;
        }
      >();

      for (const sub of submissions) {
        const team = sub.user.team;
        if (!team) continue;

        if (!teamStats.has(team.id)) {
          teamStats.set(team.id, {
            name: team.name,
            points: 0,
            solves: 0,
            lastScoredAt: sub.submittedAt,
            solvedChallenges: new Set<string>(),
          });
        }

        const current = teamStats.get(team.id)!;
        if (!current.solvedChallenges.has(sub.challengeId)) {
          current.solvedChallenges.add(sub.challengeId);
          current.points += sub.challenge.points;
          current.solves += 1;
          current.lastScoredAt = sub.submittedAt;
        }
      }

      // Also ensure all existing teams are included (even with 0 points)
      const allTeams = await this.prisma.team.findMany({
        select: { id: true, name: true, createdAt: true },
      });

      for (const team of allTeams) {
        if (!teamStats.has(team.id)) {
          teamStats.set(team.id, {
            name: team.name,
            points: 0,
            solves: 0,
            lastScoredAt: team.createdAt,
            solvedChallenges: new Set<string>(),
          });
        }
      }

      const sorted = Array.from(teamStats.values()).sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }
        return a.lastScoredAt.getTime() - b.lastScoredAt.getTime();
      });

      return sorted.slice(offset, offset + limit).map((t, idx) => ({
        rank: offset + idx + 1,
        name: t.name,
        points: t.points,
        solves: t.solves,
      }));
    }

    // Live leaderboard (not frozen or admin requesting)
    const teams = await this.prisma.team.findMany({
      include: {
        score: true,
        members: {
          where: { isBanned: false },
          include: {
            submissions: {
              where: { isCorrect: true },
              select: { challengeId: true },
            },
          },
        },
      },
      orderBy: [
        { score: { points: 'desc' } },
        { score: { lastScoredAt: 'asc' } },
      ],
      skip: offset,
      take: limit,
    });

    return teams.map((team, idx) => {
      const uniqueChallengeIds = new Set<string>();
      for (const member of team.members) {
        for (const sub of member.submissions) {
          uniqueChallengeIds.add(sub.challengeId);
        }
      }

      return {
        rank: offset + idx + 1,
        name: team.name,
        points: team.score?.points ?? 0,
        solves: uniqueChallengeIds.size,
      };
    });
  }

  async getUsersLeaderboard(
    query: LeaderboardQueryDto,
    isAdmin = false,
  ): Promise<LeaderboardUserEntry[]> {
    const limit = Math.min(query.limit ?? 100, 100);
    const offset = query.offset ?? 0;

    const event = await this.prisma.eventSettings.findFirst();
    const isFrozen =
      !isAdmin &&
      !!event?.freezeLeaderboardAt &&
      new Date() >= new Date(event.freezeLeaderboardAt);

    const submissionWhere: Record<string, unknown> = {
      isCorrect: true,
    };

    if (isFrozen && event?.freezeLeaderboardAt) {
      submissionWhere.submittedAt = {
        lte: new Date(event.freezeLeaderboardAt),
      };
    }

    const users = await this.prisma.user.findMany({
      where: { isBanned: false },
      include: {
        submissions: {
          where: submissionWhere,
          include: { challenge: true },
          orderBy: { submittedAt: 'asc' },
        },
      },
    });

    const userStats = users.map((user) => {
      const solvedChallenges = new Set<string>();
      let points = 0;
      let lastScoredAt = user.createdAt;

      for (const sub of user.submissions) {
        if (!solvedChallenges.has(sub.challengeId)) {
          solvedChallenges.add(sub.challengeId);
          points += sub.challenge.points;
          lastScoredAt = sub.submittedAt;
        }
      }

      return {
        name: user.username,
        points,
        solves: solvedChallenges.size,
        lastScoredAt,
      };
    });

    userStats.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return a.lastScoredAt.getTime() - b.lastScoredAt.getTime();
    });

    return userStats.slice(offset, offset + limit).map((u, idx) => ({
      rank: offset + idx + 1,
      name: u.name,
      points: u.points,
      solves: u.solves,
    }));
  }
}
