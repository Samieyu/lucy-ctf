import { Module } from '@nestjs/common';
import { WriteupsController } from './writeups.controller';
import { WriteupsService } from './writeups.service';

@Module({
  controllers: [WriteupsController],
  providers: [WriteupsService],
  exports: [WriteupsService],
})
export class WriteupsModule {}
