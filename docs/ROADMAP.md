# Roadmap

La roadmap distingue lavoro necessario, evoluzioni e sperimentazioni. Le date non sono vincolanti: la priorita e la solidita dei dati offline.

## MVP

- Operazione come aggregate root;
- commissione con macchina a stati persistente;
- Modalita Fiera e dashboard contestuale;
- vendita e commissione rapida con record incompleti;
- Clienti soft;
- fiere con costi e copertura;
- IndexedDB/Dexie con repository e `IStorageProvider`;
- configurazioni TEST/RELEASE e isolamento storage;
- test di dominio, repository e persistenza dopo reload;
- documentazione e onboarding coerenti.

## Funzionalita future

- Sync asincrona con outbox;
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
- repository, provider astratto e outbox da implementare;
- environment file e storagePrefix non ancora cablati;
- lint e gate CI non configurati;
- test Safari iOS e quota IndexedDB da aggiungere;
- pipeline deploy TEST da separare dal deploy RELEASE;
- completamento dei form CRUD e dei flussi rapidi.

## Criteri di avanzamento

Una voce passa da roadmap a implementazione quando esistono decisione documentata, owner, test minimi, strategia dati/migrazione e criterio di rollback. Una voce non e “completata” solo perche e stata descritta in un documento.
