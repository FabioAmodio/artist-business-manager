import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { TrashService, type TrashEntry } from '../../application/trash/trash.service';
import { PageHeaderComponent } from '../../shared/components/page-header.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, PageHeaderComponent],
  selector: 'app-trash-page',
  templateUrl: './trash-page.html',
  styleUrl: './trash-page.scss',
})
export class TrashPage implements OnInit {
  private readonly service = inject(TrashService);
  protected readonly entries = signal<readonly TrashEntry[]>([]);
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());
  protected readonly loading = signal(true);
  protected readonly busy = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly successMessage = signal('');

  ngOnInit(): void { void this.load(); }

  protected isSelected(entry: TrashEntry): boolean { return this.selectedIds().has(this.key(entry)); }
  protected allSelected(): boolean { return this.entries().length > 0 && this.selectedIds().size === this.entries().length; }
  protected toggle(entry: TrashEntry): void {
    const selected = new Set(this.selectedIds());
    const key = this.key(entry);
    if (selected.has(key)) selected.delete(key); else selected.add(key);
    this.selectedIds.set(selected);
  }
  protected toggleAll(): void {
    this.selectedIds.set(this.allSelected() ? new Set() : new Set(this.entries().map((entry) => this.key(entry))));
  }
  protected async restore(entry: TrashEntry): Promise<void> { await this.runAction([entry], false); }
  protected async deletePermanent(entry: TrashEntry): Promise<void> {
    if (!window.confirm(`Eliminare definitivamente "${entry.label}"?`)) return;
    await this.runAction([entry], true);
  }
  protected async restoreSelected(): Promise<void> { await this.runAction(this.selectedEntries(), false); }
  protected async deleteSelected(): Promise<void> {
    const selected = this.selectedEntries();
    if (!selected.length || !window.confirm(`Eliminare definitivamente ${selected.length} elementi?`)) return;
    await this.runAction(selected, true);
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try { this.entries.set(await this.service.list()); }
    catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile caricare il cestino.'); }
    finally { this.loading.set(false); }
  }
  private selectedEntries(): readonly TrashEntry[] { const selected = this.selectedIds(); return this.entries().filter((entry) => selected.has(this.key(entry))); }
  private async runAction(entries: readonly TrashEntry[], permanent: boolean): Promise<void> {
    if (!entries.length) return;
    this.busy.set(true); this.errorMessage.set(''); this.successMessage.set('');
    try {
      for (const entry of entries) { if (permanent) await this.service.deletePermanent(entry); else await this.service.restore(entry); }
      this.successMessage.set(permanent ? 'Elementi eliminati definitivamente.' : 'Elementi ripristinati.');
      this.selectedIds.set(new Set());
      await this.load();
    } catch (error) { this.errorMessage.set(error instanceof Error ? error.message : 'Impossibile completare l\'operazione.'); }
    finally { this.busy.set(false); }
  }
  private key(entry: TrashEntry): string { return `${entry.collection}:${entry.id}`; }
}
