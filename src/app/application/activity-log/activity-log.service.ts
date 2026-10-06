import { Injectable, inject } from '@angular/core';
import { ActivityLogRepository } from '../../core/repositories/activity-log.repository';
import type { ActivityLogEntry, ActivityLogSubjectType } from '../../domain/models/activity-log';
import type { PartyContactChannel } from '../../domain/models/party';

export type ActivityLogInput = Pick<ActivityLogEntry, 'subjectType' | 'subjectId' | 'date' | 'title' | 'contactName' | 'contactChannel' | 'contactValue' | 'notes' | 'sourceTaskId'>;

@Injectable({ providedIn: 'root' })
export class ActivityLogService {
  private readonly repository = inject(ActivityLogRepository);

  listBySubject(subjectType: ActivityLogSubjectType, subjectId: string): Promise<readonly ActivityLogEntry[]> {
    return this.repository.listBySubject(subjectType, subjectId);
  }

  /** Tutte le voci non eliminate, di qualunque soggetto: usata dalla pagina globale "Registro attività". */
  listAll(): Promise<readonly ActivityLogEntry[]> {
    return this.repository.listAll();
  }

  async create(input: ActivityLogInput): Promise<ActivityLogEntry> {
    const now = new Date().toISOString();
    const entry: ActivityLogEntry = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now };
    await this.repository.save(entry);
    return entry;
  }

  /** Scorciatoia per il log automatico generato segnando un'attivita' Fatta: nessuna deduplica, ogni chiamata crea una nuova riga. */
  logTaskCompletion(fairEditionId: string, taskId: string, title: string, contact?: { readonly name?: string; readonly channel?: PartyContactChannel; readonly value?: string }): Promise<ActivityLogEntry> {
    return this.create({
      subjectType: 'fair',
      subjectId: fairEditionId,
      date: new Date().toISOString().slice(0, 10),
      title,
      contactName: contact?.name,
      contactChannel: contact?.channel,
      contactValue: contact?.value,
      sourceTaskId: taskId,
    });
  }

  async update(id: string, input: ActivityLogInput): Promise<ActivityLogEntry> {
    const existing = await this.repository.getById(id);
    if (!existing) throw new Error('Voce di registro non trovata.');
    const entry: ActivityLogEntry = { ...existing, ...input, updatedAt: new Date().toISOString() };
    await this.repository.save(entry);
    return entry;
  }

  delete(id: string): Promise<void> {
    return this.repository.softDelete(id);
  }
}
