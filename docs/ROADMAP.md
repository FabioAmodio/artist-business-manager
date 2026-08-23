# Roadmap

La roadmap distingue lavoro necessario, evoluzioni e sperimentazioni. Le date non sono vincolanti: la priorita e la solidita dei dati offline.

## MVP

L'obiettivo del primo MVP non e dashboard, analytics o sync: e registrare e consultare persistentemente fiere e commissioni anche completamente offline.

Gli incrementi sono:

1. environment TEST/RELEASE, `AppEnvironment`, `storagePrefix` e Dependency Injection;
2. `IStorageProvider`, `StorageHealth` e `StorageError`;
3. `IndexedDbProvider` minimale con `open()`, `health()` e test di inizializzazione;
4. entita `Fair` e `Operation`;
5. `IFairRepository` e `IOperationRepository`;
6. prima schermata reale per Gestione Fiere;
7. inserimento rapido di Operazione/Commissione.

Dashboard avanzata, analytics, catalogo esteso, stock e magazzino non sono prerequisiti del primo MVP.

## Funzionalita future

- Sync asincrona con outbox e `SyncEngine` (solo evoluzione futura);
- provider Google Drive, OneDrive, Dropbox o backend;
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

- service worker PWA e verifica offline reale;
- schema Dexie ancora da completare;
- repository e provider astratto da implementare secondo gli incrementi MVP;
- environment file e storagePrefix non ancora cablati;
- lint e gate CI non configurati;
- test Safari iOS e quota IndexedDB da aggiungere;
- pipeline deploy TEST da separare dal deploy RELEASE;
- completamento dei form CRUD e dei flussi rapidi.

## Criteri di avanzamento

Una voce passa da roadmap a implementazione quando esistono decisione documentata, owner, test minimi, strategia dati/migrazione e criterio di rollback. Una voce non e “completata” solo perche e stata descritta in un documento.
