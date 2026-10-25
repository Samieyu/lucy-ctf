import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubmissionsService } from './submissions.service';
import { SubmitFlagDto } from './dto/submit-flag.dto';

interface AuthedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    teamId: string | null;
  };
}

@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post(':id/submit')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  submit(
    @Param('id') challengeId: string,
    @Req() req: AuthedRequest,
    @Body() dto: SubmitFlagDto,
  ) {
    return this.submissionsService.submitFlag(challengeId, req.user.id, dto);
  }
}
