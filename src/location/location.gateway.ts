import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // In production: set to your Flutter/web app domains
  },
  namespace: '/tracking',
})
export class LocationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(LocationGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to tracking gateway: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from tracking gateway: ${client.id}`);
  }

  /**
   * Customer joins a tracking room for their specific job.
   * Flutter Customer App calls this to start receiving live location updates.
   * Event: 'join-job-room'
   * Payload: { jobId: "uuid" }
   */
  @SubscribeMessage('join-job-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    const room = `job-${data.jobId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined tracking room: ${room}`);
    client.emit('joined', { room, message: 'Now receiving live technician location updates' });
  }

  /**
   * Customer leaves the tracking room (e.g. closes the tracking screen).
   * Event: 'leave-job-room'
   */
  @SubscribeMessage('leave-job-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { jobId: string },
  ) {
    const room = `job-${data.jobId}`;
    client.leave(room);
    this.logger.log(`Client ${client.id} left tracking room: ${room}`);
  }

  /**
   * Broadcasts technician location to ALL clients in the job room.
   * Called internally by LocationService when technician updates GPS.
   */
  broadcastLocation(jobId: string, payload: {
    lat: number;
    lng: number;
    heading: number;
    speed_kmh: number;
    status: string;
    technician_name: string;
    updated_at: string;
  }) {
    const room = `job-${jobId}`;
    this.server.to(room).emit('location-update', payload);
    this.logger.debug(`Broadcast location update to room ${room}: lat=${payload.lat}, lng=${payload.lng}`);
  }

  /**
   * Broadcasts "Technician has ARRIVED" event to the job room.
   * Customer app shows an arrival alert/notification.
   */
  broadcastArrival(jobId: string, technicianName: string) {
    const room = `job-${jobId}`;
    this.server.to(room).emit('technician-arrived', {
      message: `${technicianName} has arrived at your location!`,
      arrived_at: new Date().toISOString(),
    });
    this.logger.log(`Technician arrived broadcast sent to room ${room}`);
  }

  /**
   * Broadcasts "Technician is EN_ROUTE" start event.
   * Customer knows tracking has started.
   */
  broadcastEnRoute(jobId: string, technicianName: string) {
    const room = `job-${jobId}`;
    this.server.to(room).emit('technician-en-route', {
      message: `${technicianName} is on the way to your home!`,
      started_at: new Date().toISOString(),
    });
  }
}
