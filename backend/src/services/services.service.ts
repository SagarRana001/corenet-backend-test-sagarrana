import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServicesService {
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

  async create(ownerId: string, createServiceDto: CreateServiceDto) {
    const business = await this.getBusinessProfile(ownerId);

    try {
      return await this.prisma.service.create({
        data: {
          ...createServiceDto,
          businessId: business.id,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Service with this name already exists for your business',
        );
      }
      throw error;
    }
  }

  async findAll(ownerId: string) {
    const business = await this.getBusinessProfile(ownerId);

    return this.prisma.service.findMany({
      where: {
        businessId: business.id,
        isActive: true,
      },
    });
  }

  async findOne(id: string, ownerId: string) {
    const business = await this.getBusinessProfile(ownerId);

    const service = await this.prisma.service.findFirst({
      where: {
        id,
        businessId: business.id,
        isActive: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async update(id: string, ownerId: string, updateServiceDto: UpdateServiceDto) {
    const service = await this.findOne(id, ownerId);

    try {
      return await this.prisma.service.update({
        where: { id: service.id },
        data: updateServiceDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Service with this name already exists for your business',
        );
      }
      throw error;
    }
  }

  async remove(id: string, ownerId: string) {
    const service = await this.findOne(id, ownerId);

    return this.prisma.service.update({
      where: { id: service.id },
      data: { isActive: false },
    });
  }
}
