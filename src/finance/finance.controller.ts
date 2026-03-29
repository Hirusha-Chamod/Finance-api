import { Controller, Get, Post, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto, GetTransactionsQueryDto } from './dto/transaction.dto';
import { AuthGuard } from '@nestjs/passport';
import { CreateCategoryDto } from './dto/category.dto';
import { CreateBudgetDto } from './dto/budget.dto';

@Controller('finance')
@UseGuards(AuthGuard('jwt')) 
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getWalletSummary(@Request() req) {
    // Calls the updated service method
    return this.financeService.getWalletSummary(req.user.userId);
  }

  @Post('transaction')
  addTransaction(@Request() req, @Body() dto: CreateTransactionDto) {
    return this.financeService.createTransaction(req.user.userId, dto);
  }

  @Get('transactions')
  getTransactions(@Request() req, @Query() query: GetTransactionsQueryDto) {
    // FORCE the limit to be a number (fallback to 20 if it fails parsing)
    const limit = query.limit ? Number(query.limit) : 20; 
    
    return this.financeService.getTransactions(
      req.user.userId, 
      limit, // Now this is guaranteed to be an integer (e.g., 20)
      query.cursor,
      {
        type: query.type,
        categoryId: query.categoryId,
        startDate: query.startDate,
        endDate: query.endDate,
        search: query.search
      }
    );
  }

  @Post('category')
  createCategory(@Request() req, @Body() dto: CreateCategoryDto) {
    return this.financeService.createCategory(req.user.userId, dto.name, dto.color);
  }

  @Get('categories')
  getCategories(@Request() req) {
    return this.financeService.getCategories(req.user.userId);
  }

  @Post('budget')
  setBudget(@Request() req, @Body() dto: CreateBudgetDto) {
    return this.financeService.setBudget(req.user.userId, dto);
  }

  @Get('budgets/:cycle')
  getBudgetProgress(@Request() req, @Param('cycle') cycle: string) {
    return this.financeService.getBudgetProgress(req.user.userId, cycle);
  }
}