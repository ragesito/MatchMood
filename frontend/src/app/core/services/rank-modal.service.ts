import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RankModalService {
  readonly rating = signal(0);
  readonly isOpen = signal(false);

  open(rating: number): void {
    this.rating.set(rating);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
