# Proposta di architettura applicativa

## Stato e scopo

Questo documento definisce lo scheletro tecnico implementabile di Artist Business Manager. Non implementa funzionalita complete e non introduce dipendenze cloud. E la proposta di riferimento per organizzare il codice attorno al Domain Model v1 e alla strategia Offline First.

Obiettivi prioritari:

- comprensibilita per uno o due sviluppatori;
- separazione netta tra dominio, casi d'uso, UI e persistenza;
- funzionamento locale senza rete;
- sostituzione futura di storage e sync senza riscrivere il dominio;
- crescita graduale, evitando una struttura enterprise prematura.

## 1. Architettura proposta

L'applicazione usa Angular standalone, Signals per lo stato UI e Dexie solo nell'adapter IndexedDB. Il dominio resta TypeScript puro e non importa Angular.

```text
UI / Layout / Feature Components
              |
              v
Application Services
              |
              v
Domain Models + Domain Rules
              |
              v
Repository Interfaces
              |
              v
IStorageProvider
              |
              v
IndexedDbProvider (prima implementazione)
              |
              v
IndexedDB / Dexie
```

La sincronizzazione futura e laterale rispetto al percorso di lettura e scrittura locale e non fa parte del breve periodo:

```text
local commit -> Outbox -> SyncEngine -> ISyncProvider opzionale
```

Il dominio non deve conoscere IndexedDB, Dexie, LocalStorage, HTTP, Google Drive o altri provider.

## 2. Struttura cartelle completa

```text
src/app/
  core/
    configuration/
      app-environment.ts
      environment.tokens.ts
      environment.providers.ts
    models/
      persistence-metadata.ts
      operation-models.ts
    repositories/
      client.repository.ts
      operation.repository.ts
      fair.repository.ts              legacy compatibility
      fair-series.repository.ts
      fair-edition.repository.ts
      product.repository.ts
      bundle.repository.ts
    storage/
      storage-provider.ts
      indexed-db.provider.ts
      indexed-db.schema.ts
      storage-errors.ts
    services/
      app-state.service.ts
      clock.service.ts
    guards/
    interceptors/
    navigation/
  domain/
    models/
      operation.ts
      fair.ts                         FairSeries and FairEdition
      party.ts
      product.ts
      bundle.ts
      finance.ts
      deadline.ts
    rules/
      operation-state-machine.ts
      fair-rules.ts
      pricing-rules.ts
      completeness-rules.ts
      accounting-rules.ts
    repositories/
      client-repository.ts
      operation-repository.ts
      fair-repository.ts
      product-repository.ts
      bundle-repository.ts
    value-objects/
      entity-id.ts
      money.ts
      date-range.ts
      soft-customer.ts
    errors/
      domain-errors.ts
  application/
    operations/
      operation.service.ts
      operation.view-models.ts
    fairs/
      fair.service.ts
      fair.view-models.ts
    dashboard/
      dashboard.service.ts
      dashboard.view-models.ts
    clients/
      client.service.ts
      client-search.service.ts
    catalog/
      product.service.ts
      bundle.service.ts
  features/
    dashboard/
    fairs/
    operations/
    clients/
    products/
    settings/
  shared/
    components/
        form-actions.component.ts
    directives/
    pipes/
    utils/
    types/
      async-state.ts
      pagination.ts
  layout/
    shell/
    mobile-navigation/
    desktop-navigation/
    fair-context/

src/environments/
  environment.test.ts
  environment.prod.ts

docs/
  architecture/
  business/
```

Regola pratica: `core` condivide infrastruttura e servizi trasversali; `domain` contiene regole pure; `application` contiene Repository-facing Application Services; `features` contiene schermate; `layout` contiene shell e navigazione; `shared` contiene solo elementi realmente riutilizzabili e privi di logica di business.

Ogni pagina di inserimento o modifica deve usare una dialog centrata come superficie predefinita, mantenendo la lista come contenuto principale. Drawer laterali sono ammessi solo quando motivati da un workflow specifico. La dialog deve usare il controllo condiviso `FormActionsComponent`: Salva e Annulla restano vicini, con stili distinti e ordine coerente. Annulla modifica solo lo stato del form non ancora salvato e non altera i dati persistiti.

La Facade non e un livello obbligatorio. Si introduce solo quando una schermata ha reale stato locale complesso o orchestrazione tra piu servizi. Non introdurre Command Handler, Mediator, Event Bus o un Use Case dedicato per ogni operazione nel MVP.

## 3. Modelli

### Entity Model

Collocazione: `src/app/domain/models`.

Rappresenta entita e invarianti persistenti del Domain Model v1. Il primo incremento implementa solo `Operation` e `Fair`; `Product` e `Bundle` seguono come catalogo minimo. Stock, magazzino e inventario avanzato non fanno parte del primo MVP.

Il modello deve usare identificativi stabili, date ISO, importi tipizzati e metadati di persistenza. Non deve contenere decoratori Angular o tipi Dexie.

Ogni entita persistente deve avere almeno:

```typescript
interface PersistenceMetadata {
  createdAt: IsoDateTime;
  updatedAt: IsoDateTime;
  deletedAt?: IsoDateTime;
  createdBy?: EntityId;
  updatedBy?: EntityId;
  deletedBy?: EntityId;
  schemaVersion: number;
  migrationVersion: number;
}
```

`createdBy`, `updatedBy` e `deletedBy` sono opzionali nella fase single-user, ma vengono previsti fin da subito per debugging, cancellazione logica, sincronizzazione e futura collaborazione.

### View Model

Collocazione: `src/app/application/*/*.view-models.ts` oppure vicino alla facade.

Adatta il dominio alla UI: KPI fiera, stato di caricamento, errori presentabili, label, filtri, sezioni dashboard e azioni disponibili. Non viene persistito e non deve diventare il modello di dominio.

### DTO futuri

Collocazione: `src/app/core/models/dto` o nel futuro adapter del provider.

I DTO descrivono contratti esterni: schema IndexedDB mappato, export/import, sync cloud o API. Non devono essere usati direttamente dai componenti. Mapper espliciti convertono DTO in Entity Model e viceversa.

### Tipi condivisi

Collocazione: `src/app/shared/types` per tipi UI generici e `src/app/domain/value-objects` per tipi con semantica di dominio. Esempi: `Result<T>`, `AsyncState<T>`, `EntityId`, `Money`, `DateRange`, `SoftCustomer`, `Pagination`.

## 4. Repository da creare

I repository espongono operazioni di dominio e nascondono il provider concreto. Sono contratti nel domain/application layer e implementazioni in `core/storage` o `core/repositories`.

### IOperationRepository

Responsabilita: Operazioni, transizioni, incompletezza, riferimenti fieristici, incassi e righe.

Metodi suggeriti:

```typescript
interface IOperationRepository {
  getById(id: EntityId): Promise<Operation | null>;
  list(filter?: OperationFilter): Promise<readonly Operation[]>;
  save(operation: Operation): Promise<void>;
  transition(id: EntityId, transition: OperationTransition): Promise<Operation>;
  markComplete(id: EntityId, patch: OperationCompletionPatch): Promise<Operation>;
  softDelete(id: EntityId, reason?: string): Promise<void>;
}
```

### IFairRepository

Responsabilita: serie di fiere, edizioni, date attive, costi, partecipazioni e selezione del contesto. Il filtro temporale appartiene alle edizioni.

```typescript
interface IFairRepository {
  getById(id: EntityId): Promise<Fair | null>;
  list(filter?: FairFilter): Promise<readonly Fair[]>;
  findActive(onDate: CalendarDate): Promise<readonly Fair[]>;
  save(fair: Fair): Promise<void>;
  saveCost(cost: FairCost): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
```

Per il nuovo codice usare `IFairSeriesRepository` e `IFairEditionRepository`. `IFairRepository` resta temporaneamente il contratto legacy per le API esistenti e rappresenta solo una `FairEdition`.

```typescript
interface IFairSeriesRepository {
  getById(id: EntityId): Promise<FairSeries | null>;
  list(filter?: FairSeriesFilter): Promise<readonly FairSeries[]>;
  save(series: FairSeries): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}

interface IFairEditionRepository {
  getById(id: EntityId): Promise<FairEdition | null>;
  list(filter?: FairFilter): Promise<readonly FairEdition[]>;
  listBySeries(seriesId: EntityId): Promise<readonly FairEdition[]>;
  findActive(onDate: CalendarDate): Promise<readonly FairEdition[]>;
  save(edition: FairEdition): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
```

### IClientRepository

Responsabilita: Party registrati, ricerca autocomplete e conversione del Cliente soft.

```typescript
interface IClientRepository {
  getById(id: EntityId): Promise<Party | null>;
  search(query: string, limit?: number): Promise<readonly Party[]>;
  save(client: Party): Promise<void>;
  convertSoftCustomer(operationId: EntityId, partyId: EntityId): Promise<void>;
}
```

### ISupplierRepository

Responsabilita: Party con ruolo fornitore, ricerca rapida e persistenza dell'anagrafica minimale da collegare in futuro ad Acquisti, Spese e Pagamenti.

```typescript
interface ISupplierRepository {
  getById(id: EntityId): Promise<Party | null>;
  search(query: string, limit?: number): Promise<readonly Party[]>;
  save(supplier: Party): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
```

### IProductRepository

Responsabilita: prodotti di catalogo, inclusi Stampa A4, Sketch, Commissione e Bundle come record prodotto. Stock, gestione lotti, soglie, movimenti di magazzino, composizione bundle avanzata e inventario avanzato sono rinviati.

### IPurchaseRepository

Responsabilita: acquisti di prodotti destinati alla vendita, con fornitore opzionale e riferimenti futuri a prodotto e lotto. Non gestisce ammortamento, statistiche, magazzino o vendite.

```typescript
interface IPurchaseRepository {
  getById(id: EntityId): Promise<Purchase | null>;
  list(filter?: PurchaseFilter): Promise<readonly Purchase[]>;
  save(purchase: Purchase): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
```

```typescript
interface IProductRepository {
  getById(id: EntityId): Promise<Product | null>;
  list(filter?: ProductFilter): Promise<readonly Product[]>;
  save(product: Product): Promise<void>;
  softDelete(id: EntityId): Promise<void>;
}
```

### IBundleRepository

Responsabilita: bundle, componenti, categorie ereditate, override e snapshot pricing.

```typescript
interface IBundleRepository {
  getById(id: EntityId): Promise<Bundle | null>;
  list(): Promise<readonly Bundle[]>;
  save(bundle: Bundle): Promise<void>;
  resolveConfiguration(id: EntityId): Promise<BundleConfiguration>;
}
```

Repository futuri possono coprire `IExpenseRepository`, `IReceiptRepository`, `IDeadlineRepository` e `IAuditRepository`. Non creare repository per ogni componente UI.

## 5. IStorageProvider

Il contratto storage e infrastrutturale e deve supportare transazioni locali, soft delete, query e metadati di sync senza imporre un backend.

```typescript
interface IStorageProvider {
  open(): Promise<void>;
  close(): Promise<void>;
  get<T>(collection: string, id: EntityId): Promise<T | null>;
  list<T>(collection: string, filter?: StorageFilter): Promise<readonly T[]>;
  put<T>(collection: string, value: T): Promise<void>;
  deleteLogical(collection: string, id: EntityId, metadata?: DeleteMetadata): Promise<void>;
  transaction<T>(collections: readonly string[], work: () => Promise<T>): Promise<T>;
  health(): Promise<StorageHealth>;
}
```

Il contratto deve restituire errori tipizzati per database non disponibile, quota esaurita, schema incompatibile e transazione fallita. Il commit locale e completato prima del ritorno di successo del caso d'uso.

Il provider deve esporre e aggiornare `schemaVersion` e `migrationVersion`. Le migrazioni IndexedDB sono versionate, testabili e separate dalle regole del dominio; una migrazione fallita non deve dichiarare il database pronto.

### Prima implementazione: IndexedDbProvider

`IndexedDbProvider`:

- usa Dexie e IndexedDB;
- costruisce il nome database dalla configurazione ambiente e da `storagePrefix`;
- gestisce schema, versioni, indici e migrazioni;
- non espone oggetti Dexie ai repository o alla UI;
- supporta transazioni per Operazione, righe, incassi e movimenti;
- registra metadati `revision`, `updatedAt`, `deletedAt` e `syncStatus`;
- gestisce errori di quota e disponibilita con `StorageError`.

Non implementare ancora tutta la tabella di dominio: il primo incremento puo fornire `open`, `health`, una collection di prova e una transazione minima, accompagnate da test.

### Provider futuri

- `GoogleDriveProvider`: trasferimento o sync di dataset tramite Drive;
- `OneDriveProvider`: provider Microsoft equivalente;
- `DropboxProvider`: provider file alternativo;
- `FutureBackendProvider`: API remota multiutente.

Questi provider sono un'evoluzione futura e non devono avere implementazioni concrete nel breve periodo. `SyncEngine` e `ISyncProvider` sono anch'essi contratti futuri e non fanno parte dell'MVP. Non devono modificare `OperationService`, il dominio o i componenti.

## 6. Servizi applicativi e UI

### Repository

Persistono e recuperano dati. Non decidono il flusso utente e non formattano dati per la schermata.

### Application Service

Coordina un caso d'uso e applica regole: valida, carica entita, invoca regole di dominio, salva tramite repository e restituisce risultato. Esempio: `OperationService.createQuickFairCommission()` salva anche un record incompleto senza attendere rete.

### Facade opzionale

Si introduce solo quando esiste una reale necessita di stato o orchestrazione complessa. Nel percorso semplice il Component puo chiamare direttamente l'Application Service e gestire uno stato locale minimo. Non contiene query Dexie.

### UI Component

Raccoglie input, mostra stato e invoca comandi della facade. Non importa repository, provider o modelli DTO.

```text
OperationFormComponent
  |
  v
OperationService
        |
        v
IOperationRepository
        |
        v
IStorageProvider
```

## 7. Dependency Injection

Usare token Angular per contratti infrastrutturali:

```typescript
export const STORAGE_PROVIDER = new InjectionToken<IStorageProvider>('STORAGE_PROVIDER');
export const SYNC_PROVIDER = new InjectionToken<ISyncProvider>('SYNC_PROVIDER');
```

`app.config.ts` fornisce `IndexedDbProvider` dietro `STORAGE_PROVIDER`. L'implementazione concreta puo cambiare tramite provider di ambiente senza modificare i servizi applicativi:

```typescript
{ provide: STORAGE_PROVIDER, useClass: IndexedDbProvider }
```

Per TEST usare `TestStorageProvider` o un database con prefisso isolato. Per RELEASE usare `IndexedDbProvider` con `ABM-PROD`. `SYNC_PROVIDER` puo essere un `DisabledSyncProvider` finche non esiste una sync reale.

La DI non deve selezionare provider in base a `navigator.onLine`: la rete influenza la sync, non la fonte operativa locale.

## 8. Ambienti

Creare `src/environments/environment.test.ts` e `environment.prod.ts` con forma comune:

```typescript
export interface AppEnvironment {
  applicationName: string;
  environmentName: 'test' | 'release';
  storagePrefix: string;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  syncEnabled: boolean;
  version: string;
  futureEndpoint?: string;
}
```

Valori iniziali:

```text
TEST:    Artist Business Manager, test, ABM-TEST, debug, sync false
RELEASE: Artist Business Manager, release, ABM-PROD, warn, sync false
```

La configurazione deve essere sostituibile in build Angular. Lo stesso browser deve poter usare entrambi gli ambienti senza condividere database o export impliciti.

## 9. Dipendenze consentite tra layer

```text
features -> application -> domain
layout   -> application/facade
application -> domain + repository interfaces
repository adapters -> domain + IStorageProvider
IndexedDbProvider -> Dexie + IStorageProvider
shared -> solo shared/domain types generici
```

Vietato:

- UI -> Dexie/IndexedDB;
- domain -> Angular/Dexie/browser;
- feature -> adapter concreto;
- repository -> componenti UI;
- DTO esterni usati come Entity Model;
- sync cloud necessaria per completare un salvataggio locale.

## 10. Roadmap tecnica

### Incremento 1: ambienti e DI

1. Creare environment TEST/RELEASE.
2. Definire `AppEnvironment`.
3. Definire `storagePrefix`.
4. Configurare Dependency Injection senza introdurre sync.

### Incremento 2: contratto storage

1. Creare `IStorageProvider`.
2. Definire `StorageHealth`.
3. Definire `StorageError`.
4. Formalizzare metadati audit comuni.

### Incremento 3: IndexedDbProvider minimale

1. Implementare `IndexedDbProvider` minimale.
2. Supportare `open()` e `health()`.
3. Usare `schemaVersion` e `migrationVersion`.
4. Verificare inizializzazione, errore e isolamento TEST/RELEASE.

### Incremento 4: entita fondamentali

1. Definire e validare entita `FairSeries`, `FairEdition` e `Operation`.
2. Applicare stati, regole di completezza e metadati audit.
3. Aggiungere test di dominio senza UI.

### Incremento 5: repository fondamentali

1. Creare `IFairSeriesRepository` e `IFairEditionRepository`.
2. Mantenere `IFairRepository` come compatibilita deprecata.
3. Creare `IOperationRepository`.
4. Collegare i repository a `IStorageProvider` senza esporre Dexie.
5. Testare salvataggio, consultazione e cancellazione logica offline.

### Incremento 6: prima schermata reale

1. Implementare la schermata Gestione Fiere con serie ed edizioni.
2. Consentire creazione, modifica, consultazione e cancellazione logica.
3. Verificare persistenza dopo reload e assenza rete.

### Incremento 7: inserimento rapido

1. Implementare registrazione rapida di Operazione/Commissione.
2. Supportare record incompleti e completamento successivo.
3. Collegare fiera di origine, consegna e contabilizzazione.
4. Aggiungere lo scadenziario minimo per Operazioni da completare.

## MVP e funzionalita rinviate

Il primo MVP ha un obiettivo deliberatamente ristretto: registrare e consultare persistentemente fiere e commissioni anche completamente offline.

Nel perimetro fiere, il MVP comprende `FairSeries` e `FairEdition`; `FairTask`, `ContactLog` e `Reservation` sono post-MVP. `Reservation` resta comunque un tipo di `Operation`.

Dashboard avanzata, analytics, catalogo esteso, stock/magazzino, inventario avanzato e sincronizzazione cloud non sono obiettivi del primo MVP. `SyncEngine` e `ISyncProvider` restano contratti e decisioni future, senza implementazioni concrete nel breve periodo.

Il reporting futuro avra due livelli: `FairEdition` per risultati e confronti della singola edizione; `FairSeries` per trend, medie e aggregazioni tra edizioni. `FairTask`, `ContactLog` e i dati specifici di `Reservation` sono post-MVP; Reservation resta un tipo di Operation.

## 11. Criteri di accettazione dello scheletro

Lo scheletro e pronto quando:

- nessun componente importa Dexie;
- i repository usano solo contratti;
- `IndexedDbProvider` e sostituibile tramite DI;
- TEST e RELEASE usano storage distinti;
- un'Operazione puo essere salvata offline e riletta dopo reload;
- i View Model non vengono persistiti;
- build e test coprono i contratti principali;
- la documentazione indica chiaramente cosa e implementato e cosa e target.

## 12. Decisioni ancora aperte

La migrazione Excel personale non e un prerequisito dello scheletro o del primo MVP. Il backup JSON dell'app e il formato ufficiale di backup/ripristino; l'import Excel e un adapter legacy amministrativo separato, da introdurre dopo la validazione reale.

- schema fisico definitivo e strategia migrazioni;
- scelta del formato export e compatibilita versioni;
- provider cloud iniziale;
- algoritmo di conflitto multiutente;
- cifratura locale e backup;
- strategia allegati e quota Safari iOS;
- attivazione effettiva del service worker PWA;
- granularita dei repository per finanza e catalogo.
