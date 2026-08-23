# Modalita Fiera e trasparenza AI

> **Aggiornamento normativo:** questo documento resta il riferimento operativo per la Modalita Fiera, mentre il modello unificato delle Operazioni e le regole di contabilizzazione sono definiti in [OPERATIONS-DOMAIN-SPECIFICATION.md](OPERATIONS-DOMAIN-SPECIFICATION.md).

## Scopo

La Modalita Fiera e un contesto operativo temporaneo che porta in primo piano l'evento corrente e il flusso di registrazione rapida delle vendite.

## Modello minimo

Una fiera contiene:

- nome;
- luogo;
- data di inizio;
- data di fine;
- note opzionali.

Le date sono confrontate come date di calendario con estremi inclusivi. Una fiera e attiva quando:

`dataInizio <= dataCorrente <= dataFine`

Il servizio applicativo deve prevedere anche il caso di nessuna fiera attiva. Se piu fiere si sovrappongono, l'implementazione definitiva dovra imporre una regola esplicita di selezione o segnalare l'ambiguita; non deve scegliere silenziosamente un contesto inatteso.

## Contesto operativo

Il contesto esposto all'interfaccia comprende:

- fiera attiva;
- stato Modalita Fiera;
- giorni rimanenti;
- vendite del giorno;
- vendite cumulative e numero di vendite;
- costi associati;
- costi ancora da coprire;
- profitto corrente.

La dashboard generale mostra invece indicatori di attivita, commissioni, clienti e prossime fiere. Il passaggio tra dashboard generale e dashboard operativa e automatico e non richiede una modalita tecnica separata.

## Costi e copertura

Il modello iniziale supporta queste tipologie estendibili:

1. iscrizione / stand;
2. viaggio;
3. alloggio;
4. altro.

Ogni costo conserva un importo previsto e, quando disponibile, un importo effettivo. La copertura iniziale e calcolata in modo aggregato:

`costi non coperti = max(0, costi totali - ricavi cumulativi)`

`profitto corrente = ricavi cumulativi - costi totali`

La presentazione dovra mantenere l'ordine di priorita stand, viaggio, alloggio e rendere distinguibili costo non ancora registrato, costo non coperto e costo coperto.

## FAB e mobile

Su mobile la barra inferiore contiene l'azione primaria al centro:

- con una fiera attiva: **Nuova vendita fiera**;
- senza fiera attiva: **Nuova commissione**.

Il FAB deve aprire direttamente il primo passo del flusso, senza passare da una schermata intermedia di selezione. La vendita rapida puo raccogliere prodotto, bundle, quantita, tag, importo, metodo di pagamento e note. La commissione rapida puo raccogliere cliente, prodotto, tag, acconto, importo previsto, stato, scadenza e note.

La barra mobile deve evitare la sovrapposizione con il contenuto e con il FAB, mantenere target di tocco adeguati e offrire sempre un accesso a dashboard, eventi, catalogo e impostazioni/altro.

## Trasparenza AI

La sezione e raggiungibile da:

**Impostazioni -> Informazioni -> Trasparenza AI**

Testo normativo:

> Artist Business Manager e stato progettato e sviluppato con il supporto di strumenti di Intelligenza Artificiale.
>
> Le decisioni progettuali, architetturali e funzionali sono supervisionate e validate dallo sviluppatore.
>
> Le funzionalita che utilizzano direttamente sistemi di Intelligenza Artificiale saranno chiaramente identificate all'interno dell'applicazione.

La configurazione deve distinguere almeno:

- AI abilitata o disabilitata;
- consenso dell'utente;
- autorizzazione a usare servizi cloud.

L'assenza di consenso non deve impedire i flussi locali dell'applicazione.

## Provenienza dei contenuti

Ogni futura entita che puo contenere un risultato assistito deve poter indicare:

- origine: manuale, assistita da AI, generata da AI o calcolata;
- data di creazione;
- revisione dell'utente;
- modello e versione del prompt, quando applicabili.

L'interfaccia deve rendere visibile la differenza tra contenuto inserito manualmente, suggerito dall'AI e generato dall'AI. In questa fase non vengono introdotte chiamate a servizi AI.

## Stato dell'implementazione

La prima integrazione applicativa e intenzionalmente locale e verificabile:

- `FairContextService` calcola la fiera attiva e gli indicatori;
- `DashboardPage` alterna dashboard generale e dashboard fiera;
- `MobileActionBarComponent` seleziona il FAB contestuale;
- `SettingsPage` espone la dichiarazione e le preferenze AI;
- i tipi di dominio sono predisposti per costi, vendite e provenance.

La persistenza Dexie, i form CRUD per fiere/costi e i flussi completi di nuova vendita/commissione sono il passo successivo e devono riusare questi contratti senza duplicare la logica di risoluzione del contesto.
