import { IsNotEmpty, IsNumber, IsString, IsUUID, Min, Matches } from 'class-validator';

export class CreateBudgetDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  @IsUUID()
  categoryId: string;

  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'Cycle must be in YYYY-MM format (e.g. 2026-01)' })
  cycle: string; // "2026-01"
}