# Migrazione Dati Storici

## Stato e classificazione

La migrazione dello storico personale da Excel e una funzionalita **Post-MVP / MVP+1**. Non e necessaria per la prima versione utilizzabile sul campo e non deve ritardare la validazione offline di Fiere e Operazioni.

L'obiettivo iniziale non e creare un framework universale di importazione. Il primo target e lo storico personale usato durante la progettazione e validazione di Artist Business Manager, inclusi i fogli Excel gia disponibili nel progetto.

## Adozione graduale

Durante le prime prove sul campo l'applicazione convive con gli strumenti esistenti:

- workflow corrente: appunti cartacei, note operative, fogli Excel;
- workflow sperimentale: Artist Business Manager;
- fonte ufficiale iniziale: carta ed Excel;
- fonte sperimentale: dati inseriti nell'app.

Questa scelta consente di validare UX, velocita di inserimento, workflow e affidabilita prima di affidare completamente i dati reali all'applicazione.

La migrazione non deve richiedere l'abbandono immediato degli strumenti esistenti e non equivale a una sincronizzazione cloud.

## Perimetro iniziale

Sorgente prevista: workbook Excel storico personale, con versione del file e versione del mapping registrate.

Mapping indicativo:

| Sorgente | Destinazione |
|---|---|
| Fiere | `FairSeries`, `FairEdition`, costi e risultati |
| Vendite | `Operation` di tipo vendita e righe |
| Prodotti | `Product` quando l'identita e sufficientemente certa |
| Pagamenti/ricavi | incassi o movimenti economici collegati |
| Cliente | Party registrato o Cliente soft |

Il campo `Giorno` relativo alla fiera deve essere convertito in una data assoluta solo quando l'edizione e l'anno sono determinabili. In caso contrario il record viene importato come incompleto e marcato `needsReview`.

## Regole di interpretazione

- celle vuote e `N.A.` sono dati mancanti o non applicabili, non zero;
- righe `Totale` sono aggregati e non vengono importate come entita;
- `Varie` resta una classificazione esplicita quando non e possibile determinarne il significato;
- valori ambigui non vengono convertiti silenziosamente;
- clienti non riconosciuti diventano testo di Cliente soft, senza deduplicazione automatica incerta;
- riferimenti a prodotti o fiere non risolvibili generano warning e `needsReview`;
- i valori originali devono essere conservati nel record di staging o nella provenance dell'import.

## Import amministrativo guidato

L'import non fa parte del normale workflow operativo. Deve essere una procedura amministrativa esplicita:

```text
Selezione file e mapping
        -> anteprima
        -> validazione
        -> correzione/conferma
        -> export di sicurezza
        -> applicazione transazionale
        -> report e log
```

L'anteprima mostra record validi, warning, errori bloccanti e dati che saranno creati o aggiornati. L'utente deve poter annullare prima dell'applicazione.

Errori bloccanti:

- formato file non leggibile;
- tipo di entita non riconoscibile;
- importo non interpretabile quando obbligatorio per il tipo;
- ID duplicato nel dataset di import;
- intervallo data impossibile;
- riferimento che viola un'invariante non correggibile.

Warning importabili:

- cliente non riconosciuto;
- prodotto o fiera ambigua;
- data parziale;
- metodo di pagamento non classificato;
- record incompleto;
- valore `Varie`.

I record con warning possono entrare nel database solo con stato `needsReview` e lista dei dati da verificare.

## Staging, rollback e log

Il dataset importato deve passare da una rappresentazione di staging/quarantena prima di modificare il database operativo. L'applicazione definitiva deve essere una transazione locale, preceduta da export di sicurezza del database destinazione.

Il log dell'operazione deve contenere:

- identificativo import;
- ambiente di esecuzione;
- file sorgente e hash o versione;
- versione del mapping;
- timestamp e autore;
- record letti, importati, aggiornati, ignorati e scartati;
- warning ed errori;
- risultato della transazione;
- riferimento all'export di sicurezza.

Il rollback minimo consiste nel non applicare lo staging; dopo l'applicazione consiste nel ripristinare l'export verificato o usare una procedura compensativa auditabile. Non eliminare silenziosamente i dati gia presenti.

## Ambienti e sicurezza

Excel storico reale puo essere importato in RELEASE oppure in TEST solo dopo anonimizzazione e autorizzazione esplicita. Un dataset migrato in TEST non puo essere promosso automaticamente a RELEASE.

Il database TEST usa `ABM-TEST`; RELEASE usa `ABM-PROD`. Il risultato dell'import deve conservare ambiente e prefisso, per impedire l'uso accidentale di un export TEST come backup RELEASE.

## Non obiettivo: import universale

Non sono requisiti prioritari attuali:

- import universale da Excel;
- import generico CSV;
- import da Google Sheets;
- connettori verso sistemi di terze parti;
- deduplicazione automatica generale;
- framework configurabile per utenti diversi.

Queste esigenze saranno rivalutate solo dopo la validazione dell'applicazione con utenti reali e dopo aver completato la migrazione personale.

## Roadmap della migrazione

1. definire modello legacy e mapping personale;
2. costruire parser/staging;
3. implementare validazione e report;
4. aggiungere anteprima e revisione;
5. applicare transazione locale con export di sicurezza;
6. verificare rollback e log;
7. testare su dataset Excel rappresentativo;
8. verificare isolamento TEST/RELEASE;
9. eseguire migrazione personale assistita;
10. valutare solo dopo un framework generico.

## Criteri di completamento

La migrazione personale e completata quando ogni record e classificato come importato, scartato o da verificare; i valori ambigui sono visibili; esiste un log riproducibile; l'export di sicurezza e verificato; il report e riconciliabile con Excel; e l'utente ha confermato il risultato.
