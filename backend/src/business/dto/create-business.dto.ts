import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBusinessDto {
  @ApiProperty({ example: 'My Awesome Salon' })
  @IsString()
  @IsNotEmpty()
  businessName!: string;

  @ApiPropertyOptional({ example: 'The best salon in town.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 'contact@mysalon.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'https://mysalon.com' })
  @IsUrl()
  @IsOptional()
  website?: string;

  @ApiPropertyOptional({ example: 'https://mysalon.com/logo.png' })
  @IsUrl()
  @IsOptional()
  logo?: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @ApiPropertyOptional({ example: 'Suite 100' })
  @IsString()
  @IsOptional()
  addressLine2?: string;

  @ApiProperty({ example: 'New York' })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: 'NY' })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: 'USA' })
  @IsString()
  @IsNotEmpty()
  country!: string;

  @ApiProperty({ example: '10001' })
  @IsString()
  @IsNotEmpty()
  postalCode!: string;

  @ApiProperty({ example: 'America/New_York' })
  @IsString()
  @IsNotEmpty()
  timezone!: string;
}
