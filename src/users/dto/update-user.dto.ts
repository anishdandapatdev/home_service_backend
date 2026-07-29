import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Anish Dandapat' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'anish@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;
}
