import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; 
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

 // 1. REGISTER USER
  async register(email: string, password: string, name: string) {
    // Check if user exists (Quick check before starting a transaction)
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ConflictException('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    // Use $transaction for explicit "All-or-Nothing" logic
    return this.prisma.$transaction(async (tx) => {
     // 1. Create the User
      const user = await tx.user.create({
        data: { email, passwordHash: hashedPassword, name },
      });

      // 2. Create the Wallet and CAPTURE it in a variable
      const wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          type: 'PERSONAL',
          currency: 'LKR',
        },
      });


      const defaultCategories = [
        { name: 'Food', color: '#ef4444', walletId: wallet.id },
        { name: 'Transport', color: '#3b82f6', walletId: wallet.id },
        { name: 'Shopping', color: '#8b5cf6', walletId: wallet.id },
        { name: 'Salary', color: '#10b981', walletId: wallet.id },
      ];

      // Batch create the categories
      await tx.category.createMany({
        data: defaultCategories,
      });

      return this.generateToken(user.id, user.email, user.name);

      
    });
  }

  // 2. LOGIN USER
  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateToken(user.id, user.email, user.name);
  }

  // Helper: Create JWT Token
 private generateToken(userId: string, email: string, name: string | null) { 
    const payload = { sub: userId, email };
    return {
      access_token: this.jwtService.sign(payload),
      user: { id: userId, email, name }
    };
  }
}