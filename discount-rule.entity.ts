import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Discount } from './discount.entity';

export enum DiscountRuleType {
  PRODUCT = 'PRODUCT',
  CATEGORY = 'CATEGORY',
}

@Entity('discount_rules')
export class DiscountRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'discount_id' })
  discountId: string;

  @ManyToOne(() => Discount, (discount) => discount.discountRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'discount_id' })
  discount: Discount;

  @Column({
    type: 'enum',
    enum: DiscountRuleType,
    name: 'rule_type',
  })
  ruleType: DiscountRuleType;

  @Column({ name: 'product_id', nullable: true })
  productId: string;

  @Column({ nullable: true })
  category: string;
}