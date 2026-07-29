import { Module } from '@nestjs/common';
import { LocationController, TrackingController } from './location.controller';
import { LocationService } from './location.service';
import { LocationGateway } from './location.gateway';

@Module({
  controllers: [LocationController, TrackingController],
  providers: [LocationService, LocationGateway],
  exports: [LocationService, LocationGateway],
})
export class LocationModule {}
