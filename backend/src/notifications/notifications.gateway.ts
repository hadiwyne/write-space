import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PresenceService } from '../presence/presence.service';

interface SocketClient {
  id: string;
  join: (room: string) => void;
  disconnect: () => void;
  handshake: { auth?: { token?: string }; query?: { token?: string | string[] } };
}

@WebSocketGateway({ cors: true, namespace: '/notifications' })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userIdBySocketId = new Map<string, string>();

  constructor(
    private jwt: JwtService,
    private config: ConfigService,
    private presence: PresenceService,
  ) { }

  async handleConnection(client: SocketClient) {
    const raw =
      client.handshake?.auth?.token ??
      client.handshake?.query?.token ??
      (Array.isArray(client.handshake?.query?.token) ? client.handshake.query.token[0] : undefined);
    const token = typeof raw === 'string' ? raw : raw?.[0];
    if (!token) {
      client.disconnect();
      return;
    }
    try {
      const secret = this.config.get<string>('JWT_SECRET') || 'writespace-dev-secret-change-in-production';
      const payload = this.jwt.verify(token, { secret });
      const userId = payload?.sub;
      if (userId) {
        console.log(`[Presence] User connected: ${userId} (${client.id})`);
        this.userIdBySocketId.set(client.id, userId);
        this.presence.add(client.id, userId);
        client.join(`user:${userId}`);
      } else {
        console.warn(`[Presence] Connection rejected: No userId in token`);
        client.disconnect();
      }
    } catch (err: any) {
      console.error(`[Presence] Connection error:`, err?.message || err);
      client.disconnect();
    }
  }

  handleDisconnect(client: SocketClient) {
    const userId = this.userIdBySocketId.get(client.id);
    console.log(`[Presence] User disconnected: ${userId || 'unknown'} (${client.id})`);
    this.presence.remove(client.id);
    this.userIdBySocketId.delete(client.id);
  }

  emitToUser(userId: string, event: string, payload: unknown) {
    this.server.to(`user:${userId}`).emit(event, payload);
  }

  @SubscribeMessage('ping')
  handlePing() {
    return { event: 'pong' };
  }
}
