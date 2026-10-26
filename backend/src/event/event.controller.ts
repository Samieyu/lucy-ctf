import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { EventService } from './event.service';
import { UpdateEventDto } from './dto/update-event.dto';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Get()
  getEvent() {
    return this.eventService.getSettings();
  }

  @Patch('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateEvent(@Body() dto: UpdateEventDto) {
    return this.eventService.updateSettings(dto);
  }
}
