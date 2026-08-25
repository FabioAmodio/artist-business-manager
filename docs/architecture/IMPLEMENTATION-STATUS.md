# Implementation Status

## Scopo

Questo documento fotografa lo stato reale dell'implementazione rispetto alla documentazione di dominio e architettura. Distingue tra funzionalita implementate, parzialmente implementate e solo documentate.

Ultimo aggiornamento: 2026-08-25.

## Sintesi generale

| Area | Stato | Note |
|---|---|---|
| Shell Angular | Implementata | Layout desktop/mobile, sidebar, topbar, route outlet |
| Routing GitHub Pages | Implementato | `404.html` + redirect query param |
| Offline First base | Parziale | IndexedDB/Dexie attivo, ma solo alcune collection reali |
| Storage Provider | Parziale | `IStorageProvider` e `IndexedDbProvider`, ma supporto collection esplicito e limitato |
| Sync cloud | Solo documentata | `DisabledSyncProvider`, nessun sync engine reale |
| Fair / Eventi | Implementata V1 | CRUD, persistenza, validazioni, List First, FairSeries/FairEdition |
| Party / Clienti / Fornitori | Implementata V1 | CRUD anagrafico, ricerca, filtro, persistenza; Fornitori come ruolo Party |
| Acquisti | Implementata V1 | CRUD acquisti destinati alla vendita, ricerca, fornitore opzionale, persistenza |
| Dashboard | Parziale | Pagina reale ma dati quasi tutti placeholder/in-memory |
| Impostazioni | Parziale | Trasparenza AI e preferenze in memoria |
| Operation | Solo documentata | Modello e ADR definiti, nessuna feature Angular |
| Work / Sale | Solo documentate | Confini e lifecycle documentati |
| Catalogo / Product / Bundle | Solo scheletro | Modelli e contratti, nessuna UI o persistenza concreta |
| Finance / Pagamenti / Incassi | Solo documentata | Nessuna UI o repository reale |
| Scadenze | Solo documentata | Nessuna UI o repository reale |
| Import storico Excel | Solo documentata | Post-MVP/MVP+1 |

## Schermate presenti

| Route | Schermata | Stato | Note |
|---|---|---|---|
| `/dashboard` | `DashboardPage` | Parziale | Usa `FairContextService` in memoria; KPI generali placeholder |
| `/clients` | `ClientsPage` | Implementata V1 | Gestione Party: Persona/Organizzazione, ricerca, filtro, dialog |
| `/suppliers` | `SuppliersPage` | Implementata V1 | Gestione Party con ruolo Fornitore: categoria, ricerca, dialog |
| `/purchases` | `PurchasesPage` | Implementata V1 | Acquisti prodotti destinati alla vendita: fornitore, data, descrizione, importo, note |
| `/events` | `FairsPage` | Implementata V1 | Gestione FairSeries/FairEdition con dati economici aggregati V1 |
| `/settings` | `SettingsPage` | Parziale | Trasparenza AI e preferenze non persistite |
| `/works` | `PlaceholderPage` | Placeholder | Feature documentata ma non implementata |
| `/sales` | `PlaceholderPage` | Placeholder | Feature documentata ma non implementata |
| `/catalog` | `PlaceholderPage` | Placeholder | Feature documentata ma non implementata |
| `/finance` | `PlaceholderPage` | Placeholder | Feature documentata ma non implementata |
| `/deadlines` | `PlaceholderPage` | Placeholder | Feature documentata ma non implementata |
| `/404` | `NotFoundPage` | Implementata | Pagina errore |
| `/error` | `ErrorPage` | Implementata | Pagina errore generica |

## Servizi presenti

| Servizio | Stato | Responsabilita | Gap |
|---|---|---|---|
| `FairService` | Implementato V1 | CRUD FairEdition, FairSeries implicita, validazioni, soft delete | Non gestisce Booking/FairCost completi, reminder, report |
| `ClientService` | Implementato V1 | CRUD Party, validazione nome, soft delete | Nessuna conversione reale Cliente soft -> Party, nessuna relazione Operation |
| `SupplierService` | Implementato V1 | CRUD Party con ruolo Fornitore, validazione nome, soft delete | Nessuna relazione Acquisti/Spese/Pagamenti |
| `PurchaseService` | Implementato V1 | CRUD Acquisti, validazione data/descrizione/importo, soft delete | Nessun magazzino, lotti, prodotti o pagamenti collegati |
| `FairContextService` | Parziale | Stato fiera attiva e AI settings in memoria | Non persistito, dati demo/in-memory, non usa repository |
| `AppStateService` | Parziale | Online/offline, database ready, backup timestamp in memoria | Nessuna gestione quota, sync status, errori persistenti |
| `AppNavigationService` | Implementato base | Navigazione applicativa | Nessuna policy avanzata |
| `AppErrorHandler` | Implementato base | Gestione errori globale | Nessuna UI error feed persistente |

## Repository presenti

| Repository | Stato | Collection | Note |
|---|---|---|---|
| `FairEditionRepository` | Implementato V1 | `fairEditions` | Lista ordinata per `startDate` crescente, soft delete |
| `FairSeriesRepository` | Implementato V1 | `fairSeries` | CRUD base serie fiera |
| `FairRepository` | Legacy compat | `fairs` | Adapter compatibile con vecchio concetto Fair |
| `ClientRepository` | Implementato V1 | `parties` | Ricerca attiva filtrata su clienti legacy/customer/commissioner, ordinamento nome, soft delete |
| `SupplierRepository` | Implementato V1 | `parties` | Ricerca attiva filtrata su ruolo `supplier`, ordinamento nome, soft delete |
| `PurchaseRepository` | Implementato V1 | `purchases` | Ricerca attiva, filtro fornitore, ordinamento per data acquisto decrescente, soft delete |
| `IOperationRepository` | Solo contratto | nessuna | Nessuna implementazione |
| `IProductRepository` | Solo contratto | nessuna | Nessuna implementazione |
| `IBundleRepository` | Solo contratto | nessuna | Nessuna implementazione |
| `IClientRepository` | Contratto + implementazione | `parties` | `convertSoftCustomer` e placeholder |

## Persistenza implementata

### IndexedDB / Dexie

Database: `AppDatabase`  
Versione schema: `6`

Collection reali:

- `fairs` legacy;
- `fairSeries`;
- `fairEditions`;
- `parties`;
- `operations`;
- `purchases`.

### Migrazioni

- Versione 3: migrazione additive da `fairs` verso `fairSeries` e `fairEditions`.
- Versione 4: aggiunta `parties`.
- Versione 5: aggiunta `operations`.
- Versione 6: aggiunta `purchases`.

### Storage Provider

`IndexedDbProvider` implementa `IStorageProvider`, ma in modo ancora minimale:

- supporta collection note tramite allowlist;
- `get`, `list`, `put`, `deleteLogical` funzionano su collection supportate;
- `transaction` e ancora passthrough;
- `health` espone provider, databaseName e versioni;
- nome database costruito da `storagePrefix` + `applicationName`.

Gap:

- nessuna transazione Dexie reale;
- nessun mapping DTO/domain;
- nessuna gestione quota avanzata;
- nessuna outbox;
- nessuna sync;
- nessuna cifratura/export reale.

## Feature completate

### Fair / Eventi V1

Stato: Implementata V1.

Documenti di riferimento:

- `docs/business/DATA-MODEL.md`
- `docs/business/DOMAIN-MODEL-V1.md`
- `docs/business/WORKFLOWS.md`
- `docs/architecture/FAIR-SERIES-EDITIONS.md`
- `docs/business/DATA-QUALITY-VALIDATION.md`

Implementato:

- FairSeries;
- FairEdition;
- CRUD tramite dialog;
- lista List First;
- persistenza IndexedDB;
- cancellazione logica;
- validazioni dominio `FairValidation`;
- dati economici aggregati V1 coerenti con Excel storico;
- indicatori visuali in lista;
- ordinamento per data inizio crescente.

Gap:

- Booking reale;
- FairCost normalizzato;
- scadenze e reminder;
- rimborsi/gettoni come entita economiche;
- consuntivo reale;
- report;
- gestione avanzata degli stati evento/economici.

### Party / Clienti / Fornitori V1

Stato: Implementata V1.

Documenti di riferimento:

- `docs/business/DATA-MODEL.md`
- `docs/business/TERMINOLOGY.md`
- `docs/business/DOMAIN-MODEL-V1.md`
- `docs/architecture/adr/ADR-012-operation-aggregate-root.md`

Implementato:

- Party Persona/Organizzazione;
- CRUD tramite dialog;
- lista List First;
- ricerca;
- filtro per tipo cliente o categoria fornitore;
- persistenza IndexedDB;
- cancellazione logica;
- ruolo `supplier` e categorie fornitore V1;
- `SoftCustomer` come value object preparatorio;
- badge placeholder per relazioni future.

Gap:

- relazioni reali con Operation;
- conversione Cliente soft -> Party;
- ruoli multipli completi;
- collegamento Fornitori ad Acquisti/Spese/Pagamenti;
- deduplicazione;
- import contatti;
- report cliente e fornitore.

## Feature parzialmente implementate

### Dashboard

Stato: Parziale.

Documenti di riferimento:

- `docs/business/REPORTING-REQUIREMENTS.md`
- `docs/business/FAIR-MODE-AND-AI-TRANSPARENCY.md`

Implementato:

- pagina reale;
- switch visuale tra contesto generale e fiera attiva;
- KPI fiera basati su `FairContextService` in memoria;
- CTA contestuali.

Gap:

- nessuna query su IndexedDB;
- nessun reporting reale;
- nessun dato Operation/Sale/Payment;
- nessuna metrica storica.

### Settings / Trasparenza AI

Stato: Parziale.

Documenti di riferimento:

- `docs/business/FAIR-MODE-AND-AI-TRANSPARENCY.md`

Implementato:

- pagina informativa Trasparenza AI;
- preferenze AI in memoria.

Gap:

- persistenza settings;
- sezione informazioni completa;
- nessuna integrazione AI reale;
- nessuna gestione tema funzionante.

### Shell / Navigation / Responsive

Stato: Implementata base.

Documenti di riferimento:

- `docs/architecture/NAVIGATION-ROUTING-IMPLEMENTATION.md`
- `docs/testing/NAVIGATION-RESPONSIVE-TEST-GUIDE.md`

Implementato:

- shell applicativa;
- sidebar desktop;
- navigazione responsive;
- mobile action bar;
- GitHub Pages SPA redirect;
- componenti con template/scss separati.

Gap:

- theme toggle non funzionante;
- bottom navigation non collegata a tutte le azioni reali;
- nessuna policy route avanzata.

## Funzionalita solo documentate

| Area | Documenti principali | Stato |
|---|---|---|
| Operation aggregate root | `ADR-012-operation-aggregate-root.md`, `OPERATION-LIFECYCLE.md` | Solo documentata |
| Work/Sale boundaries | `WORK-SALES-BOUNDARIES.md` | Solo documentata |
| Operation lifecycle | `OPERATION-LIFECYCLE.md` | Solo documentata |
| Operation feature | `DOMAIN-MODEL-V1.md`, `APPLICATION-ARCHITECTURE-PROPOSAL.md` | Solo documentata |
| Work/Commission feature | `WORKFLOWS.md`, `OPERATION-LIFECYCLE.md` | Solo documentata |
| Sales feature | `WORK-SALES-BOUNDARIES.md`, `REPORTING-REQUIREMENTS.md` | Solo documentata |
| Product / Bundle catalog | `CONFIG-ARCHITECTURE.md`, `BUNDLES-AND-ACCOUNTING.md` | Solo documentata |
| Finance / Payment / Income | `DATA-MODEL.md`, `REPORTING-REQUIREMENTS.md` | Solo documentata |
| Deadlines | `WORKFLOWS.md`, `OPERATION-LIFECYCLE.md` | Solo documentata |
| Historical Excel migration | `HISTORICAL-DATA-MIGRATION.md` | Solo documentata |
| Cloud sync | `OFFLINE-FIRST-PERSISTENCE.md` | Solo documentata |
| Multi-user collaboration | `OFFLINE-FIRST-PERSISTENCE.md`, `ROADMAP.md` | Solo documentata |
| Theme system manual selection | `DESIGN-SYSTEM.md`, `ARCHITECTURE.md` | Solo documentata/partial CSS |
| PWA service worker | `ARCHITECTURE.md`, `DEPLOYMENT-VERIFICATION.md` | Solo documentata |

## Feature WIP

| Feature | Stato | Prossimo passo consigliato |
|---|---|---|
| Fair/Eventi | WIP dopo V1 | Booking, scadenze, stati, report e normalizzazione costi |
| Party/Clienti | WIP dopo V1 | conversione Cliente soft e collegamento Operation |
| Offline persistence | WIP | transazioni reali, repository Operation, errori quota |
| Theme system | WIP | ThemeService o decisione CSS-only, token completi, toggle funzionante |
| Dashboard | WIP | query reali da repository e metriche Operation/Fair |

## Stato test e build

Test presenti:

- FairService;
- FairValidation;
- FairEditionRepository;
- ClientService;
- ClientRepository;
- IndexedDbProvider;
- App shell;
- PlaceholderPage.

Ultimo stato noto:

- build: superata;
- test: `14/14` superati;
- `git diff --check`: pulito.

## Gap trasversali aperti

- Nessuna feature Operation reale.
- Nessun repository Operation implementato.
- Nessuna gestione Payment/Income reale.
- Nessuna scadenza persistita.
- Nessuna dashboard/reportistica reale.
- Sync e collaborazione non implementate.
- Import/export non implementato.
- Service worker PWA non verificato come attivo.
- Theme toggle presente ma non operativo.
- `IndexedDbProvider.transaction()` non usa ancora transazioni Dexie reali.
- Alcuni documenti storici dichiarano target piu avanzati dello stato implementato.
