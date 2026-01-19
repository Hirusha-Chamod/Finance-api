import { IsBoolean, IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string; // e.g. "#FF0000"

  @IsString()
  @IsOptional()
  icon?: string; // e.g. "pizza-slice"
}