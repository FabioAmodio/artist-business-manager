import type { FairSeriesTaskTemplateItem, FairTaskKind } from '../models/fair';
import type { FairTask } from '../models/fair-task';
import type { IsoDateTime } from './types';

export const GLOBAL_DEFAULT_TEMPLATE: readonly FairSeriesTaskTemplateItem[] = [
  { kind: 'contact-organizer', title: "Contattare l'organizzatore" },
  { kind: 'await-reply', title: 'Attendere risposta (sollecitare se necessario)' },
  { kind: 'send-application', title: 'Inviare modulistica di iscrizione' },
  { kind: 'pay-fee', title: 'Pagare la quota di partecipazione' },
  { kind: 'send-promo-material', title: 'Inviare materiale promozionale' },
  { kind: 'book-hotel', title: "Prenotare l'hotel (se necessario)" },
  { kind: 'hotel-cancellation-deadline', title: 'Annotare la data ultima di cancellazione prenotazione hotel' },
];

/** Attivita la cui controparte tipica e' l'hotel, non l'organizzatore della fiera: determina il tipo di contatto proposto nella checklist. */
export const HOTEL_TASK_KINDS: ReadonlySet<FairTaskKind> = new Set(['book-hotel', 'hotel-cancellation-deadline']);

/** Dipendenze tra attivita standard: una kind dipendente diventa proponibile solo quando la sua prerequisita e' "Fatta".
 * Restano senza dipendenze solo 'contact-organizer' e 'book-hotel': quest'ultima puo' avere senso prenotarla prima della conferma, per sicurezza di trovare alloggio. */
export const FAIR_TASK_DEPENDENCIES: Partial<Record<FairTaskKind, FairTaskKind>> = {
  'await-reply': 'contact-organizer',
  'send-application': 'await-reply',
  'pay-fee': 'await-reply',
  'send-promo-material': 'await-reply',
  'hotel-cancellation-deadline': 'book-hotel',
};

/** Kind standard che si sbloccano automaticamente al completamento della kind indicata. */
export function dependentKindsOf(kind: FairTaskKind): readonly FairTaskKind[] {
  return Object.entries(FAIR_TASK_DEPENDENCIES)
    .filter(([, dependency]) => dependency === kind)
    .map(([dependent]) => dependent as FairTaskKind);
}

/** Tutta la "genealogia" discendente di una kind (figli, nipoti, ...): usata per propagare Da non fare/cancellazione a cascata. */
export function allDescendantKindsOf(kind: FairTaskKind): readonly FairTaskKind[] {
  const result: FairTaskKind[] = [];
  const queue = [...dependentKindsOf(kind)];
  while (queue.length) {
    const current = queue.shift()!;
    if (result.includes(current)) continue;
    result.push(current);
    queue.push(...dependentKindsOf(current));
  }
  return result;
}

function isUnlocked(kind: FairTaskKind, completedKinds: ReadonlySet<FairTaskKind>): boolean {
  const dependency = FAIR_TASK_DEPENDENCIES[kind];
  return !dependency || completedKinds.has(dependency);
}

/** Kind standard non ancora presenti nell'edizione ma proponibili ora (nessuna dipendenza, o dipendenza gia' Fatta). */
export function missingDefaultFairTaskKinds(existingTasks: readonly FairTask[], seriesTemplate?: readonly FairSeriesTaskTemplateItem[]): readonly FairTaskKind[] {
  const template = seriesTemplate?.length ? seriesTemplate : GLOBAL_DEFAULT_TEMPLATE;
  const existingKinds = new Set(existingTasks.map((task) => task.kind));
  const completedKinds = new Set(existingTasks.filter((task) => task.status === 'done').map((task) => task.kind));
  return template.filter((item) => !existingKinds.has(item.kind) && isUnlocked(item.kind, completedKinds)).map((item) => item.kind);
}

/** Genera la checklist guida di una nuova FairEdition: usa il template di serie se presente, altrimenti quello globale.
 * Se forniti, i task dell'edizione precedente della stessa serie suggeriscono il contatto gia' usato per la stessa kind (es. hotel, organizzatore).
 * Se fornito "completedKinds", le kind dipendenti (es. 'await-reply') vengono generate solo quando la loro prerequisita e' gia' Fatta. */
export function buildDefaultFairTasks(fairEditionId: string, now: IsoDateTime, seriesTemplate?: readonly FairSeriesTaskTemplateItem[], previousTasks?: readonly FairTask[], completedKinds?: ReadonlySet<FairTaskKind>): readonly FairTask[] {
  const template = seriesTemplate?.length ? seriesTemplate : GLOBAL_DEFAULT_TEMPLATE;
  return template
    .filter((item) => !completedKinds || isUnlocked(item.kind, completedKinds))
    .map((item) => {
      const index = template.indexOf(item);
      const previous = previousTasks?.find((task) => task.kind === item.kind && task.partyId);
      return {
        id: fairTaskId(fairEditionId, item.kind, index),
        fairEditionId,
        kind: item.kind,
        title: item.title,
        status: item.defaultStatus ?? 'pending',
        notes: item.defaultNotes,
        contactRole: HOTEL_TASK_KINDS.has(item.kind) ? 'hotel' : 'organizer',
        partyId: previous?.partyId,
        contactChannel: previous?.contactChannel,
        createdAt: now,
        updatedAt: now,
      };
    });
}

function fairTaskId(fairEditionId: string, kind: FairTaskKind, index: number): string {
  return `${fairEditionId}:task:${index}:${kind}`;
}
