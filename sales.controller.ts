import { Body, Controller, Post } from '@nestjs/common';
import { SalesService } from './sales.service';
import { CalculateDiscountDto } from './calculate-discount.dto';
import { ValidateCouponDto } from './validate-coupon.dto';
import { ApplyCouponDto } from './apply-coupon.dto';

@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('calculate-discount')
  calculateDiscount(@Body() calculateDiscountDto: CalculateDiscountDto) {
    return this.salesService.calculateApplicableDiscounts(calculateDiscountDto.cartItems);
  }

  @Post('validate-coupon')
  validateCoupon(@Body() validateCouponDto: ValidateCouponDto) {
    return this.salesService.validateCoupon(validateCouponDto.code);
  }

  @Post('apply-coupon')
  async applyCoupon(@Body() applyCouponDto: ApplyCouponDto) {
    const coupon = await this.salesService.validateCoupon(applyCouponDto.code);
    return this.salesService.applyCoupon(applyCouponDto.cartItems, coupon);
  }
}