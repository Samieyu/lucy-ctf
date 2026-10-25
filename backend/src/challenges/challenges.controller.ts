import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { ChallengeCategory } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { ChallengesService } from './challenges.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { UpdateChallengeDto } from './dto/update-challenge.dto';

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
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  // Public — any logged-in participant can browse challenges
  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(
    @Req() req: AuthedRequest,
    @Query('category') category?: ChallengeCategory,
  ) {
    return this.challengesService.findAllPublic(req.user, category);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string, @Req() req: AuthedRequest) {
    return this.challengesService.findOnePublic(id, req.user);
  }

  // Admin-only management endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  findAllAdmin() {
    return this.challengesService.findAllAdmin();
  }

  @Post()
  @UseGuards(JwtAuthGuard, AdminGuard)
  create(@Body() dto: CreateChallengeDto) {
    return this.challengesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  update(@Param('id') id: string, @Body() dto: UpdateChallengeDto) {
    return this.challengesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  remove(@Param('id') id: string) {
    return this.challengesService.remove(id);
  }
}
