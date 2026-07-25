import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AvailabilityService {
  constructor(private readonly prisma: PrismaService) {}

  private async getBusinessProfile(ownerId: string) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { ownerId },
    });

    if (!profile) {
      throw new NotFoundException('Business profile not found');
    }

    return profile;
  }

  private validateTimeRange(startTime: string, endTime: string) {
    if (startTime >= endTime) {
      throw new BadRequestException('startTime must be earlier than endTime');
    }
  }

  private checkOverlap(
    start1: string,
    end1: string,
    start2: string,
    end2: string,
  ) {
    return start1 < end2 && start2 < end1;
  }

  async create(ownerId: string, createAvailabilityDto: CreateAvailabilityDto) {
    const business = await this.getBusinessProfile(ownerId);
    
    this.validateTimeRange(
      createAvailabilityDto.startTime,
      createAvailabilityDto.endTime,
    );

    // Fetch existing windows for the same day
    const existingWindows = await this.prisma.availability.findMany({
      where: {
        businessId: business.id,
        dayOfWeek: createAvailabilityDto.dayOfWeek,
        isAvailable: true,
      },
    });

    // Check for overlap
    for (const window of existingWindows) {
      if (
        this.checkOverlap(
          createAvailabilityDto.startTime,
          createAvailabilityDto.endTime,
          window.startTime,
          window.endTime,
        )
      ) {
        throw new ConflictException(
          'Availability window overlaps with an existing one on this day',
        );
      }
    }

    return this.prisma.availability.create({
      data: {
        ...createAvailabilityDto,
        businessId: business.id,
      },
    });
  }

  async findAll(ownerId: string) {
    const business = await this.getBusinessProfile(ownerId);

    return this.prisma.availability.findMany({
      where: {
        businessId: business.id,
        isAvailable: true,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async findOne(id: string, ownerId: string) {
    const business = await this.getBusinessProfile(ownerId);

    const availability = await this.prisma.availability.findFirst({
      where: {
        id,
        businessId: business.id,
        isAvailable: true,
      },
    });

    if (!availability) {
      throw new NotFoundException('Availability window not found');
    }

    return availability;
  }

  async update(id: string, ownerId: string, updateAvailabilityDto: UpdateAvailabilityDto) {
    const availability = await this.findOne(id, ownerId);

    const newStartTime = updateAvailabilityDto.startTime ?? availability.startTime;
    const newEndTime = updateAvailabilityDto.endTime ?? availability.endTime;
    const newDayOfWeek = updateAvailabilityDto.dayOfWeek ?? availability.dayOfWeek;

    this.validateTimeRange(newStartTime, newEndTime);

    // Fetch existing windows for the target day, excluding the current one
    const existingWindows = await this.prisma.availability.findMany({
      where: {
        businessId: availability.businessId,
        dayOfWeek: newDayOfWeek,
        isAvailable: true,
        id: { not: availability.id },
      },
    });

    // Check for overlap
    for (const window of existingWindows) {
      if (
        this.checkOverlap(
          newStartTime,
          newEndTime,
          window.startTime,
          window.endTime,
        )
      ) {
        throw new ConflictException(
          'Updated availability window overlaps with an existing one on this day',
        );
      }
    }

    return this.prisma.availability.update({
      where: { id: availability.id },
      data: updateAvailabilityDto,
    });
  }

  async remove(id: string, ownerId: string) {
    const availability = await this.findOne(id, ownerId);

    return this.prisma.availability.update({
      where: { id: availability.id },
      data: { isAvailable: false },
    });
  }
}
