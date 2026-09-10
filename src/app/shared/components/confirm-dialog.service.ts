import { Injectable, signal } from '@angular/core';

export interface ConfirmDialogRequest {
  readonly title: string;
  readonly message: string;
  readonly resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  readonly request = signal<ConfirmDialogRequest | null>(null);

  confirm(message: string, title = 'Conferma operazione'): Promise<boolean> {
    return new Promise((resolve) => this.request.set({ title, message, resolve }));
  }

  answer(confirmed: boolean): void {
    const request = this.request();
    if (!request) return;
    this.request.set(null);
    request.resolve(confirmed);
  }
}
