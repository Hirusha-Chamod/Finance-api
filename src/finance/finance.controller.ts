import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/transaction.dto';
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