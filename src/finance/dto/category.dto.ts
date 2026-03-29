import { IsBoolean, IsHexColor, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string; 

  @IsString()
  @IsOptional()
  icon?: string; 
}