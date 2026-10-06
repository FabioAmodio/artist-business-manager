# Piano: stato edizione fiera, checklist organizzativa e notifiche unificate

Stato: **Da implementare** (pianificato, nessun codice scritto).
Decisioni raccolte il 2026-10-05, da eseguire nella prossima sessione di lavoro.

Questo documento e la specifica operativa per implementare quanto discusso: stato di conferma sulla `FairEdition`, checklist organizzativa (`FairTask`) generata come guida, collegamento ad anagrafiche (`Party`) e notifiche unificate con icona/filtro per tipo. Estende i punti "post-MVP" gia previsti in [FAIR-SERIES-EDITIONS.md](FAIR-SERIES-EDITIONS.md#entit%C3%A0-pianificate).

## Decisioni confermate dall'utente

1. Stato edizione con tre valori: `draft` (bozza) / `confirmed` (confermata) / `cancelled` (annullata). Non solo un booleano.
2. I task organizzativi vengono **pre-generati come guida/template** alla creazione di una nuova `FairEdition`. L'utente puo marcare singoli task come "non necessario" (non li cancella, li segna come superflui) oppure aggiungerne di liberi.
3. Le notifiche restano **tutte in un'unica lista** (`/notifications`), distinte da un'icona per tipo e filtrabili.
4. Il collegamento ad anagrafica nei task e **testo libero facoltativo**: niente `Party` obbligatorio, l'anagrafica e un aiuto quando disponibile ma non blocca la creazione del task.
5. Aggiunta richiesta in piu: nell'elenco Fiere serve un **filtro per stato** (`draft`/`confirmed`/`cancelled`), distinto dal filtro temporale esistente (`completed`/`upcoming`).

## 1. Modifica modello `FairEdition`

File: [src/app/domain/models/fair.ts](../../src/app/domain/models/fair.ts)

```ts
export type FairEditionStatus = 'draft' | 'confirmed' | 'cancelled';

export interface FairEdition {
  // ...campi esistenti invariati...
  readonly status: FairEditionStatus; // nuovo campo obbligatorio, default 'confirmed' per record esistenti
}
```

Note:
- Campo **obbligatorio** (non opzionale) per evitare stati `undefined` ambigui nei filtri: la migrazione Dexie imposta `confirmed` su tutti i record esistenti (vedi sezione 5).
- `FairService.create()` ([fair.service.ts](../../src/app/application/fairs/fair.service.ts)) dovra impostare un default esplicito, verosimilmente `draft` per le nuove edizioni (coerente con "nascono le nuove edizioni" del messaggio originale: prima si valuta, poi si conferma). Da confermare in UI con l'utente al momento dell'implementazione se preferisce default `draft` o `confirmed` per edizioni create manualmente con date gia certe — proporre `draft` come default e lasciare un'azione esplicita "Conferma" per passare a `confirmed`.
- `FairEdition.deletedAt` (soft delete) resta concettualmente diverso da `status: 'cancelled'`: `cancelled` e una fiera che non si fa piu ma resta visibile per storico/report; `deletedAt` resta la cancellazione applicativa esistente (Cestino). Non unificare i due concetti.

## 2. Filtri che devono escludere le edizioni non confermate

Il principio: bilanci, "prossimi eventi" e statistiche contano solo `status === 'confirmed'`. Le `draft` non devono falsare bilanci futuri; le `cancelled` non devono comparire ne nei bilanci ne come "prossimo evento", ma restano visibili nell'elenco fiere con badge di stato.

File da modificare:

- [src/app/domain/shared/annual-dashboard.ts](../../src/app/domain/shared/annual-dashboard.ts#L71-L104): `yearFairs` deve filtrare `fair.status === 'confirmed'` prima di calcolare `completed`, `inProgress`, `upcoming`, `next`, `fairExpenses`, `reimbursements`. Attenzione: la funzione e pura e coperta da [annual-dashboard.spec.ts](../../src/app/domain/shared/annual-dashboard.spec.ts) — il fixture andra aggiornato con `status: 'confirmed'` sul fair di test, e aggiunto un nuovo test case con un fair `draft`/`cancelled` escluso dalle metriche.
- [src/app/domain/repositories/fair.repository.ts](../../src/app/domain/repositories/fair.repository.ts#L16) `findActive(onDate)`: valutare se deve restare "qualsiasi stato attivo in quella data" (per non nascondere conflitti di date in fase di pianificazione) oppure filtrare solo confermate. Raccomandazione: **non filtrare qui** (resta un controllo di sovrapposizione date grezzo), il filtro per stato va applicato dal chiamante quando il caso d'uso e "cosa conta per bilanci/dashboard".
- [src/app/features/fairs/fairs-page.ts](../../src/app/features/fairs/fairs-page.ts#L87) `visibleFairs()`: **non deve escludere automaticamente** le non confermate, perche l'elenco Fiere deve mostrarle tutte con il nuovo filtro di stato (punto 3).
- Verificare se altre viste usano `fairs` aggregati per bilanci (dashboard fiera operativa, report) tramite ricerca mirata al momento dell'implementazione: cercare altri usi di `annualDashboardMetrics`/`source.fairs` oltre a quelli gia noti.

## 3. Filtro di stato nell'elenco Fiere

File: [fairs-page.ts](../../src/app/features/fairs/fairs-page.ts), [fairs-page.html](../../src/app/features/fairs/fairs-page.html).

Attenzione a non confondere il filtro esistente `fairFilter` (`completed`/`upcoming`, basato su date) con il nuovo filtro di stato. Proposta di naming:

```ts
protected readonly fairStatusFilter = signal<FairEditionStatus | null>(null); // null = 'Tutte'
```

- Nuovo `<select>` "Stato" nel pannello filtri, con opzioni Tutte / Bozza / Confermata / Annullata, accanto a quello esistente "Stato" temporale (da rinominare in UI per chiarezza, es. "Periodo: Concluse/Prossime" vs "Stato: Bozza/Confermata/Annullata" — scegliere etichette che non si sovrappongano semanticamente).
- `visibleFairs()` aggiunge `if (this.fairStatusFilter() && fair.status !== this.fairStatusFilter()) return false;`.
- `hasActiveFilters()` e `resetFilters()` da estendere con il nuovo segnale.
- Sincronizzazione query param opzionale (`fairStatus`) seguendo lo stesso pattern di `fairFilter`/`year` se si vuole deep-link dalla dashboard (non strettamente necessario in prima battuta).
- Badge di stato visivo nella riga fiera (es. colore/etichetta "Bozza"/"Confermata"/"Annullata") nel template elenco.

## 4. Nuova entita `FairTask`

Nuovo file: `src/app/domain/models/fair-task.ts`

```ts
import type { EntityId, IsoDateTime } from '../shared/types';

export type FairTaskKind =
  | 'contact-organizer'
  | 'await-reply'
  | 'send-application'
  | 'pay-fee'
  | 'send-promo-material'
  | 'book-hotel'
  | 'hotel-cancellation-deadline'
  | 'custom';

export type FairTaskStatus = 'pending' | 'in-progress' | 'done' | 'not-needed';

export interface FairTask {
  readonly id: EntityId;
  readonly fairEditionId: EntityId;
  readonly kind: FairTaskKind;
  readonly title: string;
  readonly contactInfo?: string; // testo libero facoltativo (nome, telefono, email...), nessun legame a Party
  readonly dueDate?: string;
  readonly status: FairTaskStatus;
  readonly notes?: string;
  readonly createdAt: IsoDateTime;
  readonly updatedAt: IsoDateTime;
  readonly deletedAt?: IsoDateTime;
}
```

Note di modellazione:
- `not-needed` sostituisce il precedente concetto di `required: boolean` discusso in analisi: e piu semplice, un solo campo di stato, coerente con la decisione "l'utente puo metterne alcuni come non necessari".
- Niente `partyId`: la decisione 4 esclude il collegamento ad anagrafica strutturata per ora. `contactInfo` e libero (puo contenere "Mario Rossi - 333 1234567" o un indirizzo email): nessuna validazione di formato.
- Niente campo `required`/`priority` per restare minimale: aggiungerlo in futuro se emerge un bisogno reale.

### Template dei task generati alla creazione di una FairEdition

Lista ordinata, generata come **guida iniziale modificabile** (non vincolante):

1. `contact-organizer` — "Contattare l'organizzatore"
2. `await-reply` — "Attendere risposta (sollecitare se necessario)"
3. `send-application` — "Inviare modulistica di iscrizione"
4. `pay-fee` — "Pagare la quota di partecipazione"
5. `send-promo-material` — "Inviare materiale promozionale"
6. `book-hotel` — "Prenotare l'hotel (se necessario)"
7. `hotel-cancellation-deadline` — "Annotare la data ultima di cancellazione prenotazione hotel"

Tutti creati con `status: 'pending'`, nessuna `dueDate` precompilata (l'utente la imposta in base agli accordi con l'organizzatore). L'utente puo segnare come `not-needed` quelli non pertinenti (es. niente hotel se la fiera e in giornata) e aggiungere task `custom` liberi.

Implementazione: funzione pura in dominio, es. `src/app/domain/shared/fair-task-template.ts`:

```ts
export function buildDefaultFairTasks(fairEditionId: string, now: IsoDateTime): readonly FairTask[] { /* ... */ }
```

testata con uno spec dedicato (pattern coerente con [fair-validation.spec.ts](../../src/app/domain/rules/fair-validation.spec.ts)).

## 5. Persistenza: migrazione Dexie

File: [src/app/core/persistence/app-database.ts](../../src/app/core/persistence/app-database.ts)

- `DATABASE_VERSION` passa da `25` a `26`.
- Nuova tabella: `fairTasks: 'id, fairEditionId, kind, status, dueDate, updatedAt, deletedAt'`.
- `.upgrade()` della v26 su `fairEditions`: per ogni record esistente senza `status`, impostare `status: 'confirmed'` (pregresso = confermato, come da decisione).
- Seguire esattamente il pattern gia usato per la v25 (vedi commento `// v25: nuove tabelle notifiche...` subito sopra, righe 253-271): dichiarare la versione come "a se stante" cosi i DB gia aggiornati ricevono comunque la nuova tabella e l'upgrade dei dati.
- **Non generare automaticamente i `FairTask` per le edizioni storiche** in migrazione: il template va creato solo per le nuove `FairEdition` dal `FairService.create()`, altrimenti si inquina lo storico con decine di task retroattivi senza senso. Da confermare esplicitamente con l'utente se invece si desidera un'opzione manuale "genera checklist" anche per edizioni gia esistenti (vedi punto 9, domanda aperta).
- Repository nuovo: `src/app/core/repositories/fair-task.repository.ts`, stesso stile di [fair-edition.repository.ts](../../src/app/core/repositories/fair-edition.repository.ts) (CRUD + `listByFairEdition(fairEditionId)`).
- Interfaccia dominio: aggiungere `IFairTaskRepository` in [fair.repository.ts](../../src/app/domain/repositories/fair.repository.ts) o nuovo file `fair-task.repository.ts` in `domain/repositories/`, coerente con la separazione gia usata per Series/Edition.
- Se il workspace puo operare in modalita Firestore (vedi note di memoria utente sul progetto), ricordarsi di aggiungere `fairTasks` anche alle Security Rules e alla lista delle collection sincronizzate (`delegating-storage.provider.ts`, `firestore.provider.ts` se serve una lista esplicita delle collection applicative).

## 6. Servizio applicativo

Nuovo file: `src/app/application/fairs/fair-task.service.ts`, iniettabile, stesso stile di [fair.service.ts](../../src/app/application/fairs/fair.service.ts):

- `listByFairEdition(fairEditionId): Promise<readonly FairTask[]>`
- `createDefaults(fairEditionId): Promise<readonly FairTask[]>` (usa `buildDefaultFairTasks`)
- `create(input): Promise<FairTask>` (task custom liberi)
- `update(id, input): Promise<FairTask>`
- `markNotNeeded(id)` / `markDone(id)` / `reopen(id)` (o un generico `setStatus(id, status)`)
- `delete(id)` (soft delete, per i task custom aggiunti per errore)

`FairService.create()` ([fair.service.ts](../../src/app/application/fairs/fair.service.ts#L36-L58)) dopo aver salvato la nuova `FairEdition`, chiama `fairTaskService.createDefaults(fair.id)`. Da valutare se farlo direttamente nel componente pagina (dopo il salvataggio) invece che nel service, per non creare una dipendenza circolare tra application services: probabilmente piu pulito chiamarlo dalla pagina ([fairs-page.ts](../../src/app/features/fairs/fairs-page.ts)) subito dopo la creazione riuscita.

## 7. UI checklist nella scheda fiera

Non esiste oggi una pagina di dettaglio/scheda per singola `FairEdition` (l'elenco e editing inline in [fairs-page.ts](../../src/app/features/fairs/fairs-page.ts)). Due opzioni da decidere nella prossima sessione:

- **Opzione A (minimale)**: sezione espandibile "Checklist organizzativa" dentro la riga/form di modifica esistente in `fairs-page`, senza nuova route.
- **Opzione B (piu strutturata)**: nuovo componente standalone `fair-task-list.component.ts/html/scss` (struttura a 3 file secondo lo standard del progetto) montato dentro `fairs-page` quando una fiera e in modifica, con:
  - elenco task con `title`, `status` (checkbox/toggle pending/done/not-needed), `dueDate` (date input), `contactInfo` (text input libero), `notes`.
  - pulsante "Aggiungi task libero".
  - azione "Rigenera checklist standard" solo se non esistono gia task per quella edizione (per edizioni storiche, vedi domanda aperta punto 9).

Raccomandazione: partire dall'Opzione B come componente dedicato, perche la checklist ha abbastanza stato/interazioni proprie da giustificare un componente separato e si allinea alle convenzioni Angular del progetto (componenti piccoli e focalizzati, file esterni HTML/SCSS).

## 8. Notifiche unificate con icona e filtro per tipo

### Estensione modello

File: [src/app/domain/models/notification.ts](../../src/app/domain/models/notification.ts)

```ts
export type NotificationKind = 'operation-due-soon' | 'operation-overdue' | 'fair-task-due-soon' | 'fair-task-overdue' | 'reminder';
// entityType esistente va esteso:
readonly entityType?: 'operation' | 'fair-task' | 'reminder';
```

(Il kind `'reminder'` generico esisteva gia ma non era usato da nessuna evaluation: si puo lasciare o rimuovere in favore dei due kind specifici `fair-task-*`, da decidere in implementazione — probabilmente meglio **specializzare** come fatto per le operazioni, cosi l'icona e deterministica per kind.)

### Nuova funzione di valutazione

File: [src/app/domain/shared/notification-evaluation.ts](../../src/app/domain/shared/notification-evaluation.ts)

Aggiungere `evaluateFairTaskNotifications(tasks: readonly FairTask[], policy: NotificationPolicy, now: Date): NotificationEvaluationResult`, speculare a `evaluateOperationNotifications` (righe 17-33): considera solo task con `status === 'pending' | 'in-progress'` e `dueDate` valorizzata, stessa logica overdue/due-soon con la stessa finestra `dueSoonDays` gia configurabile da Impostazioni.

### Integrazione nel servizio

File: [src/app/application/notifications/notification.service.ts](../../src/app/application/notifications/notification.service.ts)

Il metodo `recalculate()` (righe 31-100) oggi gestisce **solo** `entityType === 'operation'`. Serve generalizzare il blocco di riconciliazione (candidate nuovi / notifiche stale da rimuovere) per poterlo eseguire due volte (operation + fair-task) senza duplicare tutta la logica — estrarre una funzione privata `reconcileNotifications(entityType, candidates, now)` riutilizzata per entrambe le fonti, poi un'unica run complessiva (`candidates`, `newNotifications`, `operationsAnalyzed` diventa piu generico, es. `itemsAnalyzed`).

Serve iniettare la lettura dei `FairTask` (storage `fairTasks`) accanto a quella di `operations`.

### UI: icona e filtro per kind

File: [notifications-page.html](../../src/app/features/notifications/notifications-page.html), [notifications-page.ts](../../src/app/features/notifications/notifications-page.ts)

- Mappare `NotificationKind` → icona, es.:
  - `operation-due-soon` / `operation-overdue` → ⏰ (gia implicito, tema esistente "Scadenze")
  - `fair-task-due-soon` / `fair-task-overdue` → 📅 o 🏷️ (da allineare con l'icona gia usata per Fiere, 📅, per coerenza visiva — vedi [fairs-page.html](../../src/app/features/fairs/fairs-page.html#L2) `icon="📅"`)
  - `reminder` (se mantenuto) → 🔔
- Aggiungere un controllo filtro (es. chip/select) "Tutte / Lavorazioni / Fiere" sopra la lista, analogo nello stile ai filtri gia presenti in altre pagine (`list-filter-panel` o un semplice gruppo di bottoni, da scegliere in base a quanti kind avremo — con soli 2 raggruppamenti logici un gruppo di toggle e piu immediato di un pannello filtri completo).
- Click su una notifica `fair-task` deve aprire la fiera/task corrispondente: oggi `openNotification()` ([notifications-page.ts](../../src/app/features/notifications/notifications-page.ts#L25-L28)) naviga sempre a `/works`; va reso condizionale su `entityType` (`fair-task` → naviga a `/events` con query param per aprire l'edizione, coerente con quanto gia fa `fairFilter`/`year` in `fairs-page`).

## 9. `FairSeries`: dati costanti riutilizzabili ed ereditarieta verso le edizioni (nota aggiunta 2026-10-05)

Richiesta: poter modificare una `FairSeries` per impostare dati "costanti" (riutilizzati per ogni nuova edizione ma sempre sovrascrivibili sulla singola `FairEdition`): luogo, organizzatore, e template delle attivita organizzative tipiche di quella fiera (es. "per questa fiera prenotiamo sempre l'hotel", "per questa fiera non serve mai materiale promozionale perche lo fornisce l'organizzatore").

Stato attuale: `FairSeries` ha gia `defaultLocation`, `organizerName`, `organizerContact`, `organizerEmail`, `organizerPhone`, `website`, `notes` ([fair.ts](../../src/app/domain/models/fair.ts#L3-L16)), ma **non esiste una UI per modificarli**: la serie viene creata implicitamente da `FairService.create()` ([fair.service.ts](../../src/app/application/fairs/fair.service.ts#L36-L58)) solo con `name`/`defaultLocation`, e non ha mai un `update` esposto ([fair-series.repository.ts](../../src/app/core/repositories/fair-series.repository.ts) ha gia `save()`/`softDelete()` pronti, solo non collegati a un form).

Lavoro da pianificare:

1. **Editing serie**: nuova azione "Modifica serie" raggiungibile da `fairs-page` (es. quando una fiera e in modifica, link "Modifica dati serie <nome>"), con form sui campi gia esistenti di `FairSeries` (nessuna migrazione dati necessaria, sono gia tutti opzionali).
2. **`FairService.updateSeries(id, input)`**: nuovo metodo che richiama `FairSeriesRepository.save()`, coerente con lo stile di `update()` per le edizioni.
3. **Template task per serie**: nuovo campo opzionale su `FairSeries`:

   ```ts
   export interface FairSeriesTaskTemplateItem {
     readonly kind: FairTaskKind;
     readonly title: string;
     readonly defaultStatus?: 'pending' | 'not-needed'; // permette di pre-marcare "non necessario" per questa serie
     readonly defaultNotes?: string; // istruzione ricorrente da riportare su ogni nuova edizione (es. "prenotare hotel sempre con cancellazione gratuita fino a conferma organizzatori", caso Cairo)
   }

   export interface FairSeries {
     // ...campi esistenti invariati...
     readonly taskTemplate?: readonly FairSeriesTaskTemplateItem[]; // opzionale: se assente si usa il template globale (sezione 4)
   }
   ```

   `buildDefaultFairTasks()` (sezione 4) va esteso per accettare un parametro opzionale `seriesTemplate?: readonly FairSeriesTaskTemplateItem[]`: se presente genera i task da li, altrimenti usa la lista globale fissa gia definita. Questo rende la funzione **retrocompatibile di default** (nessuna serie esistente ha `taskTemplate`, quindi il comportamento per tutte le serie gia censite resta quello del template globale finche l'utente non personalizza esplicitamente una serie).
4. **Ereditarieta su nuova edizione**: quando si crea una nuova `FairEdition` per una serie esistente (`useExistingSeries()` in [fairs-page.ts](../../src/app/features/fairs/fairs-page.ts#L155-L158)), oltre al prefill gia presente di `location` da `series.defaultLocation`, prefillare anche eventuali campi organizzatore se in futuro verranno esposti a livello di edizione (oggi l'organizzatore vive solo sulla serie: da confermare se serve uno snapshot per edizione o basta leggerlo sempre dalla serie tramite `fairSeriesId`).
5. **Retrocompatibilita / migrazione**: nessun bump di `DATABASE_VERSION` necessario per i soli campi `taskTemplate` (campo opzionale, additivo). Se pero si decide di spostare `organizerEmail`/`organizerPhone` in una struttura diversa in futuro, servira una migrazione dedicata separata da quella di sezione 5 — non toccare lo schema esistente in questa iterazione, solo aggiungere il campo opzionale.

## 10. Azioni di contatto rapide da mobile (nota aggiunta 2026-10-05)

Richiesta: da mobile, toccando un contatto (organizzatore, hotel, ecc.) si deve poter aprire direttamente l'app mail, la chiamata, o un messaggio/WhatsApp, senza dover copiare manualmente numero/indirizzo.

Distinguere due casi, perche i dati sorgente hanno forma diversa:

1. **`FairSeries` organizzatore**: campi gia strutturati (`organizerEmail`, `organizerPhone`) — deep link diretti, nessun parsing necessario:
   - `mailto:{organizerEmail}` per il pulsante email;
   - `tel:{organizerPhone}` per il pulsante chiamata;
   - `https://wa.me/{numero normalizzato}` per WhatsApp (richiede normalizzare il numero rimuovendo spazi/trattini; senza prefisso internazionale il link potrebbe non risolvere correttamente sul dispositivo del destinatario — da segnalare come limite noto, non bloccante).
2. **`FairTask.contactInfo`** (testo libero per decisione 4): nessun parsing affidabile garantito. Proposta: un piccolo euristico che cerca nel testo pattern tipo email (`\S+@\S+\.\S+`) e sequenze numeriche plausibili come telefono (es. 8+ cifre con spazi/trattini/parentesi opzionali); se trovati, mostrare i pulsanti corrispondenti, altrimenti nessuna azione rapida (il testo resta comunque leggibile).

Implementazione proposta: utility condivisa, nuovo file `src/app/shared/utils/contact-links.ts`:

```ts
export interface ContactLinks {
  readonly callHref?: string;   // tel:...
  readonly mailHref?: string;   // mailto:...
  readonly whatsappHref?: string; // https://wa.me/...
}

export function contactLinksFromStructured(email?: string, phone?: string): ContactLinks { /* ... */ }
export function contactLinksFromFreeText(text?: string): ContactLinks { /* euristica email/telefono */ }
```

Riutilizzabile in:
- UI checklist `FairTask` (sezione 7): pulsanti accanto a `contactInfo` quando il parsing riconosce qualcosa.
- Form "Modifica serie" (sezione 9): pulsanti accanto a `organizerEmail`/`organizerPhone`.
- Eventualmente anche nelle schede `Party` esistenti (Clienti/Fornitori), che hanno gia `email`/`phone` strutturati in [party.ts](../../src/app/domain/models/party.ts#L6-L19) ma oggi nessun deep link cliccabile: da valutare come piccolo miglioramento collaterale, non necessario per chiudere questa feature.

Nota tecnica: i link `tel:`/`mailto:`/`https://wa.me/` funzionano sia da browser mobile sia da PWA installata senza permessi aggiuntivi; nessun impatto di sicurezza (non eseguono codice, solo intent di sistema). Non generare link se il dato e vuoto (evitare `href="tel:"` vuoti che alcuni browser trattano in modo inconsistente).

## 11. Valori di costo suggeriti dall'edizione precedente (nota aggiunta 2026-10-06)

Richiesta: quando si crea una nuova `FairEdition` per una serie gia esistente, riportare come **suggerimento modificabile** i valori di costo dell'edizione precedente della stessa serie (`expectedBudget`, `standCost`, `hotelCost`, `travelCost`, `otherCosts`), cosi da accorgersi subito di eventuali aumenti anno su anno. I costi restano liberamente modificabili: non e un vincolo, solo un punto di partenza.

Design:

1. **Nessuna migrazione necessaria**: il dato e calcolato a runtime dalle edizioni gia esistenti, non viene persistito sulla nuova edizione (evita denormalizzazione che potrebbe disallinearsi nel tempo).
2. **Fonte dati**: [`FairEditionRepository.list()`](../../src/app/core/repositories/fair-edition.repository.ts#L19-L27) ordina gia per `startDate` decrescente e `listBySeries()` ([riga 30](../../src/app/core/repositories/fair-edition.repository.ts#L30-L32)) lo riusa: basta prendere il primo risultato per la serie scelta, nessun nuovo metodo repository.
3. **"Edizione precedente"**: tra le edizioni esistenti della stessa serie, quella con `startDate` piu recente **antecedente** alla data della nuova edizione (o la piu recente in assoluto se la nuova edizione non ha ancora una data impostata). Se si sta modificando un'edizione esistente, va esclusa se stessa dal confronto.
4. **Campi da riportare come suggerimento**: `expectedBudget`, `standCost`, `hotelCost`, `travelCost`, `otherCosts`.
5. **Campi da NON riportare**: `standPaid`/`travelPaid`/`hotelPaid` sono flag di pagamento e devono sempre ripartire da `false` per una nuova edizione, indipendentemente da come si e conclusa quella precedente.
6. **UI**: estendere `useExistingSeries()` in [fairs-page.ts](../../src/app/features/fairs/fairs-page.ts#L155-L158) (oggi prefilla solo `location`) per prefillare anche i cinque campi di costo, con la stessa cautela gia usata per `location` (non sovrascrivere un valore gia inserito dall'utente). Aggiungere accanto a ogni campo costo del form un piccolo indicatore di scostamento (es. "Anno scorso: 120 € · +15 €") calcolato confrontando il valore in bozza con quello dell'edizione precedente, aggiornato live mentre l'utente modifica il campo.
7. **Caso senza precedente**: prima edizione di una serie, nessun prefill/indicatore (nessun dato storico disponibile).

## 12. Domande aperte da chiudere a inizio prossima sessione

1. Default `status` per una `FairEdition` creata da zero: `draft` (richiede conferma esplicita) o `confirmed` (comportamento attuale implicito)? Proposta: `draft`.
2. Le edizioni **storiche** devono poter ricevere la checklist standard a posteriori su richiesta esplicita dell'utente (pulsante "Genera checklist"), oppure la checklist e solo per le nuove edizioni da qui in avanti? Proposta: pulsante manuale disponibile sempre, idempotente (non duplica se gia esistono task per quell'edizione).
3. Opzione A vs B per la UI della checklist (inline vs componente dedicato) — proposta: Opzione B.
4. Serve un'azione per "confermare" un'edizione (`draft` → `confirmed`) visibile come bottone dedicato in lista/form, o basta cambiare il campo stato da un select? Proposta: select nel form di modifica fiera, piu eventuale azione rapida in lista.
5. Il template task per `FairSeries` (sezione 9) va gestito in questa stessa iterazione o rimandato a una successiva? Proposta: implementarlo subito perche tocca la stessa funzione `buildDefaultFairTasks()` della checklist base, evitando di doverla ritoccare due volte.
6. Le azioni rapide di contatto (sezione 10) vanno estese anche alle schede `Party` esistenti in questa iterazione, o restano limitate a `FairSeries`/`FairTask`? Proposta: solo `FairSeries`/`FairTask` ora, `Party` come miglioramento separato successivo.
7. L'indicatore di scostamento costi (sezione 11) va mostrato solo in creazione/modifica edizione, o anche come colonna/badge nell'elenco Fiere? Proposta: solo nel form, per restare minimale.

## 13. Checklist di implementazione per la prossima sessione

1. Dominio: `FairEditionStatus`, campo `status` su `FairEdition`, nuovo modello `FairTask` e `buildDefaultFairTasks()` con relativo spec.
2. Persistenza: bump `DATABASE_VERSION` a 26, tabella `fairTasks`, upgrade che imposta `status: 'confirmed'` sui record esistenti; nuovo `FairTaskRepository` + interfaccia dominio.
3. Applicazione: `FairTaskService`; `FairService` aggiornato per gestire `status` in create/update; chiamata a `createDefaults()` dopo la creazione di una nuova edizione dalla pagina.
4. Dominio puro: aggiornare `annualDashboardMetrics` per filtrare `status === 'confirmed'` + aggiornare/estendere `annual-dashboard.spec.ts`.
5. UI Fiere: nuovo filtro di stato in `fairs-page` (segnale distinto da `fairFilter` esistente), badge di stato in elenco, select di stato nel form di modifica.
6. UI Checklist: nuovo componente `fair-task-list` (Opzione B) con toggle stato, due campi liberi (`dueDate`, `contactInfo`), pulsante "Aggiungi task libero" e "Genera checklist" per edizioni storiche.
7. Notifiche: estendere `NotificationKind`/`entityType`, nuova funzione `evaluateFairTaskNotifications`, generalizzare `recalculate()` in `NotificationService` per entrambe le fonti.
8. UI Notifiche: icone per kind, filtro Lavorazioni/Fiere, routing di apertura condizionale per `fair-task`.
9. `FairSeries`: form di modifica, `FairService.updateSeries()`, campo opzionale `taskTemplate` (incluso `defaultNotes`) e uso in `buildDefaultFairTasks()`.
10. Azioni di contatto rapide: utility `contact-links.ts` e pulsanti tel/mail/WhatsApp su organizzatore serie e su `FairTask.contactInfo` quando riconosciuto.
11. Valori di costo suggeriti: prefill dei campi costo e indicatore di scostamento in `fairs-page` quando si seleziona una serie esistente (sezione 11).
12. Verifica build: `npm run build` (modalita PROD come da preferenza utente corrente), eventuali `npm test` mirati sui nuovi spec di dominio.
13. Decidere se aggiornare `docs/architecture/CHANGELOG.md` e `IMPLEMENTATION-STATUS.md` solo a implementazione completata (non ora).

## Fuori ambito per questa iterazione

- Collegamento strutturato `FairTask`/`FairSeries` a `Party` (anagrafica organizzatore/hotel): esplicitamente escluso dalla decisione 4, resta testo libero.
- `Reservation`/`Hotel` come entita dedicate (gia annotate come nota di sviluppo futura in `FAIR-SERIES-EDITIONS.md`): il task `book-hotel`/`hotel-cancellation-deadline` resta un semplice `FairTask`, non introduce prenotazioni strutturate.
- Modifica del concetto di soft delete/Cestino per le fiere: `cancelled` e uno stato visibile, non sostituisce `deletedAt`.
