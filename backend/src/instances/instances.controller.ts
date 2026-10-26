import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InstancesService } from './instances.service';

interface AuthedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    teamId: string | null;
  };
}

@Controller('challenges/:id/instance')
@UseGuards(JwtAuthGuard)
export class InstancesController {
  constructor(private readonly instancesService: InstancesService) {}

  @Get()
  getStatus(@Param('id') challengeId: string, @Req() req: AuthedRequest) {
    if (!req.user.teamId) {
      return { enabled: this.instancesService.isInstancesEnabled(), instance: null };
    }
    return this.instancesService.getInstanceStatus(challengeId, req.user.teamId);
  }

  @Post('start')
  start(@Param('id') challengeId: string, @Req() req: AuthedRequest) {
    if (!req.user.teamId) {
      throw new BadRequestException('You must belong to a team to launch challenge instances');
    }
    return this.instancesService.startInstance(challengeId, req.user.teamId);
  }

  @Post('extend')
  extend(@Param('id') challengeId: string, @Req() req: AuthedRequest) {
    if (!req.user.teamId) {
      throw new BadRequestException('You must belong to a team to extend instances');
    }
    return this.instancesService.extendInstance(challengeId, req.user.teamId);
  }

  @Post('stop')
  stop(@Param('id') challengeId: string, @Req() req: AuthedRequest) {
    if (!req.user.teamId) {
      throw new BadRequestException('You must belong to a team to stop instances');
    }
    return this.instancesService.stopInstance(challengeId, req.user.teamId);
  }
}
