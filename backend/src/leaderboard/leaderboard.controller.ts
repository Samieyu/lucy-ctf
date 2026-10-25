import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';

@Controller('leaderboard')
@UseGuards(JwtAuthGuard)
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('teams')
  getTeamsLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.leaderboardService.getTeamsLeaderboard(query);
  }

  @Get('users')
  getUsersLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.leaderboardService.getUsersLeaderboard(query);
  }
}
