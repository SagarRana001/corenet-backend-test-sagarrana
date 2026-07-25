import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { SlotsService } from '../slots/slots.service';
import { Prisma, Role, BookingStatus } from '@prisma/client';

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

  async findAllForCustomer(customerId: string, filters: import('./dto/get-bookings-filter.dto').GetBookingsFilterDto) {
    const { status, fromDate, toDate, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.BookingWhereInput = { customerId };

    if (status) {
      whereClause.status = status;
    }

    if (fromDate || toDate) {
      whereClause.bookingDate = {};
      if (fromDate) whereClause.bookingDate.gte = fromDate;
      if (toDate) whereClause.bookingDate.lte = toDate;
    }

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          service: {
            select: { name: true, durationMinutes: true, price: true, currency: true },
          },
          business: {
            select: { businessName: true },
          },
        },
        orderBy: [
          { bookingDate: 'desc' },
          { startTime: 'desc' },
        ],
      }),
      this.prisma.booking.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

  async cancelBooking(id: string, customerId: string) {
    const booking = await this.findOneForCustomer(id, customerId);

    if (['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(booking.status)) {
      throw new BadRequestException(`Cannot cancel a booking that is ${booking.status}`);
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return { message: 'Booking cancelled successfully', booking: updated };
  }
  async findAllForOwner(ownerId: string, filters: import('./dto/owner-get-bookings-filter.dto').OwnerGetBookingsFilterDto) {
    const business = await this.prisma.businessProfile.findUnique({
      where: { ownerId },
    });

    if (!business) {
      throw new NotFoundException('Business profile not found');
    }

    const { status, date, serviceId, page = 1, limit = 10 } = filters;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.BookingWhereInput = { businessId: business.id };

    if (status) whereClause.status = status;
    if (date) whereClause.bookingDate = date;
    if (serviceId) whereClause.serviceId = serviceId;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where: whereClause,
        skip,
        take: limit,
        include: {
          service: {
            select: { name: true, durationMinutes: true, price: true, currency: true },
          },
          customer: {
            select: { fullName: true, email: true },
          },
        },
        orderBy: [
          { bookingDate: 'desc' },
          { startTime: 'desc' },
        ],
      }),
      this.prisma.booking.count({ where: whereClause }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneForOwner(id: string, ownerId: string) {
    const business = await this.prisma.businessProfile.findUnique({
      where: { ownerId },
    });

    if (!business) {
      throw new NotFoundException('Business profile not found');
    }

    const booking = await this.prisma.booking.findFirst({
      where: {
        id,
        businessId: business.id,
      },
      include: {
        service: true,
        customer: {
          select: { fullName: true, email: true },
        },
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    return booking;
  }

  async updateBookingStatusForOwner(id: string, ownerId: string, status: BookingStatus) {
    const booking = await this.findOneForOwner(id, ownerId);

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Cannot modify a cancelled booking');
    }

    const updated = await this.prisma.booking.update({
      where: { id },
      data: { status },
    });

    return { message: 'Booking status updated successfully', booking: updated };
  }
}
