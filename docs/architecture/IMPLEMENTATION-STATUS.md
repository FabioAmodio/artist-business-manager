# Implementation Status

## Scopo

Questo documento fotografa lo stato reale dell'implementazione rispetto alla documentazione di dominio e architettura. Distingue tra funzionalita implementate, parzialmente implementate e solo documentate.

Ultimo aggiornamento: 2026-08-28.

## Priorita di implementazione

Le priorita del progetto sono: UX, chiarezza del codice, coerenza del design system e poi performance. I budget Angular sugli stili dei componenti sono soglie di controllo, non un motivo per impoverire layout, accessibilita o leggibilita. Il budget `anyComponentStyle` e impostato a 8 kB warning e 12 kB errore per lasciare spazio a componenti operativi complessi come Wizard Fiera e Backoffice, mantenendo comunque un limite esplicito.

## Sintesi generale

| Area | Stato | Note |
|---|---|---|
| Shell Angular | Implementata | Layout desktop/mobile, sidebar, topbar, route outlet |
| Routing GitHub Pages | Implementato | `404.html` + redirect query param |
| Offline First base | Implementata V1 | IndexedDB/Dexie attivo come fonte operativa locale; sincronizzazione non blocca il lavoro offline |
| Storage Provider | Implementata V1 | `IStorageProvider`, `IndexedDbProvider`, eliminazione permanente dal Cestino e collection applicative |
| Sync cloud | Parziale | Sincronizzazione automatica e manuale verso File System/Google Drive; conflitti risolti per `updatedAt`, senza outbox persistente |
| Fair / Eventi | Implementata V1 | CRUD, persistenza, validazioni, List First, FairSeries/FairEdition, Ricavi/Bilancio e indicatori copertura costi |
| Party / Clienti / Fornitori | Implementata V1 | CRUD anagrafico, ricerca, filtro, persistenza; Fornitori come ruolo Party |
| Acquisti | Implementata V1 | CRUD acquisti destinati alla vendita, ricerca, fornitore opzionale, persistenza |
| Prodotti | Implementata V1 | CRUD prodotti di catalogo, ricerca, prezzo suggerito, tag placeholder, stato attivo |
| Lotti | Implementata V1 | CRUD lotti, ricerca, Product 1:N, acquisto origine opzionale, alias; pagina non primaria |
| Dashboard | Parziale | Pagina reale; rileva e mostra la Fiera persistita in corso, KPI generali ancora placeholder |
| Impostazioni | Implementata V1 | Trasparenza AI, sorgente persistente, File System, Google Drive OAuth, import/export JSON |
| Operation / Payment | Implementata V1 | Vendite, Lavorazioni, pacchetti con operazioni dettaglio, quantità, data/ora e pagamenti 1:N |
| Work / Sale | Solo documentate | Confini e lifecycle documentati |
| Catalogo / Product / Bundle | Implementata V1 | Prodotti, servizi e pacchetti; ripartizione percentuale/importo e collegamenti predefiniti |
| Finance | Solo documentata | Nessun report finanziario completo |
| Pagamenti | Implementata V1 | Righe Payment 1:N su Operation, anagrafica modalita |
| Scadenze | Implementata V1 | Vista read-only delle lavorazioni aperte ordinate per consegna |
| Import storico Excel | Implementata assistita | Generato dataset storico personale da `data_template.xlsx`; mapping e anomalie verificati manualmente |
| Cestino | Implementata V1 | Ripristino e cancellazione definitiva singola/multipla con selezione tutto |

## Schermate presenti

| Route | Schermata | Stato | Note |
|---|---|---|---|
| `/dashboard` | `DashboardPage` | Parziale | Mostra la Fiera persistita in corso; KPI generali placeholder |
| `/clients` | `ClientsPage` | Implementata V1 | Gestione Party: Persona/Organizzazione, ricerca, filtro, dialog |
| `/suppliers` | `SuppliersPage` | Implementata V1 | Gestione Party con ruolo Fornitore: categoria, ricerca, dialog |
| `/purchases` | `PurchasesPage` | Implementata V1 | Acquisti prodotti destinati alla vendita: fornitore, data, descrizione, importo, note |
| `/lots` | `LotsPage` | Implementata V1 | Pagina tecnica mantenuta; gestione contestuale da Prodotti/Acquisti |
| `/events` | `FairsPage` | Implementata V1 | Gestione FairSeries/FairEdition con dati economici aggregati V1 |
| `/settings` | `SettingsPage` | Implementata V1 | Trasparenza AI e configurazione persistenza/sincronizzazione |
| `/works` | `OperationsPage` | Implementata V1 | Backoffice/registrazione Operazioni con profilo Work/Sale |
| `/sales` | `OperationsPage` | Implementata V1 | Wizard fiera e lista Operazioni |
| `/catalog` | `CatalogPage` | Implementata V1 | Prodotti, servizi e pacchetti con CRUD e componenti |
| `/products` | `ProductsPage` | Implementata V1 | Gestione prodotti e acquisti collegati, alias e collegamento predefinito |
| `/trash` | `TrashPage` | Implementata V1 | Elementi cancellati, ripristino e cancellazione permanente |
| `/finance` | `PlaceholderPage` | Placeholder | Feature documentata ma non implementata |
| `/deadlines` | `DeadlinesPage` | Implementata V1 | Lavorazioni richieste/in corso, scadenze e modifica record |
| `/404` | `NotFoundPage` | Implementata | Pagina errore |
| `/error` | `ErrorPage` | Implementata | Pagina errore generica |

## Servizi presenti

| Servizio | Stato | Responsabilita | Gap |
|---|---|---|---|
| `FairService` | Implementato V1 | CRUD FairEdition, FairSeries implicita, validazioni, soft delete | Non gestisce Booking/FairCost completi, reminder, report |
| `ClientService` | Implementato V1 | CRUD Party, validazione nome, soft delete | Nessuna conversione reale Cliente soft -> Party, nessuna relazione Operation |
| `SupplierService` | Implementato V1 | CRUD Party con ruolo Fornitore, validazione nome, soft delete | Nessuna relazione Acquisti/Spese/Pagamenti |
| `PurchaseService` | Implementato V1 | CRUD Acquisti, validazione data/descrizione/importo, soft delete | Nessun magazzino, prodotti/pagamenti solo collegamenti preparatori |
| `ProductService` | Implementato V1 | CRUD Prodotti, validazione nome/prezzo, normalizzazione tag, soft delete | Nessun workflow commissioni/sketch, vendite, magazzino o composizione bundle |
| `LotService` | Implementato V1 | CRUD Collegamenti/Lotti, validazione nome/prodotto, normalizzazione alias, soft delete | Nessuna assegnazione vendita, costo, giacenza o movimento magazzino |
| `OperationService` | Implementato V1 | CRUD Operazioni, offerta/cliente soft/fiera, soft delete | Nessun workflow avanzato di vendita o commissione |
| `PaymentService` | Implementato V1 | Pagamenti 1:N: importo, data, modalita, soft delete | Nessun report finanziario completo |
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
| `ProductRepository` | Implementato V1 | `products` | Ricerca attiva, filtro stato, ordinamento nome, soft delete |
| `LotRepository` | Implementato V1 | `lots` | Ricerca attiva su nome/alias, filtri prodotto/acquisto, ordinamento nome, soft delete |
| `IOperationRepository` | Solo contratto | nessuna | Nessuna implementazione |
| `IProductRepository` | Contratto + implementazione | `products` | CRUD V1 prodotto centrale |
| `IBundleRepository` | Solo contratto | nessuna | Nessuna implementazione |
| `IClientRepository` | Contratto + implementazione | `parties` | `convertSoftCustomer` e placeholder |

## Persistenza implementata

### IndexedDB / Dexie

Database: `AppDatabase`  
Versione schema: `18`

Collection reali:

- `fairs` legacy;
- `fairSeries`;
- `fairEditions`;
- `lots`;
- `parties`;
- `operations`;
- `paymentMethods`;
- `payments`;
- `products`;
- `purchases`.
- `services`.

### Migrazioni

- Versione 3: migrazione additive da `fairs` verso `fairSeries` e `fairEditions`.
- Versione 4: aggiunta `parties`.
- Versione 5: aggiunta `operations`.
- Versione 6: aggiunta `purchases`.
- Versione 7: aggiunta `products`.
- Versione 8: rimozione indice categoria da `products`, perche il Product V1 non ha categoria.
- Versione 9: aggiunta `lots` per distinguere Product e raggruppamenti operativi.
- Versione 10: rimozione indice `lotId` da `purchases`; la relazione Acquisto -> Lotti vive su `Lot.purchaseId`.
- Versione 11: semplificazione `lots`, rimuovendo campi e indici inventariali dalla V1.
- Versione 12: aggiunta modalita di pagamento e default di sistema.
- Versione 13: aggiunta Servizi e conversione storica Commission/Sketch.
- Versione 14: semplificazione stato lavorazione.
- Versione 15: rimozione stato economico.
- Versione 16-17: introduzione Payment 1:N e rimozione dei campi singoli pagamento/stato vendita da Operation.
- Versione 18: aggiunta data consegna alle lavorazioni.

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
