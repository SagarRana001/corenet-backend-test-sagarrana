import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { GetSlotsDto } from './dto/get-slots.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiBearerAuth, ApiTags, ApiQuery } from '@nestjs/swagger';

@ApiTags('slots')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('services')
export class SlotsController {
  constructor(private readonly slotsService: SlotsService) {}

  @Get(':serviceId/slots')
  @ApiQuery({ name: 'date', required: true, example: '2026-07-30' })
  getSlots(
    @Request() req: any,
    @Param('serviceId') serviceId: string,
    @Query() getSlotsDto: GetSlotsDto,
  ) {
    return this.slotsService.getSlots(
      serviceId,
      getSlotsDto,
      req.user.id,
      req.user.role,
    );
  }
}
