import { Injectable, inject } from '@angular/core';
import { FairTaskRepository } from '../../core/repositories/fair-task.repository';
import type { FairSeriesTaskTemplateItem, FairTaskKind } from '../../domain/models/fair';
import type { FairTask, FairTaskStatus } from '../../domain/models/fair-task';
import { GLOBAL_DEFAULT_TEMPLATE, HOTEL_TASK_KINDS, allDescendantKindsOf, buildDefaultFairTasks, dependentKindsOf } from '../../domain/shared/fair-task-template';
import { NotificationService } from '../notifications/notification.service';

export type FairTaskInput = Pick<FairTask, 'kind' | 'title' | 'contactRole' | 'partyId' | 'contactChannel' | 'contactMethodId' | 'contactInfo' | 'dueDate' | 'notes'>;

@Injectable({ providedIn: 'root' })
export class FairTaskService {
  private readonly repository = inject(FairTaskRepository);
  private readonly notifications = inject(NotificationService);

  listByFairEdition(fairEditionId: string): Promise<readonly FairTask[]> {
    return this.repository.listByFairEdition(fairEditionId);
  }

  /** Tutte le attivita non eliminate, di qualunque edizione: usata dalla pagina Scadenze per affiancare le attivita in corso ai lavori. */
  listAll(): Promise<readonly FairTask[]> {
    return this.repository.listAll();
  }

  /** Genera le attivita guida mancanti (per kind) senza toccare quelle gia esistenti: puo essere richiamata piu volte in sicurezza anche dopo aver aggiunto task liberi.
   * Se e' nota l'edizione precedente della stessa serie, propone lo stesso contatto gia' usato per hotel/organizzatore. */
  async createDefaults(fairEditionId: string, seriesTemplate?: readonly FairSeriesTaskTemplateItem[], previousFairEditionId?: string): Promise<readonly FairTask[]> {
    const existing = await this.repository.listByFairEdition(fairEditionId);
    const existingKinds = new Set(existing.map((task) => task.kind));
    const completedKinds = new Set(existing.filter((task) => task.status === 'done').map((task) => task.kind));
    const previousTasks = previousFairEditionId ? await this.repository.listByFairEdition(previousFairEditionId) : undefined;
    const template = buildDefaultFairTasks(fairEditionId, new Date().toISOString(), seriesTemplate, previousTasks, completedKinds).filter((task) => !existingKinds.has(task.kind));
    for (const task of template) await this.repository.save(task);
    if (template.length) this.triggerNotificationRecalculation();
    return [...existing, ...template];
  }

  /** Sblocca automaticamente le attivita standard dipendenti dalla kind appena completata (es. Fatta 'contact-organizer' propone 'await-reply').
   * Il contatto del task padre viene proposto anche sul figlio (stesso ruolo organizzatore/hotel): resta comunque modificabile. */
  async unlockDependentTasks(fairEditionId: string, completedKind: FairTaskKind, seriesTemplate?: readonly FairSeriesTaskTemplateItem[]): Promise<readonly FairTask[]> {
    const dependents = dependentKindsOf(completedKind);
    if (!dependents.length) return [];
    const existing = await this.repository.listByFairEdition(fairEditionId);
    const existingKinds = new Set(existing.map((task) => task.kind));
    const parent = existing.find((task) => task.kind === completedKind);
    const parentIsHotel = parent ? HOTEL_TASK_KINDS.has(parent.kind) : false;
    const template = seriesTemplate?.length ? seriesTemplate : GLOBAL_DEFAULT_TEMPLATE;
    const now = new Date().toISOString();
    const created: FairTask[] = [];
    for (const item of template) {
      if (!dependents.includes(item.kind) || existingKinds.has(item.kind)) continue;
      const childIsHotel = HOTEL_TASK_KINDS.has(item.kind);
      const inheritContact = parent && parentIsHotel === childIsHotel;
      const task: FairTask = {
        id: crypto.randomUUID(), fairEditionId, kind: item.kind, title: item.title, status: item.defaultStatus ?? 'pending', notes: item.defaultNotes,
        contactRole: childIsHotel ? 'hotel' : 'organizer',
        partyId: inheritContact ? parent.partyId : undefined,
        contactChannel: inheritContact ? parent.contactChannel : undefined,
        contactMethodId: inheritContact ? parent.contactMethodId : undefined,
        createdAt: now, updatedAt: now,
      };
      await this.repository.save(task);
      created.push(task);
    }
    if (created.length) this.triggerNotificationRecalculation();
    return created;
  }

  async create(fairEditionId: string, input: FairTaskInput): Promise<FairTask> {
    const now = new Date().toISOString();
    const task: FairTask = { id: crypto.randomUUID(), fairEditionId, status: 'pending', ...input, createdAt: now, updatedAt: now };
    await this.repository.save(task);
    this.triggerNotificationRecalculation();
    return task;
  }

  async update(id: string, input: FairTaskInput): Promise<FairTask> {
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Attivita non trovata.');
    const task: FairTask = { ...existing, ...input, updatedAt: new Date().toISOString() };
    await this.repository.save(task);
    this.triggerNotificationRecalculation();
    return task;
  }

  /** Fatta/Da non fare/cancellazione di una kind prerequisita si propaga a tutta la genealogia dipendente (figli, nipoti, ...). */
  async setStatus(id: string, status: FairTaskStatus): Promise<readonly FairTask[]> {
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Attivita non trovata.');
    const now = new Date().toISOString();
    const task: FairTask = { ...existing, status, statusChangedAt: now, updatedAt: now };
    await this.repository.save(task);
    const affected: FairTask[] = [task];
    if (status === 'not-needed') affected.push(...await this.cascadeNotNeeded(existing.fairEditionId, existing.kind, now));
    this.triggerNotificationRecalculation();
    return affected;
  }

  async delete(id: string): Promise<void> {
    const existing = await this.repository.getById(id);
    await this.repository.softDelete(id);
    if (existing) await this.cascadeDelete(existing.fairEditionId, existing.kind);
    this.triggerNotificationRecalculation();
  }

  /** Marca Da non fare tutte le attivita' esistenti discendenti dalla kind indicata: non ha senso proseguire una genealogia la cui radice non serve. */
  private async cascadeNotNeeded(fairEditionId: string, kind: FairTaskKind, now: string): Promise<readonly FairTask[]> {
    const descendants = allDescendantKindsOf(kind);
    if (!descendants.length) return [];
    const existing = await this.repository.listByFairEdition(fairEditionId);
    const updated: FairTask[] = [];
    for (const task of existing) {
      if (!descendants.includes(task.kind) || task.status === 'not-needed') continue;
      const next: FairTask = { ...task, status: 'not-needed', statusChangedAt: now, updatedAt: now };
      await this.repository.save(next);
      updated.push(next);
    }
    return updated;
  }

  /** Elimina tutte le attivita' esistenti discendenti dalla kind cancellata: restano altrimenti orfane di una prerequisita inesistente. */
  private async cascadeDelete(fairEditionId: string, kind: FairTaskKind): Promise<void> {
    const descendants = allDescendantKindsOf(kind);
    if (!descendants.length) return;
    const existing = await this.repository.listByFairEdition(fairEditionId);
    for (const task of existing) if (descendants.includes(task.kind)) await this.repository.softDelete(task.id);
  }

  private triggerNotificationRecalculation(): void {
    void this.notifications.recalculate().catch((error) => console.error('Notification recalculation failed:', error));
  }
}
