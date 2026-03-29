import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto } from './dto/transaction.dto';
import { CreateBudgetDto } from './dto/budget.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  // 1. Get Wallet Summary (Balance + Recent Tx + Monthly Stats)
  async getWalletSummary(userId: string) {
    // Find the wallet first
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    // A. Define "This Month" date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // B. Calculate Total Balance (All Time)
    const totalIncomeAgg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { walletId: wallet.id, type: 'INCOME' },
    });
    const totalExpenseAgg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { walletId: wallet.id, type: 'EXPENSE' },
    });
    
    const totalBalance = (Number(totalIncomeAgg._sum.amount) || 0) - (Number(totalExpenseAgg._sum.amount) || 0);

    // C. Calculate Monthly Stats (This Month Only)
    const monthlyIncomeAgg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        walletId: wallet.id,
        type: 'INCOME',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });
    const monthlyExpenseAgg = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        walletId: wallet.id,
        type: 'EXPENSE',
        date: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    // D. Get Recent Transactions
    const recentTransactions = await this.prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' } 
      ],
      take: 5,
      include: { category: true },
    });

    return {
      walletId: wallet.id,
      currency: wallet.currency,
      balance: totalBalance,
      totalIncome: Number(monthlyIncomeAgg._sum.amount) || 0,
      totalExpense: Number(monthlyExpenseAgg._sum.amount) || 0,
      recentTransactions,
    };
  }

  // 2. Add a Transaction (Income or Expense)
  async createTransaction(userId: string, dto: CreateTransactionDto) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    return this.prisma.transaction.create({
      data: {
        amount: dto.amount,
        type: dto.type,
        description: dto.description,
        walletId: wallet.id,
        categoryId: dto.categoryId || null,
        date: dto.date || new Date(),
      },
    });
  }

  // 3. Create a Category
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

  // 4. Get all Categories
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

  // 6. Get Budget Progress
  async getBudgetProgress(userId: string, cycle: string) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    const [year, month] = cycle.split('-');

    const startDate = new Date(Number(year), Number(month) - 1, 1);
    const endDate = new Date(Number(year), Number(month), 1);

    const budgets = await this.prisma.budget.findMany({
      where: { walletId: wallet.id, cycle },
      include: { category: true },
    });

    const report = await Promise.all(
      budgets.map(async (budget) => {
        const expenses = await this.prisma.transaction.aggregate({
          _sum: { amount: true },
          where: {
            walletId: wallet.id,
            categoryId: budget.categoryId,
            type: 'EXPENSE',
            date: {
            gte: startDate,
            lt: endDate, 
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

  async getTransactions(
    userId: string, 
    limit: number = 20, 
    cursor?: string,
    filters?: { type?: string; categoryId?: string; startDate?: string; endDate?: string; search?: string }
  ) {
    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');

    
    const whereClause: Prisma.TransactionWhereInput = { 
      walletId: wallet.id 
    };

    if (filters?.type) {
      whereClause.type = filters.type;
    }
    
    if (filters?.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    if (filters?.startDate || filters?.endDate) {
      whereClause.date = {};
      if (filters.startDate) whereClause.date.gte = new Date(filters.startDate);
      if (filters.endDate) whereClause.date.lte = new Date(filters.endDate);
    }

    if (filters?.search) {
      // mode: 'insensitive' makes it case-insensitive search
      whereClause.description = { contains: filters.search, mode: 'insensitive' };
    }

    // Execute query with the dynamic where clause
    const transactions = await this.prisma.transaction.findMany({
      where: whereClause,
      take: limit + 1,
      skip: cursor ? 1 : 0,
      ...(cursor && { cursor: { id: cursor } }),
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      include: { category: true },
    });

    let nextCursor: string | null = null;
    
    if (transactions.length > limit) {
      const nextItem = transactions.pop();
      nextCursor = nextItem!.id;
    }

    return {
      data: transactions,
      nextCursor,
    };
  }
}

