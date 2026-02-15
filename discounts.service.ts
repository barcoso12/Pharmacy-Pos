import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Discount } from './discount.entity';
import { CreateDiscountDto } from './create-discount.dto';
import { UpdateDiscountDto } from './update-discount.dto';

@Injectable()
export class DiscountsService {
  constructor(
    @InjectRepository(Discount)
    private readonly discountRepository: Repository<Discount>,
  ) {}

  async create(createDiscountDto: CreateDiscountDto) {
    const discount = this.discountRepository.create(createDiscountDto);
    return this.discountRepository.save(discount);
  }

  findAll() {
    return this.discountRepository.find({
      relations: ['discountRules'],
    });
  }

  async findOne(id: string) {
    const discount = await this.discountRepository.findOne({
      where: { id },
      relations: ['discountRules'],
    });
    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }
    return discount;
  }

  async update(id: string, updateDiscountDto: UpdateDiscountDto) {
    const discount = await this.findOne(id);
    Object.assign(discount, updateDiscountDto);
    return this.discountRepository.save(discount);
  }

  async remove(id: string) {
    const discount = await this.findOne(id);
    return this.discountRepository.remove(discount);
  }
}