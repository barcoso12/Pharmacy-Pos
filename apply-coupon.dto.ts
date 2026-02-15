import { CartItemDto } from './sales.service';

export class ApplyCouponDto {
  cartItems: CartItemDto[];
  code: string;
}