# Ambienti TEST, DEMO e RELEASE

## Distinzione

Gli ambienti non coincidono necessariamente con i branch. Il branch descrive il flusso del codice; l'ambiente descrive configurazione, dati e destinazione di deploy.

| Ambiente | Branch di riferimento | Uso | Dati | Stabilita |
|---|---|---|---|---|
| TEST | configurazione `test` | sviluppo, prove, regressione e collaborazione | dataset sintetico | modificabile |
| DEMO | configurazione `demo` | presentazioni e dimostrazioni | dataset sintetico | modificabile |
| RELEASE | `main` | uso reale, fiere e clienti reali | dati reali | massima possibile |

TEST e DEMO sono configurazioni di rilascio indipendenti. La pubblicazione DEMO e opzionale e non e una conseguenza automatica di ogni deploy RELEASE. Il repository o il progetto Pages usato per ospitarla e una decisione infrastrutturale, non un vincolo del modello applicativo.

## Configurazione compilabile

Le configurazioni `environment.test`, `environment.demo` e `environment.prod` sono selezionate tramite `fileReplacements` Angular:

```typescript
interface AppEnvironment {
  environmentName: 'test' | 'demo' | 'release';
  storagePrefix: string;
  allowExternalPersistence: boolean;
  allowImportExport: boolean;
  allowCloudSync: boolean;
  demoDatasetUrl?: string;
}
```

Valori iniziali:

```text
TEST:    environmentName=test,    storagePrefix=ABM-TEST,  dataset demo, capability esterne disabilitate
DEMO:    environmentName=demo,    storagePrefix=ABM-DEMO,  dataset demo, capability esterne disabilitate
RELEASE: environmentName=release, storagePrefix=ABM-PROD, capability esterne abilitate
```

Il prefisso deve essere iniettato dalla configurazione e usato nella costruzione del nome IndexedDB. Non deve essere scritto nei repository o duplicato nei componenti.

## Isolamento dati

Lo stesso browser o dispositivo deve poter aprire TEST e RELEASE senza condividere il database. Un database release non deve essere usato dai test e i dati reali non devono essere importati in TEST senza anonimizzazione e autorizzazione esplicita.

Ogni ambiente deve avere:

- nome database distinto;
- prefisso distinto per IndexedDB e futuri export;
- configurazione distinta;
- indicatori visibili nell'interfaccia quando non si tratta di RELEASE;
- procedure separate di reset, export e backup.

## Dataset demo e reset TEST/DEMO

I build TEST e DEMO pubblicano `docs/business/artist-business-manager-data-test.json` come asset read-only. Al primo avvio, il dataset viene caricato in IndexedDB con il prefisso dell'ambiente (`ABM-TEST` o `ABM-DEMO`); un marker in `appSettings` impedisce ricaricamenti alle aperture successive. Le modifiche dell'utente restano esclusivamente nel database locale.

Il ripristino dati in TEST o DEMO svuota il database locale e ricarica lo stesso dataset demo, restituendo l'applicazione allo stato di una nuova installazione dell'ambiente. Il file JSON non viene mai modificato dall'applicazione.

## Promozione

La promozione prevista e `develop -> TEST` e `main -> RELEASE`. TEST non e una copia dei dati RELEASE: e una verifica del codice e del comportamento. Un release deve partire da codice passato da TEST o deve documentare l'eccezione per hotfix.

## Evoluzione

Se il progetto cresce, il modello puo diventare:

```text
feature/* -> DEV locale -> develop -> TEST/STAGING -> main -> RELEASE/PROD
```

`DEV` resta un ambiente locale per sviluppatore; `STAGING` riproduce configurazione release con dati sintetici; `PROD` contiene dati reali. Per un contesto multi-team, ogni team puo avere workspace e pipeline isolate senza cambiare il contratto del dominio. I nomi possono evolvere senza cambiare il contratto del dominio.
