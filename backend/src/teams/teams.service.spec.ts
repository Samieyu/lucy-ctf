import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeamsService', () => {
  let service: TeamsService;
  let prisma: {
    user: { findUnique: jest.Mock; update: jest.Mock };
    team: {
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: { findUnique: jest.fn(), update: jest.fn() },
      team: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TeamsService>(TeamsService);
  });

  describe('createTeam', () => {
    it('throws if user already on a team', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', teamId: 't1' });

      await expect(
        service.createTeam('u1', { name: 'Team A' }),
      ).rejects.toThrow(ConflictException);
    });

    it('throws if team name is taken', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', teamId: null });
      prisma.team.findUnique.mockResolvedValue({ id: 't1', name: 'Team A' });

      await expect(
        service.createTeam('u1', { name: 'Team A' }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates a team and sets creator as captain', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', teamId: null });
      prisma.team.findUnique.mockResolvedValue(null);
      prisma.team.create.mockResolvedValue({
        id: 't1',
        name: 'Team A',
        captainId: 'u1',
      });

      const result = await service.createTeam('u1', { name: 'Team A' });

      expect(prisma.team.create).toHaveBeenCalledWith({
        data: { name: 'Team A', captainId: 'u1' },
      });
      expect(result.captainId).toBe('u1');
    });
  });

  describe('leaveTeam', () => {
    it('throws if user has no team', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', teamId: null });

      await expect(service.leaveTeam('u1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deletes the team when the last member leaves', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', teamId: 't1' });
      prisma.team.findUnique.mockResolvedValue({
        id: 't1',
        captainId: 'u1',
        members: [],
      });

      await service.leaveTeam('u1');

      expect(prisma.team.delete).toHaveBeenCalledWith({ where: { id: 't1' } });
    });

    it('promotes a new captain when the captain leaves and others remain', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', teamId: 't1' });
      prisma.team.findUnique.mockResolvedValue({
        id: 't1',
        captainId: 'u1',
        members: [{ id: 'u2', username: 'bob' }],
      });

      await service.leaveTeam('u1');

      expect(prisma.team.update).toHaveBeenCalledWith({
        where: { id: 't1' },
        data: { captainId: 'u2' },
      });
    });
  });
});