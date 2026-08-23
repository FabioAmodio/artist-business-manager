# Architecture Decision Records

Questa raccolta documenta le decisioni architetturali che vincolano il progetto. Gli ADR descrivono il perche delle scelte e non costituiscono codice, schema di database o specifica di implementazione completa.

## Indice

1. [Angular standalone](#adr-001-angular-standalone)
2. [Signals per lo stato](#adr-002-signals-per-lo-stato)
3. [IndexedDB come persistenza locale](#adr-003-indexeddb-come-persistenza-locale)
4. [Dexie come adapter IndexedDB](#adr-004-dexie-come-adapter-indexeddb)
5. [PWA offline-first](#adr-005-pwa-offline-first)
6. [GitHub Pages come hosting](#adr-006-github-pages-come-hosting)
7. [Nessun backend](#adr-007-nessun-backend)
8. [Party come anagrafica unica](#adr-008-party-come-anagrafica-unica)
9. [Import/export come backup ufficiale](#adr-009-importexport-come-backup-ufficiale)
10. [Branch, ambienti e promozione](adr/ADR-010-git-and-environments.md)
11. [Gradual Adoption](adr/ADR-011-gradual-adoption.md)

## Stato degli ADR

Tutti gli ADR sono **Accettati** per la prima versione del prodotto. Una modifica a una decisione deve aggiornare questo documento, `ARCHITECTURE.md`, il modello concettuale e gli eventuali requisiti di reporting interessati.

---

## ADR-001: Angular standalone

**Stato:** Accettato  
**Data:** 2026-08-21

### Contesto

L'applicazione e una web app personale composta da feature indipendenti, con route lazy-loadable e componenti riutilizzabili. La struttura deve rendere chiari i confini tra feature senza introdurre moduli contenitore privi di responsabilita.

### Decisione

Usare Angular con standalone components e configurazione standalone. Le pagine, i componenti, le direttive e i provider applicativi sono autonomi e importano esplicitamente cio che utilizzano.

### Alternative considerate

- NgModule come organizzazione principale dell'applicazione.
- Un framework diverso da Angular.

### Conseguenze

- le dipendenze di ogni componente sono visibili localmente;
- il lazy loading delle feature e piu diretto;
- si riduce la struttura cerimoniale dei moduli;
- eventuali librerie che richiedono NgModule potranno essere adattate ai confini standalone senza cambiare il dominio.

### Revisione

La decisione va rivalutata solo se un requisito di libreria o di build rende impossibile mantenere componenti standalone senza un costo sproporzionato.

---

## ADR-002: Signals per lo stato

**Stato:** Accettato  
**Data:** 2026-08-21

### Contesto

La maggior parte dello stato e locale al browser: liste, filtri, dettaglio corrente, stato di caricamento, dati derivati e indicatori della Dashboard. Serve una forma reattiva leggibile e adatta a dati derivati senza introdurre un event bus globale.

### Decisione

Usare Angular Signals per stato locale, stato delle facade e valori derivati. Le facade espongono Signals read-only alla UI e concentrano i comandi di modifica. RxJS resta ammesso per stream asincroni o integrazioni che lo richiedono, ma non e la fonte predefinita dello stato applicativo.

### Alternative considerate

- stato imperativo nei componenti;
- store globale obbligatorio per ogni feature;
- RxJS come unico meccanismo di stato.

### Conseguenze

- dipendenze e derivazioni sono esplicite;
- la UI non deve conoscere la persistenza;
- bisogna evitare Signals duplicati rispetto ai dati persistiti;
- le aggregazioni della Dashboard devono avere una fonte ricostruibile.

### Revisione

Rivedere la decisione solo introducendo sincronizzazione remota, collaborazione multiutente o uno stato cross-device che richieda un modello diverso.

---

## ADR-003: IndexedDB come persistenza locale

**Stato:** Accettato  
**Data:** 2026-08-21

### Contesto

L'app non prevede backend e deve funzionare offline. I dati comprendono storico economico, relazioni, vendite, allegati e informazioni sufficienti per report e ripristino.

### Decisione

IndexedDB e la fonte di verita locale per i dati applicativi. La cache del service worker contiene risorse della PWA, non entita di dominio. L'accesso a IndexedDB e confinato all'infrastructure e mediato da repository.

### Alternative considerate

- localStorage;
- file JSON usato direttamente come archivio operativo;
- database remoto come fonte primaria.

### Conseguenze

- l'app puo leggere e modificare dati senza rete;
- esistono limiti di quota e differenze tra browser da gestire;
- cancellazione del sito o del profilo browser puo causare perdita dei dati;
- import/export e obbligatorio come protezione operativa;
- concorrenza tra tab e migrazioni devono essere gestite esplicitamente.

### Revisione

Rivedere la scelta se il volume degli allegati o un requisito multi-dispositivo supera i limiti di persistenza locale.

---

## ADR-004: Dexie come adapter IndexedDB

**Stato:** Accettato  
**Data:** 2026-08-21

### Contesto

IndexedDB offre l'archiviazione necessaria ma espone API verbose e dettagli di transazione, indici e versioning che non devono propagarsi nella UI o nel dominio.

### Decisione

Usare Dexie come libreria di accesso e gestione dello schema IndexedDB. Dexie resta confinato all'infrastructure: database, transazioni, indici, migrazioni e mapping verso i modelli di dominio sono responsabilita dell'adapter e dei repository.

### Alternative considerate

- API IndexedDB native;
- wrapper sviluppato internamente;
- ORM o database embedded diverso.

### Conseguenze

- transazioni multi-entita, come vendita e magazzino, sono esplicite;
- le migrazioni sono versionate;
- i test dei repository possono usare un database IndexedDB di test;
- Dexie non deve diventare un tipo o una dipendenza del layer domain.

### Revisione

Rivedere l'implementazione se cambiano i requisiti di persistenza, non per introdurre query Dexie direttamente nei componenti.

---

## ADR-005: PWA offline-first

**Stato:** Accettato  
**Data:** 2026-08-21

### Contesto

L'artista puo lavorare durante fiere, viaggi o luoghi con rete instabile. La consultazione e la modifica dei dati devono rimanere disponibili dopo il primo caricamento.

### Decisione

Distribuire l'app come PWA con manifest, service worker, shell applicativa e asset versionati. Le risorse statiche vengono cacheate; i dati di dominio restano in IndexedDB. Gli aggiornamenti sono notificati e applicati con un'azione controllata.

### Alternative considerate

- sito online senza supporto offline;
- cache del service worker usata come database;
- sincronizzazione remota implicita senza backend.

### Conseguenze

- dashboard e feature visitate possono funzionare offline;
- lo stato online/offline deve essere visibile senza bloccare le operazioni locali;
- cache e database hanno cicli di vita distinti;
- non esiste sincronizzazione automatica tra dispositivi in questa fase;
- un aggiornamento non deve interrompere scritture o importazioni.

### Revisione

Rivedere la strategia se viene introdotto un backend o se una feature richiede rete come prerequisito.

---

## ADR-006: GitHub Pages come hosting

**Stato:** Accettato  
**Data:** 2026-08-21

### Contesto

Il progetto e un'app personale statica senza backend. GitHub Pages offre hosting e deploy coerenti con questo perimetro, ma richiede attenzione a base href, asset, service worker e refresh delle route.

### Decisione

Usare GitHub Pages per gli artefatti di produzione. La pipeline deve eseguire build e verifiche, impostare il base href del repository e pubblicare solo asset applicativi. Il routing deve usare una strategia compatibile con hosting statico, preferibilmente hash routing se non e disponibile un fallback affidabile.

### Alternative considerate

- hosting statico diverso;
- server con fallback e backend;
- deploy manuale non verificato.

### Conseguenze

- costo e infrastruttura ridotti;
- nessun database o token deve essere pubblicato;
- il refresh diretto delle route deve essere verificato;
- il nome del repository entra nella configurazione di deploy;
- service worker e manifest devono usare percorsi corretti sotto il base path.

### Revisione

Rivedere la decisione se servono autenticazione, API server-side o sincronizzazione cloud.

---

## ADR-007: Nessun backend

**Stato:** Accettato  
**Data:** 2026-08-21

### Contesto

L'obiettivo iniziale e un gestionale personale, controllato dall'utente, funzionante offline e distribuibile come sito statico. Non serve una collaborazione simultanea o un account remoto.

### Decisione

La prima versione non include backend, autenticazione, API remote o sincronizzazione automatica. Ogni dato operativo viene gestito localmente. Le funzionalita che richiedono rete sono escluse o opzionali e non devono bloccare il nucleo dell'app.

### Alternative considerate

- backend centralizzato con account;
- backend serverless;
- sincronizzazione cloud fin dalla prima versione.

### Conseguenze

- maggiore controllo e privacy locale;
- funzionamento offline completo per i dati locali;
- backup e trasferimento dipendono da import/export;
- nessun recupero automatico dopo perdita del browser;
- multi-dispositivo e collaborazione non sono obiettivi della prima versione.

### Revisione

Un futuro backend richiederebbe un ADR dedicato per identita, sicurezza, sincronizzazione, conflitti e migrazione dei dati locali.

---

## ADR-008: Party come anagrafica unica

**Stato:** Accettato come direzione concettuale  
**Data:** 2026-08-21

### Contesto

Lo stesso soggetto puo essere cliente, committente, editore, fornitore o collaboratore in momenti diversi. Modelli anagrafici separati duplicano nomi, recapiti e storico e rendono ambigue le analisi.

### Decisione

Adottare `Party` come concetto generale di anagrafica, con due tipi principali: `Persona` e `Organizzazione`. I ruoli `Cliente`, `Committente`, `Editore`, `Fornitore` e `Collaboratore` sono relazioni contestuali assegnabili allo stesso Party.

Questa decisione definisce il modello concettuale e non approva ancora uno schema dati definitivo. I dati storici dell'Excel, in particolare la colonna `Cliente`, devono essere normalizzati solo quando l'identita e sufficientemente certa.

### Alternative considerate

- entita anagrafiche separate per ogni ruolo;
- una sola entita `Contatto` senza distinzione tra Persona e Organizzazione;
- stringhe libere replicate nei record operativi.

### Conseguenze

- si evita la duplicazione dello stesso soggetto;
- un Party puo comparire in report con piu ruoli senza essere contato due volte;
- la relazione con il ruolo deve essere contestuale al lavoro, vendita o evento;
- merge e deduplicazione richiedono cautela e storico;
- l'Excel non contiene informazioni sufficienti per convertire automaticamente ogni nome in Party certo.

### Revisione

Rivedere la decisione solo se emergono vincoli normativi o di dominio che richiedono anagrafiche separate; in tal caso va preservata la tracciabilita tra record equivalenti.

---

## ADR-009: Import/export come backup ufficiale

**Stato:** Accettato  
**Data:** 2026-08-21

### Contesto

Senza backend, IndexedDB e legato al browser e puo essere cancellato, corrotto o non disponibile per quota o profilo. L'utente deve poter proteggere, trasferire e ripristinare l'intero patrimonio di dati e allegati.

### Decisione

Import ed export completi sono il meccanismo ufficiale di backup, ripristino e trasferimento. Il formato e versionato e comprende metadati, impostazioni, record, dati archiviati e allegati. L'export parziale deve essere dichiarato come tale.

L'import segue sempre validazione, anteprima, controllo della versione, rilevamento dei conflitti, creazione di una copia di sicurezza e applicazione transazionale. Non sono ammesse sovrascritture silenziose.

### Alternative considerate

- backup automatico su server;
- copia manuale delle singole tabelle o file;
- affidarsi alla persistenza del browser senza export.

### Conseguenze

- l'utente mantiene il controllo del file di backup;
- il formato di export diventa un contratto da versionare e migrare;
- gli allegati devono essere portabili e non solo riferimenti a file esterni;
- import e ripristino richiedono spazio temporaneo e controlli di integrita;
- l'app deve mostrare data dell'ultimo export e avvertire del rischio di perdita locale.

### Revisione

Un eventuale backup remoto sarebbe un'estensione successiva e non sostituirebbe il formato locale senza un ADR per sicurezza, privacy e sincronizzazione.
