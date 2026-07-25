import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SlotsService } from '../slots/slots.service';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slotsService: SlotsService,
  ) {}

  async create(customerId: string, createBookingDto: CreateBookingDto) {
    const { serviceId, bookingDate, startTime, notes } = createBookingDto;

    // 1. Validate service exists and is active
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: { business: true },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or inactive');
    }

    if (!service.business.isActive) {
      throw new NotFoundException('Business is inactive');
    }

    // 2. Reuse SlotsService to generate valid, available slots for this date
    // Note: We pass Role.CUSTOMER to bypass ownership checks
    const slotsData = await this.slotsService.getSlots(
      serviceId,
      { date: bookingDate },
      customerId,
      Role.CUSTOMER,
    );

    // 3. Verify the requested startTime is exactly one of the generated slots and is available
    const requestedSlot = slotsData.slots.find(
      (slot) => slot.startTime === startTime,
    );

    if (!requestedSlot) {
      throw new BadRequestException(
        'Requested time is outside business hours or invalid for this service',
      );
    }

    if (!requestedSlot.available) {
      throw new ConflictException('Slot is no longer available');
    }

    // 4. Create the booking inside a Serializable transaction to prevent race conditions
    try {
      const result = await this.prisma.$transaction(
        async (tx) => {
          // Double-check overlap inside transaction lock (optional but safe)
          const overlappingBooking = await tx.booking.findFirst({
            where: {
              businessId: service.businessId,
              bookingDate,
              startTime,
              status: { in: ['CONFIRMED', 'PENDING'] },
            },
          });

          if (overlappingBooking) {
            throw new ConflictException('Slot was just booked by someone else');
          }

          const newBooking = await tx.booking.create({
            data: {
              customerId,
              businessId: service.businessId,
              serviceId,
              bookingDate,
              startTime,
              endTime: requestedSlot.endTime,
              notes,
              status: 'CONFIRMED',
            },
          });

          return newBooking;
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        },
      );

      return {
        message: 'Booking created successfully',
        booking: result,
      };
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002: Unique constraint failed
        if (error.code === 'P2002') {
          throw new ConflictException('Slot was just booked by someone else');
        }
      }
      throw error;
    }
  }

  async findAllForCustomer(customerId: string) {
    return this.prisma.booking.findMany({
      where: { customerId },
      include: {
        service: {
          select: { name: true, durationMinutes: true, price: true },
        },
        business: {
          select: { businessName: true },
        },
      },
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'desc' },
      ],
    });
  }

  async findOneForCustomer(id: string, customerId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        id,
        customerId,
      },
      include: {
        service: true,
        business: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }
}
