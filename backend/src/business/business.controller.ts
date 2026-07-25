import { Controller, Get, Post, Body, Patch, Delete, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { BusinessService } from './business.service';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('business')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  create(@Request() req: any, @Body() createBusinessDto: CreateBusinessDto) {
    return this.businessService.create(req.user.id, createBusinessDto);
  }

  @Get('me')
  getProfile(@Request() req: any) {
    return this.businessService.getProfile(req.user.id);
  }

  @Patch('me')
  update(@Request() req: any, @Body() updateBusinessDto: UpdateBusinessDto) {
    return this.businessService.updateProfile(req.user.id, updateBusinessDto);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete('me')
  remove(@Request() req: any) {
    return this.businessService.softDeleteProfile(req.user.id);
  }
}
