import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+91|91)?[6-9]\d{9}$/, { message: 'Phone number must be a valid Indian mobile number' })
  phone: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP received via SMS' })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Name of the user if registering for the first time' })
  @IsOptional()
  @IsString()
  name?: string;
}
