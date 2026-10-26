import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GroqService } from './groq.service';
import { AskAiHintDto } from './dto/ask-ai-hint.dto';

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
export class GroqController {
  constructor(private readonly groqService: GroqService) {}

  @Get(':id/ai-hint/status')
  async getStatus(@Param('id') challengeId: string, @Req() req: AuthedRequest) {
    const enabled = this.groqService.isEnabled();
    const remainingUses = enabled
      ? await this.groqService.getRemainingUses(req.user.id, challengeId)
      : 0;

    return {
      enabled,
      remainingUses,
    };
  }

  @Post(':id/ai-hint')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async askAiHint(
    @Param('id') challengeId: string,
    @Req() req: AuthedRequest,
    @Body() dto: AskAiHintDto,
  ) {
    return this.groqService.generateHint(challengeId, req.user.id, dto);
  }
}
