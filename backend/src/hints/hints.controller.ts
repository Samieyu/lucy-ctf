import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { HintsService } from './hints.service';
import { CreateHintDto } from './dto/create-hint.dto';
import { UpdateHintDto } from './dto/update-hint.dto';

interface AuthedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    teamId: string | null;
  };
}

@Controller('hints')
@UseGuards(JwtAuthGuard)
export class HintsController {
  constructor(private readonly hintsService: HintsService) {}

  @Get('challenge/:challengeId')
  getHints(
    @Param('challengeId') challengeId: string,
    @Req() req: AuthedRequest,
  ) {
    return this.hintsService.getHintsForChallenge(
      challengeId,
      req.user.teamId,
      req.user.isAdmin,
    );
  }

  @Post(':id/unlock')
  unlock(@Param('id') hintId: string, @Req() req: AuthedRequest) {
    return this.hintsService.unlockHint(hintId, req.user);
  }

  // Admin endpoints
  @Post()
  @UseGuards(AdminGuard)
  create(@Body() dto: CreateHintDto) {
    return this.hintsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateHintDto) {
    return this.hintsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.hintsService.remove(id);
  }
}
