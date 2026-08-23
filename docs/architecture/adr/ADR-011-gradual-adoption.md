# ADR-011: Gradual Adoption

**Stato:** Accettato  
**Data:** 2026-08-24

## Contesto

L'autore dispone gia di appunti cartacei, note operative e uno storico Excel costruito negli anni. Le prime versioni di Artist Business Manager devono essere validate sul campo senza mettere a rischio la continuita dell'attivita.

## Decisione

Adottare il prodotto gradualmente e mantenere per una fase transitoria il workflow esistente come fonte ufficiale dei dati. Artist Business Manager e inizialmente una fonte sperimentale usata in parallelo durante le fiere.

La prima priorita e una versione utilizzabile, offline e affidabile per registrare Operazioni e Fiere. La migrazione dello storico personale e Post-MVP/MVP+1 e avviene tramite import amministrativo guidato, con anteprima, validazione, staging, annullamento, log, export di sicurezza e rollback.

L'import universale da Excel, CSV, Google Sheets o altri sistemi non e un requisito attuale. Sara rivalutato dopo la validazione con utenti reali.

## Regole di adozione

- nessun big bang migration;
- mantenere adapter e mapper compatibili con dati legacy;
- preservare ID, valori originali e provenienza;
- consentire record importati incompleti con `needsReview`;
- dati reali solo in RELEASE, oppure in TEST dopo anonimizzazione;
- un dataset TEST non puo diventare automaticamente un dataset RELEASE;
- ogni incremento deve avere test di compatibilita e rollback;
- adozione graduale e migrazione dati non equivalgono a sync cloud.

## Alternative considerate

- migrazione completa prima del primo utilizzo;
- abbandono immediato di Excel e carta;
- framework universale di importazione nel MVP;
- uso dei dati sperimentali come unica fonte durante la validazione.

Sono state scartate per rischio operativo, complessita prematura e difficolta di validare correttamente l'esperienza in fiera.

## Conseguenze

- il MVP resta piccolo e focalizzato su Fiere, Operazioni e affidabilita offline;
- la migrazione personale ha un perimetro noto e controllabile;
- il dominio deve supportare dati incompleti e provenance;
- import/export di backup e import legacy Excel sono processi distinti;
- il passaggio a Artist Business Manager come strumento principale avviene dopo una validazione esplicita;
- serve documentare quando la fonte ufficiale passa da carta/Excel all'app.

## Criteri di revisione

Rivalutare questa decisione dopo le prime prove reali, quando saranno disponibili dati su velocita di inserimento, errori, affidabilita offline, riconciliazione con Excel e stabilita dei workflow.
