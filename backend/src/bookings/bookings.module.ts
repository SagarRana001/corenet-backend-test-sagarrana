import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { SlotsModule } from '../slots/slots.module';

@Module({
  imports: [SlotsModule],
  providers: [BookingsService],
  controllers: [BookingsController]
})
export class BookingsModule {}
