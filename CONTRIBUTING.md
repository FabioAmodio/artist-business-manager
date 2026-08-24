# Contributing

## Prima di iniziare

Leggere nell'ordine:

1. [Getting Started](docs/GETTING-STARTED.md)
2. [Architecture](docs/architecture/ARCHITECTURE.md)
3. [Offline First](docs/architecture/OFFLINE-FIRST-PERSISTENCE.md)
4. [Operations domain](docs/business/OPERATIONS-DOMAIN-SPECIFICATION.md)
5. [Git Strategy](docs/architecture/GIT-STRATEGY.md)
6. [Decision log](docs/architecture/DECISIONS.md)

L'obiettivo e comprendere dominio, architettura e workflow in meno di una giornata.

## Convenzioni di team

- usare TypeScript strict e componenti Angular standalone;
- usare per ogni componente Angular file `.ts`, `.html` e `.scss` separati;
- evitare template e stili inline salvo prototipi, test o componenti tecnici estremamente piccoli;
- mantenere il dominio indipendente da Angular e Dexie;
- usare Signals per stato locale e facade read-only verso la UI;
- mantenere l'Offline First: il salvataggio locale precede ogni sync futura;
- non usare dati reali in TEST, demo, test o issue;
- non inserire segreti nel repository;
- aggiornare documentazione e ADR quando cambia una decisione;
- preferire modifiche piccole, testabili e reversibili;
- mantenere accessibilita, responsive design e feedback di salvataggio.

## Branch, commit e PR

Usare `feature/*` da `develop` per il lavoro ordinario e `hotfix/*` da `main` per urgenze. Non fare push diretto sui branch condivisi quando la protezione sara attiva.

I commit devono avere una singola intenzione. La PR deve spiegare:

- problema e soluzione;
- file e layer interessati;
- test/build eseguiti;
- migrazioni o impatto sui dati;
- cambiamenti documentali e ADR;
- rischi residui.

## Review

Ogni PR di dominio, persistenza, sicurezza, ambienti o deploy richiede una seconda review quando sono presenti almeno due sviluppatori. La review verifica comportamento, dati, regressioni, test e coerenza con gli ADR.

## Controlli locali

```powershell
npm ci
npm test
npm run build
```

Il lint non e ancora configurato. Non presentare la build come prova di test offline, Safari iOS o isolamento database: usare le checklist dedicate.

## Dati locali

Prima di cambiare schema o storage, esportare i dati di lavoro e verificare l'ambiente attivo. Non cancellare database del browser senza conferma esplicita. TEST e RELEASE devono usare prefissi separati.

## Decisioni

Per una decisione irreversibile o con impatto su dati, provider, workflow, ambienti o sicurezza, creare o aggiornare un ADR prima del merge. Un ADR deve includere contesto, decisione, alternative, conseguenze e criteri di revisione.
