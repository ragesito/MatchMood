import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private socket: Socket | null = null;

  constructor(private authService: AuthService) {}

  connect(): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.apiUrl, {
      auth: { token: this.authService.getToken() },
    });

    this.socket.on('connect', () => console.log('Socket connected'));
    this.socket.on('disconnect', () => console.log('Socket disconnected'));
    this.socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
  }

  // Join the matchmaking queue
  joinQueue(): void {
    this.socket?.emit('match:join_queue');
  }

  // Send code update to opponent
  sendCodeUpdate(roomId: string, code: string): void {
    this.socket?.emit('match:code_update', { roomId, code });
  }

  // Listen for events
  on<T>(event: string, callback: (data: T) => void): void {
    this.socket?.on(event, callback);
  }

  off(event: string): void {
    this.socket?.off(event);
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }
}
