import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SubmissionsService } from './submissions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SubmissionsService', () => {
  let service: SubmissionsService;
  let prisma: {
    user: { findUnique: jest.Mock };
    challenge: { findUnique: jest.Mock };
    submission: { findFirst: jest.Mock; create: jest.Mock };
    score: { upsert: jest.Mock };
    $transaction: jest.Mock;
  };

  const mockUser = { id: 'u1', teamId: 't1' };
  const mockChallenge = {
    id: 'c1',
    title: 'Warmup',
    points: 100,
    isActive: true,
    flagHash: '',
  };

  beforeAll(async () => {
    mockChallenge.flagHash = await bcrypt.hash('FLAG{correct_flag}', 10);
  });

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn() },
      challenge: { findUnique: jest.fn() },
      submission: { findFirst: jest.fn(), create: jest.fn() },
      score: { upsert: jest.fn() },
      $transaction: jest.fn().mockImplementation(async (cb) => {
        return cb(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubmissionsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SubmissionsService>(SubmissionsService);
  });

  it('throws UnauthorizedException if user does not exist', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      service.submitFlag('c1', 'u1', { flag: 'FLAG{test}' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws BadRequestException if user is not on a team', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', teamId: null });

    await expect(
      service.submitFlag('c1', 'u1', { flag: 'FLAG{test}' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws NotFoundException if challenge is not found', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.challenge.findUnique.mockResolvedValue(null);

    await expect(
      service.submitFlag('c1', 'u1', { flag: 'FLAG{test}' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException if challenge is inactive', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.challenge.findUnique.mockResolvedValue({
      ...mockChallenge,
      isActive: false,
    });

    await expect(
      service.submitFlag('c1', 'u1', { flag: 'FLAG{test}' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws BadRequestException if user has already solved the challenge', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.challenge.findUnique.mockResolvedValue(mockChallenge);
    prisma.submission.findFirst.mockResolvedValue({
      id: 's1',
      userId: 'u1',
      challengeId: 'c1',
      isCorrect: true,
    });

    await expect(
      service.submitFlag('c1', 'u1', { flag: 'FLAG{test}' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('records failed attempt and returns isCorrect: false on wrong flag', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.challenge.findUnique.mockResolvedValue(mockChallenge);
    prisma.submission.findFirst.mockResolvedValue(null);
    prisma.submission.create.mockResolvedValue({ id: 's1', isCorrect: false });

    const result = await service.submitFlag('c1', 'u1', {
      flag: 'FLAG{wrong_flag}',
    });

    expect(result.isCorrect).toBe(false);
    expect(prisma.submission.create).toHaveBeenCalledWith({
      data: {
        userId: 'u1',
        challengeId: 'c1',
        isCorrect: false,
      },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('awards points, records solve atomically, and returns isCorrect: true on correct flag', async () => {
    prisma.user.findUnique.mockResolvedValue(mockUser);
    prisma.challenge.findUnique.mockResolvedValue(mockChallenge);
    prisma.submission.findFirst.mockResolvedValue(null);
    prisma.submission.create.mockResolvedValue({ id: 's2', isCorrect: true });
    prisma.score.upsert.mockResolvedValue({ id: 'sc1', points: 100 });

    const result = await service.submitFlag('c1', 'u1', {
      flag: 'FLAG{correct_flag}',
    });

    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(100);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.score.upsert).toHaveBeenCalledWith({
      where: { teamId: 't1' },
      update: {
        points: { increment: 100 },
        lastScoredAt: expect.any(Date),
      },
      create: {
        teamId: 't1',
        points: 100,
        lastScoredAt: expect.any(Date),
      },
    });
  });
});
