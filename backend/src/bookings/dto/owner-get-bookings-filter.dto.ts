import { IsDateString, IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BookingStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OwnerGetBookingsFilterDto {
  @ApiPropertyOptional({ enum: BookingStatus })
  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
