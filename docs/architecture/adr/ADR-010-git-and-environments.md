# ADR-010: Branch, ambienti e promozione

**Stato:** Accettato  
**Data:** 2026-08-24

## Contesto

Il progetto passa da uno sviluppo individuale a un team di almeno due sviluppatori. Servono regole semplici per distinguere sviluppo, test e rilascio, senza confondere branch e ambienti.

## Decisione

Adottare `main` come branch stabile di RELEASE e `develop` come branch di integrazione di TEST. Usare `feature/*` da `develop` per il lavoro ordinario e `hotfix/*` da `main` per correzioni urgenti. Una hotfix rilasciata su `main` deve essere riportata su `develop`.

Gli ambienti sono configurazioni di deploy, non branch: TEST usa dati fittizi e prefisso `ABM-TEST`; RELEASE usa dati reali e prefisso `ABM-PROD`. La separazione deve valere anche sullo stesso browser e dispositivo. Il deploy automatico da `develop` a TEST e da `main` a RELEASE e il modello target; la pipeline attuale implementa solo il secondo.

## Alternative considerate

- push diretto su `main` senza integrazione;
- usare ambienti come branch dedicati;
- usare un unico database per TEST e RELEASE;
- GitFlow completo con numerosi branch di release.

Sono state scartate per rischio di contaminazione dati, complessita o scarsa tracciabilita.

## Conseguenze

- le PR verso `develop` sono il punto normale di integrazione;
- RELEASE riceve solo codice promosso o hotfix documentate;
- servono configurazioni compile-time separate e gate CI/CD;
- il deploy TEST automatico richiede un workflow dedicato;
- la protezione branch diventa importante quando il team cresce;
- la policy di approvazione e i permessi GitHub devono essere configurati nel repository.

## Revisione

Rivalutare quando saranno necessari DEV, STAGING, PROD, release branch dedicati, più team o deployment verso provider diversi da GitHub Pages.
