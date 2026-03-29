import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
}

export class CreateTransactionDto {
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(TransactionType)
  type: TransactionType;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsOptional()
  date?: Date;
}

export class GetTransactionsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @IsOptional()
  @IsString()
  @IsUUID()
  categoryId?: string;

  @IsOptional()
  @IsString()
  startDate?: string; // ISO Date string

  @IsOptional()
  @IsString()
  endDate?: string; // ISO Date string

  @IsOptional()
  @IsString()
  search?: string;
}