import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { ChallengesModule } from './challenges/challenges.module';

@Module({
  imports: [PrismaModule, AuthModule, TeamsModule, ChallengesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}