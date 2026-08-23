# Git Strategy ufficiale

## Scopo

Questa strategia separa il flusso del codice dal flusso degli ambienti. I branch rappresentano lo sviluppo e l'integrazione; gli ambienti rappresentano dove il codice viene compilato e distribuito.

## Branch protetti

- `main`: branch stabile, contiene solo codice ritenuto rilasciabile e alimenta RELEASE.
- `develop`: branch di integrazione, riceve feature completate e alimenta TEST.

`main` e `develop` devono essere protetti quando il repository sara usato da piu sviluppatori: niente push diretto, PR obbligatoria, build/test verificati e review per le modifiche sensibili.

## Branch temporanei

- `feature/<nome-breve>`: una funzionalita o un incremento coerente, creato da `develop`.
- `hotfix/<nome-breve>`: correzione urgente per RELEASE, creato da `main`.

Esempi: `feature/fair-mode`, `feature/storage-provider`, `hotfix/ios-persistence`.

Usare nomi brevi in kebab-case. Un branch temporaneo viene eliminato dopo il merge.

## Flussi ufficiali

### Nuova funzionalita

```text
feature/* -> develop -> main
                |         |
              TEST     RELEASE
```

1. Creare `feature/*` da `develop`.
2. Implementare, documentare e validare localmente.
3. Aprire PR verso `develop`.
4. Dopo il merge, validare su TEST.
5. Aprire PR da `develop` verso `main` con riepilogo, rischi e verifiche.
6. Dopo l'approvazione, il merge su `main` alimenta RELEASE.

### Correzione urgente

```text
hotfix/* -> main -> develop
              |       |
           RELEASE   TEST
```

1. Creare `hotfix/*` da `main`.
2. Applicare la correzione minima e validarla.
3. Aprire PR verso `main` e rilasciare dopo review/controlli.
4. Riportare subito la correzione su `develop` tramite merge o PR dedicata.

## Regole di sicurezza

- Mai inserire segreti, token o dati reali nei branch o negli artefatti.
- Non usare dati RELEASE per test o demo.
- Non riscrivere la storia di `main` o `develop` condivisi.
- Ogni modifica al dominio, persistenza, ambienti o workflow richiede aggiornamento della documentazione e, quando applicabile, ADR.
- Il merge non equivale automaticamente a una verifica runtime: l'ambiente di destinazione deve essere controllato.

## Commit e PR

I commit devono essere piccoli e descrivere una sola intenzione, ad esempio `feat: add fair operation context` o `fix: isolate test storage`. Una PR deve includere scopo, comportamento modificato, test eseguiti, impatto dati/migrazioni, screenshot per UI e nota su documentazione/ADR.

La strategia e compatibile con un solo sviluppatore: inizialmente le PR possono essere auto-review, ma il flusso resta uguale per rendere naturale il passaggio a un team di almeno due persone.
