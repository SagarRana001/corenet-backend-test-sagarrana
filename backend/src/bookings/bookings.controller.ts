import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('bookings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Roles(Role.CUSTOMER)
  @Post()
  create(@Request() req: any, @Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(req.user.id, createBookingDto);
  }

  @Roles(Role.CUSTOMER)
  @Get('me')
  findAllForCustomer(@Request() req: any) {
    return this.bookingsService.findAllForCustomer(req.user.id);
  }

  @Roles(Role.CUSTOMER)
  @Get(':id')
  findOneForCustomer(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.findOneForCustomer(id, req.user.id);
  }
}
