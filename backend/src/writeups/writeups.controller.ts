import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { WriteupsService } from './writeups.service';
import { SubmitWriteupDto } from './dto/submit-writeup.dto';

interface AuthedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    teamId: string | null;
  };
}

@Controller('challenges/:id/writeup')
@UseGuards(JwtAuthGuard)
export class WriteupsController {
  constructor(private readonly writeupsService: WriteupsService) {}

  @Post()
  submit(
    @Param('id') challengeId: string,
    @Req() req: AuthedRequest,
    @Body() dto: SubmitWriteupDto,
  ) {
    return this.writeupsService.submitWriteup(challengeId, req.user, dto);
  }

  @Get()
  get(
    @Param('id') challengeId: string,
    @Req() req: AuthedRequest,
    @Query('teamId') teamId?: string,
  ) {
    return this.writeupsService.getWriteup(challengeId, req.user, teamId);
  }

  @Get('all')
  @UseGuards(AdminGuard)
  listAll(@Param('id') challengeId: string) {
    return this.writeupsService.listAdminWriteups(challengeId);
  }
}
