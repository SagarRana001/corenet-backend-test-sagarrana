import { IsEnum, IsNotEmpty } from 'class-validator';
import { BookingStatus } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateBookingStatusDto {
  @ApiProperty({ enum: ['CONFIRMED', 'COMPLETED', 'NO_SHOW'] })
  @IsNotEmpty()
  @IsEnum(['CONFIRMED', 'COMPLETED', 'NO_SHOW'])
  status!: BookingStatus;
}
