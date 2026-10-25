import { Test, TestingModule } from '@nestjs/testing';
import { LeaderboardService } from './leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('LeaderboardService', () => {
  let service: LeaderboardService;
  let prisma: {
    score: { findMany: jest.Mock };
    user: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      score: { findMany: jest.fn() },
      user: { findMany: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaderboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<LeaderboardService>(LeaderboardService);
  });

  describe('getTeamsLeaderboard', () => {
    it('ranks teams by points desc and breaks ties with lastScoredAt asc', async () => {
      const mockScores = [
        {
          teamId: 't1',
          points: 500,
          lastScoredAt: new Date('2026-01-01T10:00:00Z'),
          team: {
            name: 'Alpha Team',
            members: [
              {
                submissions: [
                  { challengeId: 'c1' },
                  { challengeId: 'c2' },
                ],
              },
              {
                submissions: [
                  { challengeId: 'c2' }, // duplicate solve by another member
                  { challengeId: 'c3' },
                ],
              },
            ],
          },
        },
        {
          teamId: 't2',
          points: 500,
          lastScoredAt: new Date('2026-01-01T10:05:00Z'),
          team: {
            name: 'Beta Team',
            members: [
              {
                submissions: [{ challengeId: 'c1' }],
              },
            ],
          },
        },
      ];

      prisma.score.findMany.mockResolvedValue(mockScores);

      const result = await service.getTeamsLeaderboard({ limit: 10, offset: 0 });

      expect(prisma.score.findMany).toHaveBeenCalledWith({
        include: expect.any(Object),
        orderBy: [{ points: 'desc' }, { lastScoredAt: 'asc' }],
        skip: 0,
        take: 10,
      });

      expect(result).toEqual([
        {
          rank: 1,
          name: 'Alpha Team',
          points: 500,
          solveCount: 3, // c1, c2, c3
        },
        {
          rank: 2,
          name: 'Beta Team',
          points: 500,
          solveCount: 1, // c1
        },
      ]);
    });

    it('handles offset in ranking correctly', async () => {
      prisma.score.findMany.mockResolvedValue([
        {
          points: 100,
          lastScoredAt: new Date(),
          team: {
            name: 'Gamma Team',
            members: [{ submissions: [{ challengeId: 'c1' }] }],
          },
        },
      ]);

      const result = await service.getTeamsLeaderboard({ limit: 1, offset: 5 });

      expect(result[0].rank).toBe(6);
      expect(result[0].name).toBe('Gamma Team');
    });
  });

  describe('getUsersLeaderboard', () => {
    it('ranks users by sum of correct submission points and breaks ties with lastScoredAt asc', async () => {
      const mockUsers = [
        {
          username: 'alice',
          submissions: [
            {
              submittedAt: new Date('2026-01-01T10:05:00Z'),
              challenge: { points: 200 },
            },
          ],
        },
        {
          username: 'bob',
          submissions: [
            {
              submittedAt: new Date('2026-01-01T10:00:00Z'),
              challenge: { points: 200 },
            },
          ],
        },
        {
          username: 'charlie',
          submissions: [
            {
              submittedAt: new Date('2026-01-01T11:00:00Z'),
              challenge: { points: 300 },
            },
          ],
        },
      ];

      prisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsersLeaderboard({ limit: 10, offset: 0 });

      expect(result).toEqual([
        {
          rank: 1,
          name: 'charlie',
          points: 300,
          solveCount: 1,
        },
        {
          rank: 2,
          name: 'bob', // tied on 200 points, but solved earlier than alice
          points: 200,
          solveCount: 1,
        },
        {
          rank: 3,
          name: 'alice',
          points: 200,
          solveCount: 1,
        },
      ]);
    });
  });
});
