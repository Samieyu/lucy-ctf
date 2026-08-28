import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { JoinTeamDto } from './dto/join-team.dto';

interface AuthedRequest extends Request {
  user: { id: string };
}

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post('create')
  create(@Req() req: AuthedRequest, @Body() dto: CreateTeamDto) {
    return this.teamsService.createTeam(req.user.id, dto);
  }

  @Post('join')
  join(@Req() req: AuthedRequest, @Body() dto: JoinTeamDto) {
    return this.teamsService.joinTeam(req.user.id, dto);
  }

  @Get('me')
  getMyTeam(@Req() req: AuthedRequest) {
    return this.teamsService.getMyTeam(req.user.id);
  }

  @Post('leave')
  leave(@Req() req: AuthedRequest) {
    return this.teamsService.leaveTeam(req.user.id);
  }
}