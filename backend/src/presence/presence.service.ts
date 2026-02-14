import { Injectable } from '@nestjs/common';

/**
 * In-memory presence: tracks socket id -> userId for connected notification clients.
 * Used to expose "online now" count. NotificationsGateway registers on connect/disconnect.
 */
@Injectable()
export class PresenceService {
  private socketToUser = new Map<string, string>();

  add(socketId: string, userId: string) {
    this.socketToUser.set(socketId, userId);
  }

  remove(socketId: string) {
    this.socketToUser.delete(socketId);
  }

  getOnlineCount(): number {
    return new Set(this.socketToUser.values()).size;
  }
}
