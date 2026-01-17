import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { FinanceModule } from './finance/finance.module';
import { PredictionModule } from './prediction/prediction.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [AuthModule, FinanceModule, PredictionModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
