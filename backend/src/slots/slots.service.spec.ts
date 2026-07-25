import { Test, TestingModule } from '@nestjs/testing';
import { SlotsService } from './slots.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SlotsService', () => {
  let service: SlotsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotsService,
        {
          provide: PrismaService,
          useValue: {
            service: { findUnique: jest.fn() },
            availability: { findMany: jest.fn() },
            booking: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<SlotsService>(SlotsService);
  });

  describe('generateRawSlots', () => {
    it('should generate correctly spaced slots for a given duration', () => {
      const availabilities = [
        { startTime: '09:00', endTime: '12:00' } as any,
      ];
      
      const slots = service.generateRawSlots(availabilities, 60);
      
      expect(slots).toEqual([
        { startTime: '09:00', endTime: '10:00', available: true },
        { startTime: '10:00', endTime: '11:00', available: true },
        { startTime: '11:00', endTime: '12:00', available: true },
      ]);
    });

    it('should not generate a slot if the remaining time is less than duration', () => {
      const availabilities = [
        { startTime: '09:00', endTime: '10:30' } as any,
      ];
      
      const slots = service.generateRawSlots(availabilities, 60);
      
      expect(slots).toEqual([
        { startTime: '09:00', endTime: '10:00', available: true },
      ]);
    });
  });

  describe('isOverlapping', () => {
    it('should return true when a booking completely overlaps a slot', () => {
      const slot = { startTime: '10:00', endTime: '11:00', available: true };
      const booking = { startTime: '10:00', endTime: '11:00' } as any;
      
      expect(service['isOverlapping'](slot.startTime, slot.endTime, [booking])).toBe(true);
    });

    it('should return true when a booking starts inside a slot', () => {
      const slot = { startTime: '10:00', endTime: '11:00', available: true };
      const booking = { startTime: '10:30', endTime: '11:30' } as any;
      
      expect(service['isOverlapping'](slot.startTime, slot.endTime, [booking])).toBe(true);
    });

    it('should return false when a booking ends exactly when a slot begins', () => {
      const slot = { startTime: '10:00', endTime: '11:00', available: true };
      const booking = { startTime: '09:00', endTime: '10:00' } as any;
      
      expect(service['isOverlapping'](slot.startTime, slot.endTime, [booking])).toBe(false);
    });
  });
});
