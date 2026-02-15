import { Test, TestingModule } from '@nestjs/testing';
import { SalesService } from './sales.service';
import { DiscountsService } from './discounts.service';

describe('SalesService', () => {
  let service: SalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesService,
        {
          provide: DiscountsService,
          useValue: {
            findAll: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SalesService>(SalesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});