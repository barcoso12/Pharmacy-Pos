import { Injectable, NotFoundException } from '@nestjs/common';
import { DiscountsService } from './discounts.service';
import { Discount, DiscountType } from './discount.entity';

export interface CartItemDto {
  productId: string;
  quantity: number;
  price: number;
  category?: string;
}

export interface DiscountCalculationResult {
  discountId: string | null;
  discountName: string | null;
  amount: number;
  breakdown?: any[];
}

@Injectable()
export class SalesService {
  constructor(private discountsService: DiscountsService) {}

  async calculateApplicableDiscounts(cartItems: CartItemDto[]): Promise<DiscountCalculationResult> {
    const discounts = await this.discountsService.findAll();
    const now = new Date();
    
    let bestDiscount: Discount | null = null;
    let maxAmount = 0;

    for (const discount of discounts) {
      if (!discount.isActive) continue;
      if (discount.startDate && new Date(discount.startDate) > now) continue;
      if (discount.endDate && new Date(discount.endDate) < now) continue;
      if (discount.code) continue; // Skip coupons for automatic application

      const amount = this.calculateDiscountAmount(cartItems, discount);
      if (amount > maxAmount) {
        maxAmount = amount;
        bestDiscount = discount;
      }
    }

    return {
      discountId: bestDiscount?.id || null,
      discountName: bestDiscount?.name || null,
      amount: maxAmount
    };
  }

  async validateCoupon(code: string): Promise<Discount> {
    const discounts = await this.discountsService.findAll();
    const discount = discounts.find(d => d.code === code && d.isActive);
    
    if (!discount) {
      throw new NotFoundException(`Coupon with code '${code}' not found or is inactive.`);
    }
    
    const now = new Date();
    if (discount.startDate && new Date(discount.startDate) > now) throw new NotFoundException('Coupon is not yet active.');
    if (discount.endDate && new Date(discount.endDate) < now) throw new NotFoundException('Coupon has expired.');

    return discount;
  }

  applyCoupon(cartItems: CartItemDto[], coupon: Discount): DiscountCalculationResult {
    const amount = this.calculateDiscountAmount(cartItems, coupon);
    return {
      discountId: coupon.id,
      discountName: coupon.name,
      amount: amount
    };
  }

  private calculateDiscountAmount(cartItems: CartItemDto[], discount: Discount): number {
    const eligibleTotal = cartItems.reduce((sum, item) => sum + (Number(item.price) * item.quantity), 0);
    if (discount.type === DiscountType.PERCENTAGE) {
      return eligibleTotal * (Number(discount.value) / 100);
    }
    return Math.min(eligibleTotal, Number(discount.value));
  }
}