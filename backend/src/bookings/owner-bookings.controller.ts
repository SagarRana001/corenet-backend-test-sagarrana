import { Controller, Get, Patch, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { OwnerGetBookingsFilterDto } from './dto/owner-get-bookings-filter.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('owner/bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('owner/bookings')
export class OwnerBookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Roles(Role.OWNER)
  @Get()
  findAllForOwner(
    @Request() req: any,
    @Query() filters: OwnerGetBookingsFilterDto,
  ) {
    return this.bookingsService.findAllForOwner(req.user.id, filters);
  }

  @Roles(Role.OWNER)
  @Get(':id')
  findOneForOwner(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.findOneForOwner(id, req.user.id);
  }

  @Roles(Role.OWNER)
  @Patch(':id/status')
  updateBookingStatus(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateBookingStatusDto: UpdateBookingStatusDto,
  ) {
    return this.bookingsService.updateBookingStatusForOwner(
      id,
      req.user.id,
      updateBookingStatusDto.status,
    );
  }
}
