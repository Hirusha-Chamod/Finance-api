import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { CreateTransactionDto } from './dto/transaction.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('finance')
@UseGuards(AuthGuard('jwt')) // <--- Protects these routes with your Token
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('summary')
  getWalletSummary(@Request() req) {
    return this.financeService.getWalletData(req.user.userId);
  }

  @Post('transaction')
  addTransaction(@Request() req, @Body() dto: CreateTransactionDto) {
    return this.financeService.createTransaction(req.user.userId, dto);
  }
}