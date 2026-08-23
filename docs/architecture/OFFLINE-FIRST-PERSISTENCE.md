# Strategia di persistenza Offline First

## Stato e autorita

Questa e la decisione architetturale di riferimento per persistenza locale, disponibilita offline, sincronizzazione futura e separazione degli ambienti. In caso di conflitto con documenti precedenti, prevale questo documento.

La strategia e progettata per l'uso in fiere ed eventi senza connettivita, inclusi padiglioni con segnale assente, hotspot indisponibile, rete sovraccarica e Safari su iPhone.

## 1. Principi architetturali

1. Il database locale e la fonte operativa primaria.
2. La rete non e un prerequisito per creare, modificare, consultare o eliminare logicamente dati.
3. Ogni comando utente deve completare il salvataggio locale prima di essere considerato riuscito.
4. La sincronizzazione remota, quando sara disponibile, e un processo separato e asincrono.
5. Il dominio non conosce IndexedDB, Dexie, LocalStorage o provider cloud.
6. I dati applicativi non usano direttamente LocalStorage.
7. Le cancellazioni con valore storico sono soft delete e restano auditabili.
8. Ogni record deve avere identificativo stabile, `createdAt`, `updatedAt`, versione locale e metadati utili alla futura sincronizzazione.
9. Il sistema deve comunicare distintamente salvataggio locale, errore locale, sincronizzazione pendente ed errore di sincronizzazione.

## 2. Diagramma logico dei componenti

```text
+-----------------------------+
| UI / Feature Components     |
| form, lista, dashboard, FAB |
+--------------+--------------+
               |
               v
+-----------------------------+
| Application Services        |
| use case, validazione,      |
| transazioni e stato UI      |
+--------------+--------------+
               |
               v
+-----------------------------+
| Repository                  |
| OperationRepository,        |
| FairRepository, ecc.        |
+--------------+--------------+
               |
               v
+-----------------------------+
| IStorageProvider            |
| contratto storage/sync      |
+--------------+--------------+
               |
       +-------+--------+
       |                |
       v                v
+-------------+  +----------------+
| IndexedDb   |  | Future cloud   |
| Provider    |  | provider       |
| Dexie       |  | Drive/OneDrive |
+------+------+  +-------+--------+
       |                 |
       v                 v
+-------------+  +----------------+
| IndexedDB   |  | remote dataset |
| locale      |  | opzionale      |
+-------------+  +----------------+

Sync Engine / Outbox opera separatamente:
locale commit -> outbox -> sync asincrona -> stato record
```

L'applicazione deve dipendere dal contratto `IStorageProvider`, non dall'implementazione concreta. La prima implementazione prevista e `IndexedDbProvider`; provider come `GoogleDriveProvider`, `OneDriveProvider`, `DropboxProvider` o `FutureBackendProvider` possono essere aggiunti senza modificare dominio e casi d'uso.

## 3. Responsabilita dei layer

### UI

Mostra dati e stato del comando. Non apre database, non costruisce query Dexie e non decide quale provider usare. Deve dare feedback immediato sul commit locale e rendere visibili dati incompleti o in attesa di sincronizzazione.

### Application Services

Orchestrano casi d'uso: nuova Operazione, aggiornamento di una commissione, registrazione vendita, assegnazione della fiera contabile, export/import e sincronizzazione. Eseguono validazioni applicative, aprono transazioni tramite repository e aggiornano lo stato presentato alla UI.

### Repository

Espongono operazioni orientate al dominio, ad esempio `saveOperation`, `findOperations`, `softDeleteOperation` e `listPendingSync`. Nascondono query, indici, paginazione, transazioni e dettagli dello storage.

### IStorageProvider

Definisce il contratto infrastrutturale minimo: lettura/scrittura transazionale, aggiornamento, soft delete, query per identificativo e gestione dei metadati di sincronizzazione. Il contratto deve supportare commit locale immediato e coda outbox senza imporre un backend.

### Storage Provider

Adatta un sistema concreto al contratto. `IndexedDbProvider` usa Dexie e IndexedDB. I provider cloud futuri possono sincronizzare un dataset, ma non devono diventare fonte operativa obbligatoria.

### Persistenza

IndexedDB contiene Operazioni, fiere, costi, clienti, prodotti, incassi, scadenze, audit e outbox. Il service worker/cache contiene shell e asset, non sostituisce il database di dominio.

## 4. Strategia Offline First

### Salvataggio

Il flusso nominale e:

```text
Utente
  |
  v
Comando applicativo
  |
  v
Validazione minima di dominio
  |
  v
Transazione locale IndexedDB
  |                 \
  |                  +--> outbox: pending (se sync futura attiva)
  v
UI aggiornata immediatamente
  |
  v
Sync asincrona quando disponibile
```

Un record rapido incompleto e valido se contiene il minimo necessario per riconoscere l'operazione. Non deve attendere rete o completamento di tutti i campi. Se il commit locale fallisce, il comando fallisce chiaramente e l'utente puo ritentare o esportare i dati disponibili; non deve essere presentato come salvato.

### Stati di sincronizzazione

- `local-only`: record salvato localmente, nessun provider remoto configurato;
- `pending`: modifica locale in attesa di sincronizzazione;
- `synced`: ultima modifica confermata dal provider remoto;
- `sync-error`: sincronizzazione fallita, dati locali ancora utilizzabili;
- `conflict`: modifica locale e remota richiedono scelta esplicita.

`navigator.onLine` e solo un'indicazione di connettivita e non prova che il provider remoto sia raggiungibile. La sincronizzazione non deve bloccare navigazione, registrazione o consultazione.

### Cancellazione logica

La cancellazione applicativa imposta `deletedAt` e l'autore della modifica. Le query operative escludono i record cancellati, mentre audit, export e risoluzione conflitti possono recuperarli secondo permessi e regole esplicite.

### Identita e concorrenza futura

Gli identificativi sono generati localmente e non dipendono da un server. Ogni modifica conserva versione locale, autore/dispositivo quando disponibile e timestamp. La strategia di merge automatica non e ancora congelata: i conflitti non devono essere risolti silenziosamente.

## 5. Strategia di sincronizzazione

La sincronizzazione e una responsabilita separata dal salvataggio locale. Un `SyncEngine` futuro legge l'outbox, raggruppa modifiche, invia al provider selezionato, registra esito e riprova con backoff. Deve essere idempotente e interrompibile.

Regole iniziali:

- il commit locale precede sempre la sync;
- la UI non attende la sync;
- una perdita di rete dopo il commit non perde il dato;
- gli errori di sync non annullano il dato locale;
- import/export e trasferimento manuale di dati, non sono sincronizzazione remota;
- il provider remoto non deve essere scelto dal dominio;
- l'utente deve poter vedere e ritentare gli elementi in errore.

La futura condivisione puo usare dataset condivisi, membership, ruoli e permessi. Questi concetti devono stare nel layer applicativo/infrastrutturale e non alterare la semantica di Operazione.

## 6. Database locale e LocalStorage

IndexedDB tramite Dexie e lo storage primario per dati applicativi, incluse Operazioni, commissioni, vendite, fiere, costi, clienti, catalogo, incassi e scadenze.

LocalStorage puo contenere solo dati leggeri e non critici, ad esempio preferenza tema, ultimo ambiente selezionato o preferenze UI. Non deve contenere Operazioni, importi, clienti, vendite o l'unica copia di un record.

La cache PWA/service worker serve per shell e asset statici. Non e la fonte di verita dei dati e non deve essere usata per simulare un database.

## 7. Configurazione TEST e RELEASE

La separazione tra branch e ambienti e definita in [ENVIRONMENTS.md](ENVIRONMENTS.md); il flusso Git ufficiale e in [GIT-STRATEGY.md](GIT-STRATEGY.md). Questa sezione definisce l'impatto della configurazione sullo storage.

Il nome del database deve essere composto da ambiente e prefisso configurabile, mai hardcoded nei repository:

```text
ABM-TEST-<storagePrefix>
ABM-PROD-<storagePrefix>
```

La configurazione runtime deve fornire almeno:

```typescript
interface StorageEnvironmentConfig {
  environment: 'test' | 'release';
  storagePrefix: string;
  databaseName: string;
}
```

Un ambiente di test non deve mai aprire il database di release. Test automatici e manuali devono verificare isolamento, migrazioni indipendenti e reset esplicito dell'ambiente di test.

## 8. Considerazioni Safari iOS

Safari su iPhone e un target operativo primario, non un caso marginale.

- Testare IndexedDB su Safari iOS installato come PWA e aperto in browser.
- Considerare quota limitata, eviction, spazio libero e cancellazione dei dati del sito.
- Gestire errori di quota e disponibilita con messaggio utile, senza perdere il flusso gia salvato.
- Non assumere che modalita privata, sospensione della pagina o chiusura della PWA conservino tutti i dati allo stesso modo.
- Evitare di affidare la coda di dati a memoria, LocalStorage o cache HTTP.
- Mantenere le transazioni brevi e atomiche; non tenere aperte transazioni mentre si attende input o rete.
- Testare reload, riapertura dopo assenza rete, aggiornamento della shell e migrazione del database.
- Il service worker puo essere aggiornato senza cancellare IndexedDB; ogni migrazione deve essere versionata e reversibile dove possibile.
- Comunicare chiaramente all'utente l'esito del salvataggio locale e suggerire export/backup periodici.

## 9. Futura collaborazione multiutente

L'architettura resta provider-agnostica e pronta a dataset condivisi. In futuro potranno essere introdotti:

- workspace e dataset condivisi;
- utenti, collaboratori e assistenti;
- ruoli e permessi;
- autore e dispositivo della modifica;
- outbox per dataset;
- conflitti e revisione manuale;
- audit delle modifiche e revoca accessi.

Questi elementi non devono trasformare la rete in prerequisito: ogni client continua a lavorare sul proprio stato locale e sincronizza quando possibile. La politica di conflitto, il modello di identita e l'autorizzazione remota restano questioni aperte.

## 10. Decisioni da congelare ora

1. IndexedDB/Dexie e fonte operativa primaria.
2. Nessun dato applicativo critico in LocalStorage.
3. Il dominio dipende da repository e `IStorageProvider`, mai da Dexie.
4. Il commit locale e sincrono rispetto al caso d'uso; la sync remota e asincrona.
5. I dati locali restano utilizzabili con rete assente.
6. Identificativi locali stabili e metadati di versione sono obbligatori.
7. Soft delete e audit sono parte del modello.
8. TEST e RELEASE usano database/prefissi distinti.
9. Cache PWA e database di dominio sono responsabilita diverse.
10. La progettazione deve superare test su Safari iOS.

## 11. Questioni aperte successive

- provider remoto iniziale e relativo formato di autenticazione;
- algoritmo di merge e risoluzione conflitti;
- cifratura locale e cifratura degli export;
- strategia di backup automatico e retention;
- limiti dimensione allegati e comportamento quando quota IndexedDB e esaurita;
- modello di ruoli, membership e permessi multiutente;
- policy di sincronizzazione selettiva per dataset;
- gestione di record modificati su piu dispositivi;
- attivazione e aggiornamento effettivo del service worker;
- telemetria tecnica, mantenendo privacy e funzionamento offline.

## 12. Stato attuale del repository

La codebase attuale contiene Dexie e un servizio di stato online/offline, ma lo schema Dexie e ancora vuoto e non sono presenti repository, `IStorageProvider`, outbox o `SyncEngine`. Questa specifica descrive il contratto architetturale target; l'implementazione deve procedere per incrementi verificabili senza presentare la sincronizzazione come gia disponibile.
