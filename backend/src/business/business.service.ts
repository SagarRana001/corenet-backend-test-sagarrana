import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  async create(ownerId: string, createBusinessDto: CreateBusinessDto) {
    const existingProfile = await this.prisma.businessProfile.findUnique({
      where: { ownerId },
    });

    if (existingProfile) {
      throw new ConflictException('Owner already has a business profile');
    }

    return this.prisma.businessProfile.create({
      data: {
        ...createBusinessDto,
        ownerId,
      },
    });
  }

  async getProfile(ownerId: string) {
    const profile = await this.prisma.businessProfile.findUnique({
      where: { ownerId },
    });

    if (!profile || !profile.isActive) {
      throw new NotFoundException('Business profile not found');
    }

    return profile;
  }

  async updateProfile(ownerId: string, updateBusinessDto: UpdateBusinessDto) {
    const profile = await this.getProfile(ownerId); // Ensure it exists and is active

    return this.prisma.businessProfile.update({
      where: { ownerId },
      data: updateBusinessDto,
    });
  }

  async softDeleteProfile(ownerId: string) {
    await this.getProfile(ownerId); // Ensure it exists and is active

    return this.prisma.businessProfile.update({
      where: { ownerId },
      data: { isActive: false },
    });
  }
}
