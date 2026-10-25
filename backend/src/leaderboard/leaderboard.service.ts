import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  solveCount: number;
}

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTeamsLeaderboard(
    query: LeaderboardQueryDto,
  ): Promise<LeaderboardEntry[]> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const scores = await this.prisma.score.findMany({
      include: {
        team: {
          select: {
            name: true,
            members: {
              select: {
                submissions: {
                  where: { isCorrect: true },
                  select: { challengeId: true },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { points: 'desc' },
        { lastScoredAt: 'asc' },
      ],
      skip: offset,
      take: limit,
    });

    return scores.map((score, index) => {
      const solveCount = new Set(
        score.team.members.flatMap((member) =>
          member.submissions.map((sub) => sub.challengeId),
        ),
      ).size;

      return {
        rank: offset + index + 1,
        name: score.team.name,
        points: score.points,
        solveCount,
      };
    });
  }

  async getUsersLeaderboard(
    query: LeaderboardQueryDto,
  ): Promise<LeaderboardEntry[]> {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;

    const users = await this.prisma.user.findMany({
      where: {
        submissions: {
          some: { isCorrect: true },
        },
      },
      select: {
        username: true,
        submissions: {
          where: { isCorrect: true },
          select: {
            submittedAt: true,
            challenge: {
              select: {
                points: true,
              },
            },
          },
        },
      },
    });

    const rankedUsers = users.map((user) => {
      const points = user.submissions.reduce(
        (sum, s) => sum + s.challenge.points,
        0,
      );
      const solveCount = user.submissions.length;
      const lastScoredAt = user.submissions.reduce(
        (latest, s) => (s.submittedAt > latest ? s.submittedAt : latest),
        new Date(0),
      );

      return {
        name: user.username,
        points,
        solveCount,
        lastScoredAt,
      };
    });

    rankedUsers.sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      return a.lastScoredAt.getTime() - b.lastScoredAt.getTime();
    });

    const paginated = rankedUsers.slice(offset, offset + limit);

    return paginated.map((user, index) => ({
      rank: offset + index + 1,
      name: user.name,
      points: user.points,
      solveCount: user.solveCount,
    }));
  }
}
