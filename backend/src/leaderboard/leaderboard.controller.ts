import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

interface AuthedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    teamId: string | null;
  };
}

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('teams')
  getTeamsLeaderboard(
    @Query() query: LeaderboardQueryDto,
    @Req() req: AuthedRequest,
  ) {
    return this.leaderboardService.getTeamsLeaderboard(
      query,
      req.user.isAdmin,
    );
  }

  @Get('users')
  getUsersLeaderboard(
    @Query() query: LeaderboardQueryDto,
    @Req() req: AuthedRequest,
  ) {
    return this.leaderboardService.getUsersLeaderboard(
      query,
      req.user.isAdmin,
    );
  }
}
