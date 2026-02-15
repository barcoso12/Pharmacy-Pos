import { IsString, IsEnum, IsNumber, IsOptional, IsBoolean, IsDateString, IsObject, IsUUID, IsArray, ValidateNested, IsAlphanumeric, IsUppercase } from 'class-validator';
import { Type } from 'class-transformer';
import { DiscountType } from './discount.entity';
import { DiscountRuleType } from './discount-rule.entity';

export class CreateDiscountRuleDto {
  @IsEnum(DiscountRuleType)
  ruleType: DiscountRuleType;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class CreateDiscountDto {
  @IsUUID()
  organizationId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @IsAlphanumeric()
  @IsUppercase()
  code?: string;

  @IsEnum(DiscountType)
  type: DiscountType;

  @IsNumber()
  value: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsObject()
  rules?: Record<string, any>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateDiscountRuleDto)
  discountRules?: CreateDiscountRuleDto[];
}