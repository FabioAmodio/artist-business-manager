# Ambienti TEST e RELEASE

## Distinzione

Gli ambienti non coincidono necessariamente con i branch. Il branch descrive il flusso del codice; l'ambiente descrive configurazione, dati e destinazione di deploy.

| Ambiente | Branch di riferimento | Uso | Dati | Stabilita |
|---|---|---|---|---|
| TEST | `develop` | sviluppo, prove, demo, validazione e collaborazione | solo fittizi o di test | modificabile |
| RELEASE | `main` | uso reale, fiere e clienti reali | dati reali | massima possibile |

La pipeline corrente distribuisce solo `main` su GitHub Pages. Il deploy automatico di `develop` su TEST e una decisione target e richiede un workflow dedicato.

## Configurazione compilabile

Prevedere configurazioni distinte, ad esempio `environment.test` e `environment.prod`, con:

```typescript
interface AppEnvironment {
  name: 'test' | 'release';
  storagePrefix: string;
  futureEndpoint?: string;
  debug: boolean;
}
```

Valori iniziali:

```text
TEST:    name=test,    storagePrefix=ABM-TEST, debug=true
RELEASE: name=release, storagePrefix=ABM-PROD, debug=false
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

## Promozione

La promozione prevista e `develop -> TEST` e `main -> RELEASE`. TEST non e una copia dei dati RELEASE: e una verifica del codice e del comportamento. Un release deve partire da codice passato da TEST o deve documentare l'eccezione per hotfix.

## Evoluzione

Se il progetto cresce, il modello puo diventare:

```text
feature/* -> DEV locale -> develop -> TEST/STAGING -> main -> RELEASE/PROD
```

`DEV` resta un ambiente locale per sviluppatore; `STAGING` riproduce configurazione release con dati sintetici; `PROD` contiene dati reali. Per un contesto multi-team, ogni team puo avere workspace e pipeline isolate senza cambiare il contratto del dominio. I nomi possono evolvere senza cambiare il contratto del dominio.
