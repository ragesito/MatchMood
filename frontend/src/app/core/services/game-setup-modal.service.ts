import { Injectable, signal } from '@angular/core';

export type SetupLanguage  = 'javascript' | 'typescript' | 'python' | 'go' | 'rust' | 'java' | 'cpp';
export type SetupDifficulty = 'easy' | 'medium' | 'hard';

@Injectable({ providedIn: 'root' })
export class GameSetupModalService {
  readonly isOpen     = signal(false);
  readonly language   = signal<SetupLanguage>('javascript');
  readonly difficulty = signal<SetupDifficulty>('easy');

  /** callback invoked when the user clicks "Find Match" */
  private _onConfirm: (() => void) | null = null;

  open(onConfirm: () => void): void {
    this._onConfirm = onConfirm;
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  confirm(): void {
    this.isOpen.set(false);
    this._onConfirm?.();
  }
}
