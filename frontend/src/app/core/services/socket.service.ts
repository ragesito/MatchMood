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

  // Listen for an event. Returns a teardown that removes *this* handler, so a
  // component can unregister exactly what it added (via takeUntilDestroyed or a
  // teardown list) instead of maintaining a hand-written event-name list that
  // drifts out of sync with the registrations.
  on<T>(event: string, callback: (data: T) => void): () => void {
    this.socket?.on(event, callback as (...args: unknown[]) => void);
    return () => this.socket?.off(event, callback as (...args: unknown[]) => void);
  }

  off(event: string): void {
    this.socket?.off(event);
  }

  emit(event: string, data?: unknown): void {
    this.socket?.emit(event, data);
  }
}
