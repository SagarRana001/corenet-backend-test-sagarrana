import { Test, TestingModule } from '@nestjs/testing';
import { SlotsController } from './slots.controller';
import { SlotsService } from './slots.service';

describe('SlotsController', () => {
  let controller: SlotsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SlotsController],
      providers: [
        {
          provide: SlotsService,
          useValue: {}, // Mock service
        },
      ],
    }).compile();

    controller = module.get<SlotsController>(SlotsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
