import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { envValidationSchema } from './config/env.validation'; // Ensure this file exists!

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FinanceModule } from './finance/finance.module';
import { PredictionModule } from './prediction/prediction.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    // Environment Validation (Strict check for JWT_SECRET and DATABASE_URL)
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),

    // Global Rate Limiter (10 requests per 60s baseline)
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),

    AuthModule,
    FinanceModule,
    PredictionModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Activates throttling for every endpoint
    },
  ],
})
export class AppModule {}