import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { ChallengesModule } from './challenges/challenges.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { EventModule } from './event/event.module';
import { HintsModule } from './hints/hints.module';
import { GroqModule } from './groq/groq.module';
import { RealtimeModule } from './realtime/realtime.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { WriteupsModule } from './writeups/writeups.module';
import { AdminModule } from './admin/admin.module';
import { MailModule } from './mail/mail.module';
import { InstancesModule } from './instances/instances.module';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    RealtimeModule,
    MailModule,
    EventModule,
    AuthModule,
    TeamsModule,
    ChallengesModule,
    SubmissionsModule,
    LeaderboardModule,
    HintsModule,
    GroqModule,
    AttachmentsModule,
    WriteupsModule,
    AdminModule,
    InstancesModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
