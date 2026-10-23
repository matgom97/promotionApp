import {
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';

import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-revoke-member-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './revoke-member-modal.component.html',
  styleUrl: './revoke-member-modal.component.scss',
})
export class RevokeMemberModalComponent {
  @Input({ required: true }) memberName = '';
  @Input() revoking = false;

  @Output() cancelled = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  readonly confirmationRequested = signal(false);

  close(): void {
    if (this.revoking) {
      return;
    }

    this.cancelled.emit();
  }

  confirm(): void {
    if (this.revoking || this.confirmationRequested()) {
      return;
    }

    this.confirmationRequested.set(true);
    this.confirmed.emit();
  }
}