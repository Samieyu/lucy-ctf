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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminService } from './admin.service';
import {
  AdminPaginationDto,
  AuditQueryDto,
  BanUpdateDto,
  RoleUpdateDto,
} from './dto/admin-management.dto';

interface AuthedRequest extends Request {
  user: {
    id: string;
    email: string;
    username: string;
    isAdmin: boolean;
    teamId: string | null;
  };
}

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  listUsers(@Query() dto: AdminPaginationDto) {
    return this.adminService.listUsers(dto);
  }

  @Patch('users/:id/role')
  updateUserRole(
    @Param('id') userId: string,
    @Body() dto: RoleUpdateDto,
    @Req() req: AuthedRequest,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    return this.adminService.updateUserRole(userId, dto, req.user.id, ip);
  }

  @Patch('users/:id/ban')
  updateUserBan(
    @Param('id') userId: string,
    @Body() dto: BanUpdateDto,
    @Req() req: AuthedRequest,
  ) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    return this.adminService.updateUserBan(userId, dto, req.user.id, ip);
  }

  @Get('teams')
  listTeams(@Query() dto: AdminPaginationDto) {
    return this.adminService.listTeams(dto);
  }

  @Delete('teams/:id')
  deleteTeam(@Param('id') teamId: string, @Req() req: AuthedRequest) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    return this.adminService.deleteTeam(teamId, req.user.id, ip);
  }

  @Post('teams/:id/reset-score')
  resetScore(@Param('id') teamId: string, @Req() req: AuthedRequest) {
    const ip = req.ip || (req.headers['x-forwarded-for'] as string) || '';
    return this.adminService.resetTeamScore(teamId, req.user.id, ip);
  }

  @Get('audit')
  listAuditLogs(@Query() dto: AuditQueryDto) {
    return this.adminService.listAuditLogs(dto);
  }
}
