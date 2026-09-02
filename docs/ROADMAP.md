# Roadmap

La roadmap distingue lavoro completato, evoluzioni e sperimentazioni. Le date non sono vincolanti: la priorita e la solidita dei dati offline.

Ultimo aggiornamento: 2026-09-01. Lo stato puntuale e in [IMPLEMENTATION-STATUS.md](architecture/IMPLEMENTATION-STATUS.md).

## MVP

Il primo MVP offline e completato. Permette di registrare e consultare persistentemente fiere, vendite, lavorazioni, pagamenti, catalogo e anagrafiche.

Incrementi completati:

1. environment TEST/RELEASE, `AppEnvironment`, `storagePrefix`, Dependency Injection, dataset demo read-only e reset TEST;
2. `IStorageProvider`, `StorageHealth` e `StorageError`;
3. `IndexedDbProvider` minimale con `open()`, `health()` e test di inizializzazione;
4. entita `FairSeries`, `FairEdition` e `Operation`;
5. repository concreti per le entita V1;
6. prima schermata reale per Gestione Fiere;
7. inserimento rapido di Operazioni, vendite e lavorazioni;
8. Dashboard annuale e operativa fiera;
9. catalogo Prodotti/Servizi/Bundle e pagamenti 1:N;
10. sincronizzazione File System e Google Drive.

Restano post-MVP analytics avanzati, stock e magazzino.

## Adozione e migrazione dello storico

Dopo il primo MVP utilizzabile in fiera, lo stato e:

1. validazione reale sul campo in corso;
2. consolidamento dei workflow in corso;
3. migrazione dati storici personali assistita completata;
4. eventuale framework di importazione generico, solo dopo utenti reali.

La migrazione personale e descritta in [HISTORICAL-DATA-MIGRATION.md](business/HISTORICAL-DATA-MIGRATION.md) e non fa parte del normale workflow operativo.

## Funzionalita future

- outbox persistente e gestione conflitti avanzata;
- provider OneDrive, Dropbox o backend (Google Drive e implementato);
- appunti rapidi, testo libero e dettatura vocale;
- suggerimenti di prezzo e bundle;
- report avanzati e confronti tra fiere;
- DEV, STAGING e PROD;
- dataset condivisi, collaboratori, assistenti e permessi;
- supporto multi-team con ownership, ruoli e policy separate;
- backup automatici e cifratura export.

## Esperimenti

- classificazione assistita da AI;
- trascrizione vocale;
- previsioni di vendite;
- risoluzione automatica dei conflitti;
- nuove interazioni mobile per ridurre tocchi e schermate.

Ogni esperimento deve essere isolato, disattivabile, riconoscibile all'utente e non deve contaminare dati RELEASE senza decisione esplicita.

## Debito tecnico

- service worker PWA e verifica offline reale su dispositivi target;
- transazioni Dexie reali nel provider astratto;
- lint e gate CI non configurati;
- test Safari iOS e quota IndexedDB da aggiungere;
- riduzione dei warning sui budget SCSS di Dashboard e Operations;
- gestione avanzata delle edizioni, task, contatti e prenotazioni fieristiche;

## Criteri di avanzamento

Una voce passa da roadmap a implementazione quando esistono decisione documentata, owner, test minimi, strategia dati/migrazione e criterio di rollback. Una voce non e “completata” solo perche e stata descritta in un documento.
