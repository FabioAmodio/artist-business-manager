# Implementation Status

## Scopo

Fotografia dello stato reale dell'applicazione rispetto ai documenti di dominio e architettura.

Ultimo aggiornamento: 2026-09-01.

## Sintesi

| Area | Stato | Note |
|---|---|---|
| Shell e navigazione | Implementata V1 | Topbar globale, sidebar desktop, action bar mobile, 12 voci di menu, header pagina configurabile |
| Routing GitHub Pages | Implementato | `404.html` e ripristino deep-link tramite query parameter |
| Offline first | Implementata V1 | IndexedDB/Dexie come fonte locale, import/export JSON, File System e Google Drive |
| Sincronizzazione | Implementata V1 | Sync automatico/manuale e risoluzione per `updatedAt`; manca una outbox persistente |
| Dashboard / Riepilogo | Implementata V1 | Vista annuale e vista fiera operativa con deep-link filtrati |
| Modalita Fiera | Implementata V1 | Rilevamento automatico, forzatura persistente, indicatore globale e uscita confermata |
| Eventi / Fiere | Implementata V1 | Serie/edizioni, CRUD, validazioni, costi, ricavi, bilancio e copertura |
| Operazioni | Implementata V1 | Vendite, lavorazioni e bundle sulla stessa aggregate root |
| Pagamenti | Implementata V1 | Payment 1:N, acconti/saldi, modalita di pagamento e registrazione rapida |
| Catalogo | Implementata V1 | Prodotti, servizi e bundle, disponibilita derivata e collegamenti agli acquisti |
| Anagrafiche | Implementata V1 | Clienti e fornitori con ricerca, filtri e soft delete |
| Acquisti e collegamenti | Implementata V1 | Acquisti, lotti/collegamenti, alias e bilancio per acquisto |
| Scadenze | Implementata V1 | Lavorazioni aperte, badge temporali e deep-link alla lavorazione |
| Cestino | Implementata V1 | Ripristino e cancellazione permanente singola/multipla |
| Finanza dedicata | Placeholder | Il riepilogo annuale copre il bilancio V1; la route `/finance` resta futura |

## Navigazione corrente

Ordine delle 12 voci definito in `src/app/core/navigation/app-navigation-config.ts`:

1. Riepilogo;
2. Vendite;
3. Lavori;
4. Scadenze;
5. Clienti;
6. Catalogo;
7. Acquisti;
8. Fornitori;
9. Eventi;
10. Pagamenti;
11. Impostazioni;
12. Cestino.

La sidebar e visibile da 700 px. Sotto i 700 px viene sostituita dalla action bar fissa; il contenuto riserva lo spazio necessario per non essere coperto. Il topbar contiene nome applicazione, titolo/icona pagina, azioni contestuali, filtro anno opzionale e indicatore della modalita fiera forzata.

## Schermate

| Route | Componente | Stato | Funzione |
|---|---|---|---|
| `/dashboard` | `DashboardPage` | Implementata V1 | Riepilogo annuale o dashboard fiera |
| `/sales` | `OperationsPage` | Implementata V1 | Vendite, wizard rapido, filtri anno/fiera/offerta |
| `/works` | `OperationsPage` | Implementata V1 | Lavorazioni e filtri per stato/saldo/anno |
| `/deadlines` | `DeadlinesPage` | Implementata V1 | Lavorazioni richieste/in corso ordinate per consegna |
| `/clients` | `ClientsPage` | Implementata V1 | Clienti Persona/Organizzazione |
| `/catalog` | `CatalogPage` | Implementata V1 | Prodotti, servizi e bundle |
| `/products` | `ProductsPage` | Implementata V1 | Gestione tecnica prodotti e collegamenti |
| `/purchases` | `PurchasesPage` | Implementata V1 | Acquisti con filtro anno |
| `/suppliers` | `SuppliersPage` | Implementata V1 | Fornitori e categorie |
| `/lots` | `LotsPage` | Implementata V1 | Collegamenti/lotti tecnici |
| `/events` | `FairsPage` | Implementata V1 | Edizioni fiera, dati economici e filtro anno |
| `/payment-methods` | `PaymentMethodsPage` | Implementata V1 | Modalita di pagamento |
| `/settings` | `SettingsPage` | Implementata V1 | Persistenza, sync, import/export e trasparenza AI |
| `/trash` | `TrashPage` | Implementata V1 | Cestino applicativo |
| `/finance` | `PlaceholderPage` | Futuro | Reporting finanziario dedicato |

## Dashboard annuale

La vista generale usa per default l'anno corrente e permette di cambiare anno con frecce; su mobile supporta lo swipe orizzontale. Il range min/max deriva da Operazioni, Acquisti e Fiere registrati.

Metriche:

- **Lavorazioni globali**, indipendenti dall'anno: Da fare (`requested`), In lavorazione (`in-progress`), Da consegnare (`completed`) e Da saldare; una seconda riga mostra il totale dell'anno selezionato.
- **Fiere annuali**: concluse nell'anno, bilancio annuale, prossime fiere e prossima edizione.
- **Bilancio annuale**: uscite da Acquisti e costi Fiere; entrate da vendite in fiera/non fiera e rimborsi; dettaglio per prodotto, servizio o bundle.

Le metriche sono calcolate da funzioni pure in `domain/shared/annual-dashboard.ts`. I valori cliccabili aprono le pagine di origine con query parameter reali (`year`, `workFilter`, `fairFilter`, `fairScope`, `offer`). Le pagine mostrano filtri espliciti e pannelli ricerca richiudibili.

## Dashboard fiera

Quando esiste una fiera attiva, la Dashboard mostra:

- la stessa sintesi economica della lista Eventi, senza azioni amministrative;
- costi, ricavi, rimborso, bilancio e indicatori di copertura;
- lavorazioni `requested`/`in-progress` con transizione rapida verso In corso o Consegnata;
- vendite della fiera ordinate per data decrescente;
- registrazione di pagamenti completi o parziali nel limite del residuo;
- creazione rapida della vendita tramite dialog.

Il titolo Dashboard permette uno switch locale e temporaneo tra nome fiera e Riepilogo annuale, senza uscire dalla Modalita Fiera.

## Modalita fiera forzata

`ActiveFairService` e la sorgente globale del contesto fiera:

- precedenza: fiera forzata valida, poi fiera attiva per data;
- persistenza in `appSettings` con id `forced-fair-mode`;
- pulizia automatica di riferimenti non piu validi;
- scelta da dialog in fondo al Riepilogo quando non esiste una fiera reale attiva;
- indicatore `Forzata` nel topbar di ogni pagina;
- uscita soltanto dopo conferma dell'utente.

Il wizard vendita e il FAB mobile usano la fiera risolta dal servizio globale.

## Catalogo e Operazioni

Il Catalogo unifica:

- Prodotti con prezzo suggerito e stato attivo;
- Servizi disponibili, inclusi `COMMISSION` e `SKETCH` di sistema;
- Bundle con prezzo e componenti; la disponibilita richiede bundle attivo, almeno un componente e tutti i riferimenti prodotto/servizio disponibili.

Le viste `/sales` e `/works` sono profili dello stesso `OperationsPage`. I bundle sono salvati come operazione padre piu righe figlie; i pagamenti appartengono al padre e vengono ripartiti proporzionalmente per visualizzare le quote figlie. La distribuzione monetaria usa Largest Remainder Method e conserva la somma ai centesimi senza importi negativi.

## Persistenza

Database Dexie: `artist-business-manager`, schema `21`.

Collection correnti:

- `appSettings`;
- `bundles`;
- `fairs` (legacy);
- `fairSeries`;
- `fairEditions`;
- `lots`;
- `operations`;
- `paymentMethods`;
- `payments`;
- `parties`;
- `products`;
- `purchases`;
- `services`.

`FairEditionRepository` ordina le edizioni per `startDate` decrescente. `OperationRepository` ordina per `operationDate` (fallback `createdAt`) decrescente.

## UX liste

Le liste condividono heading, card, badge e azioni compatte. I pannelli ricerca sono chiusi di default e si aprono dal pulsante nel list heading; un indicatore segnala filtri non predefiniti. I filtri anno sono nel topbar per Vendite/Lavori/Operazioni, Eventi e Acquisti. Il Catalogo filtra per tipo; Vendite filtra per prodotto, servizio o bundle.

## Gap principali

- outbox persistente e gestione conflitti avanzata;
- transazioni Dexie reali nel provider astratto;
- reporting finanziario dedicato, confronti multi-anno ed export metriche;
- Booking e FairCost normalizzati;
- conversione strutturata Cliente soft -> Party;
- stock, movimenti e giacenze;
- gestione esplicita di piu fiere realmente sovrapposte;
- tema selezionabile e integrazioni AI operative.

## Verifica

La build Angular e i test mirati su aggregazioni annuali, transizioni Operazione e modalita fiera forzata risultano superati al 2026-09-01. Restano warning sul budget SCSS di Dashboard e Operations, senza errori di compilazione.
