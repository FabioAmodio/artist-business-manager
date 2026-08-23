# Addendum deploy Offline First

## Stato reale della pipeline

La pipeline in `.github/workflows/deploy.yml` esegue attualmente:

1. checkout;
2. installazione con `npm ci`;
3. `npm run build`;
4. pubblicazione dell'artefatto GitHub Pages.

Non esegue ancora test, lint, verifica IndexedDB, test offline, test Safari iOS o controllo dei prefissi di storage. Il progetto non deve dichiarare queste verifiche come superate finche non vengono aggiunte alla pipeline o eseguite come gate separati.

La strategia ufficiale prevede `develop -> TEST` e `main -> RELEASE`; al momento e attivo solo il deploy da `main` verso GitHub Pages.

## Gate futuri raccomandati

Prima del deploy release, aggiungere controlli per:

- test automatici del dominio e dei repository;
- migrazioni Dexie su database TEST isolato;
- persistenza dopo reload con rete disabilitata;
- creazione, modifica e soft delete offline;
- assenza di dati applicativi in LocalStorage;
- isolamento tra `ABM-TEST-*` e `ABM-PROD-*`;
- presenza del service worker solo quando la configurazione PWA sara effettivamente attiva;
- smoke test su Safari iOS, inclusa PWA installata;
- quota/eviction e messaggi di errore locali.

La build resta un gate necessario ma non sufficiente per dichiarare verificata la strategia Offline First.

## Riferimento

La strategia completa e in [OFFLINE-FIRST-PERSISTENCE.md](OFFLINE-FIRST-PERSISTENCE.md).
