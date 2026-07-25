import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  @IsNotEmpty()
  serviceId!: string;

  @ApiProperty({ example: '2026-08-01' })
  @IsDateString()
  @IsNotEmpty()
  bookingDate!: string;

  @ApiProperty({ example: '10:30' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: 'startTime must be in HH:mm format' })
  startTime!: string;

  @ApiProperty({ example: 'First consultation', required: false })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}
