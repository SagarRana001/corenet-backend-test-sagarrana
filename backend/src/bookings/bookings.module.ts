import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { OwnerBookingsController } from './owner-bookings.controller';
import { SlotsModule } from '../slots/slots.module';

@Module({
  imports: [SlotsModule],
  providers: [BookingsService],
  controllers: [BookingsController, OwnerBookingsController]
})
export class BookingsModule {}
