# Getting Started

## Prerequisiti

- Node.js 22.x;
- npm 10.x;
- Git;
- browser moderno; Safari iOS e target di verifica per l'uso in fiera.

## Installazione

```powershell
git clone <repository-url>
cd artist-business-manager
npm ci
```

Non usare token o dati personali nei comandi, nei commit o nei file di configurazione.

## Struttura essenziale

- `src/app/domain`: modelli e regole di dominio;
- `src/app/application`: casi d'uso e facade;
- `src/app/core`: persistenza, stato, servizi e navigazione condivisi;
- `src/app/features`: pagine e componenti Angular;
- `docs/business`: dominio, workflow e reporting;
- `docs/architecture`: architettura, ADR, ambienti, deploy e decisioni;
- `.github/workflows`: automazione CI/CD.

## Sviluppo locale

```powershell
npm start
```

Aprire l'URL indicato da Angular. Per una nuova funzionalita creare prima un branch `feature/<nome>` partendo da `develop`.

## Verifica

```powershell
npm test
npm run build
```

Attualmente non esiste uno script lint. IndexedDB e la fonte locale; sincronizzazione File System e Google Drive sono disponibili. Verificare limiti e gap in [IMPLEMENTATION-STATUS.md](architecture/IMPLEMENTATION-STATUS.md) e i principi in [OFFLINE-FIRST-PERSISTENCE.md](architecture/OFFLINE-FIRST-PERSISTENCE.md).

## Ambienti e dati

TEST usa esclusivamente dati fittizi e deve avere prefisso `ABM-TEST`; RELEASE usa dati reali e prefisso `ABM-PROD`. La configurazione compilabile separata e descritta in [ENVIRONMENTS.md](architecture/ENVIRONMENTS.md). Non simulare l'isolamento cambiando manualmente dati nel browser.

## Workflow Git

```text
feature/* -> develop -> main
              TEST      RELEASE
```

Per urgenze: `hotfix/* -> main`, poi merge di ritorno su `develop`. Dettagli e regole PR sono in [GIT-STRATEGY.md](architecture/GIT-STRATEGY.md) e [CONTRIBUTING.md](../CONTRIBUTING.md).

## Deploy

La pipeline attuale esegue `npm ci`, `npm run build` e pubblica GitHub Pages da `main`. Il deploy TEST da `develop`, i gate offline e la verifica Safari sono obiettivi documentati ma non ancora attivi.

## Primo contributo

1. leggere il dominio e gli ADR;
2. verificare branch e ambiente;
3. creare una modifica piccola;
4. aggiungere o aggiornare test e documentazione;
5. aprire PR con rischi e verifiche;
6. dopo il merge, controllare l'ambiente previsto.
