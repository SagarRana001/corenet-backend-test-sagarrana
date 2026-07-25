import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetSlotsDto } from './dto/get-slots.dto';
import { DayOfWeek, Role } from '@prisma/client';

export interface Slot {
  startTime: string;
  endTime: string;
  available: boolean;
}

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Convert "HH:mm" to minutes since midnight
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper: Convert minutes since midnight to "HH:mm"
  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  // Helper: Get DayOfWeek enum from YYYY-MM-DD
  private getDayOfWeek(dateString: string): DayOfWeek {
    const date = new Date(dateString);
    const days = [
      DayOfWeek.SUNDAY,
      DayOfWeek.MONDAY,
      DayOfWeek.TUESDAY,
      DayOfWeek.WEDNESDAY,
      DayOfWeek.THURSDAY,
      DayOfWeek.FRIDAY,
      DayOfWeek.SATURDAY,
    ];
    // getUTCDay() avoids timezone shift issues since the date string is YYYY-MM-DD
    return days[date.getUTCDay()];
  }

  // Helper: Generate raw slots from availability windows
  private generateRawSlots(
    availability: { startTime: string; endTime: string }[],
    durationMinutes: number,
  ): Slot[] {
    const slots: Slot[] = [];

    for (const window of availability) {
      let currentMinutes = this.timeToMinutes(window.startTime);
      const endMinutes = this.timeToMinutes(window.endTime);

      while (currentMinutes + durationMinutes <= endMinutes) {
        slots.push({
          startTime: this.minutesToTime(currentMinutes),
          endTime: this.minutesToTime(currentMinutes + durationMinutes),
          available: true,
        });
        currentMinutes += durationMinutes;
      }
    }

    // Sort slots by start time
    slots.sort((a, b) => (a.startTime > b.startTime ? 1 : -1));
    return slots;
  }

  // Helper: Check if slot overlaps with any booking
  private isOverlapping(
    slotStart: string,
    slotEnd: string,
    bookings: { startTime: string; endTime: string }[],
  ): boolean {
    const s1 = this.timeToMinutes(slotStart);
    const e1 = this.timeToMinutes(slotEnd);

    for (const b of bookings) {
      const s2 = this.timeToMinutes(b.startTime);
      const e2 = this.timeToMinutes(b.endTime);

      if (Math.max(s1, s2) < Math.min(e1, e2)) {
        return true; // Overlap detected
      }
    }
    return false;
  }

  async getSlots(
    serviceId: string,
    getSlotsDto: GetSlotsDto,
    userId: string,
    userRole: Role,
  ) {
    const { date } = getSlotsDto;

    // Validate date is not in the past (using UTC to prevent timezone issues)
    const requestDate = new Date(date);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    if (requestDate < today) {
      throw new BadRequestException('Date cannot be in the past');
    }

    // 1. Fetch the service and verify it exists and is active
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        business: true,
      },
    });

    if (!service || !service.isActive) {
      throw new NotFoundException('Service not found or inactive');
    }

    if (!service.business.isActive) {
      throw new NotFoundException('Business is inactive');
    }

    // 2. Authorization check if requested by an OWNER
    if (userRole === Role.OWNER) {
      if (service.business.ownerId !== userId) {
        throw new ForbiddenException(
          'You can only view slots for your own business services',
        );
      }
    }

    // 3. Find availability for this business on the requested day of the week
    const targetDay = this.getDayOfWeek(date);
    const availabilityWindows = await this.prisma.availability.findMany({
      where: {
        businessId: service.businessId,
        dayOfWeek: targetDay,
        isAvailable: true,
      },
    });

    if (availabilityWindows.length === 0) {
      return {
        date,
        serviceId,
        durationMinutes: service.durationMinutes,
        slots: [],
      };
    }

    // 4. Generate all possible raw slots based on service duration
    let rawSlots = this.generateRawSlots(
      availabilityWindows,
      service.durationMinutes,
    );

    // 5. Fetch confirmed bookings for this service on this date
    const bookings = await this.prisma.booking.findMany({
      where: {
        serviceId,
        date,
        status: 'CONFIRMED',
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // 6. Filter out overlapping slots
    if (bookings.length > 0) {
      rawSlots = rawSlots.filter(
        (slot) => !this.isOverlapping(slot.startTime, slot.endTime, bookings),
      );
    }

    return {
      date,
      serviceId,
      durationMinutes: service.durationMinutes,
      slots: rawSlots,
    };
  }
}
