import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { DiscountRule } from './discount-rule.entity';

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED = 'FIXED',
  BUY_X_TAKE_Y = 'BUY_X_TAKE_Y',
  BUNDLE = 'BUNDLE',
}

@Entity('discounts')
export class Discount {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  code: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: DiscountType,
  })
  type: DiscountType;

  @Column('decimal', { precision: 15, scale: 4 })
  value: number;

  @Column({ name: 'start_date', type: 'timestamp with time zone', nullable: true })
  startDate: Date;

  @Column({ name: 'end_date', type: 'timestamp with time zone', nullable: true })
  endDate: Date;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'jsonb', nullable: true })
  rules: Record<string, any>;

  @OneToMany(() => DiscountRule, (rule) => rule.discount, { cascade: true })
  discountRules: DiscountRule[];
}