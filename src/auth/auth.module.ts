import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: 'SUPER_SECRET_KEY', // In production, use process.env.JWT_SECRET
      signOptions: { expiresIn: '7d' }, // Token lasts 7 days
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}