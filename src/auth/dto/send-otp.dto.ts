import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '9876543210', description: '10-digit Indian mobile number' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^(\+91|91)?[6-9]\d{9}$/, { message: 'Phone number must be a valid Indian mobile number (e.g. 9876543210 or +919876543210)' })
  phone: string;
}
