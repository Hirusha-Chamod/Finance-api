import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/transaction.dto';
import { CreateBudgetDto } from './dto/budget.dto';

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

  // 3. Create a Category (e.g. "Groceries")
  async createCategory(userId: string, name: string, color: string = '#000000') {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.prisma.category.create({
      data: {
        name,
        color,
        walletId: wallet.id,
        isDefault: false,
      },
    });
  }

  // 4. Get all Categories for the user
  async getCategories(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.prisma.category.findMany({
      where: { walletId: wallet.id },
    });
  }

  // 5. Set or Update a Budget
  async setBudget(userId: string, dto: CreateBudgetDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // Upsert: Update if exists, Create if new
    return this.prisma.budget.upsert({
      where: {
        walletId_categoryId_cycle: {
          walletId: wallet.id,
          categoryId: dto.categoryId,
          cycle: dto.cycle,
        },
      },
      update: { amount: dto.amount },
      create: {
        amount: dto.amount,
        cycle: dto.cycle,
        categoryId: dto.categoryId,
        walletId: wallet.id,
      },
    });
  }

  // 6. Get Budget Progress (The Dashboard View)
  async getBudgetProgress(userId: string, cycle: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // Get all budgets for this cycle (e.g., Jan 2026)
    const budgets = await this.prisma.budget.findMany({
      where: { walletId: wallet.id, cycle },
      include: { category: true },
    });

    // Calculate spending for each budget
    const report = await Promise.all(
      budgets.map(async (budget) => {
        // Sum expenses for this category in this month
        const expenses = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            walletId: wallet.id,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            // Simple date filter for the month (improvement: use exact dates)
            date: {
              gte: new Date(`${cycle}-01`),
              lt: new Date(`${cycle}-31`), // Rough approximation for now
            },
          },
        });

        const spent = Number(expenses._sum.amount || 0);
        const limit = Number(budget.amount);

        return {
          category: budget.category.name,
          color: budget.category.color,
          limit: limit,
          spent: spent,
          remaining: limit - spent,
          percentage: Math.round((spent / limit) * 100),
        };
      }),
    );

    return report;
  }
}