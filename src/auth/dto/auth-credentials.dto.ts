import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'JWT refresh token string' })
  @IsNotEmpty()
  @IsString()
  refresh_token: string;
}

export class TechnicianLoginDto {
  @ApiProperty({ example: '9876543210' })
  @IsNotEmpty()
  @IsString()
  phone: string;

  @ApiProperty({ example: 'TechPassword123!' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@homemaintenance.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'AdminPassword123!' })
  @IsNotEmpty()
  @IsString()
  password: string;
}
