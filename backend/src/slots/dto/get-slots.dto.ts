import { IsDateString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetSlotsDto {
  @ApiProperty({ example: '2026-07-30' })
  @IsDateString()
  @IsNotEmpty()
  date!: string;
}
