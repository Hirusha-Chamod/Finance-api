import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/transaction.dto';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // 1. Get Wallet Balance & Recent Transactions
  async getWalletData(userId: string) {
    // Find the Personal Wallet for this user
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { date: 'desc' },
          take: 5, // Just the last 5 for now
        },
      },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    // Calculate Balance manually (Income - Expense)
    const allTransactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
    });

    const income = allTransactions
      .filter((t) => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const expense = allTransactions
      .filter((t) => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return {
      walletId: wallet.id,
      currency: wallet.currency,
      balance: income - expense,
      recentTransactions: wallet.transactions,
    };
  }

  // 2. Add a Transaction (Income or Expense)
  async createTransaction(userId: string, dto: CreateTransactionDto) {
    // First, find the wallet
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
    });

    if (!wallet) throw new NotFoundException('Wallet not found');

    // Create the record
    return this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        walletId: wallet.id,
        categoryId: dto.categoryId || null,
      },
    });
  }
}