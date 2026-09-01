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

Le date sono confrontate come date di calendario con estremi inclusivi. Una fiera e realmente attiva quando:

`dataInizio <= dataCorrente <= dataFine`

`ActiveFairService` centralizza il contesto usato dall'applicazione. La precedenza e:

1. fiera forzata valida;
2. fiera attiva per data;
3. nessuna fiera.

Quando non esiste una fiera realmente attiva, il Riepilogo permette di forzare una delle edizioni registrate. La scelta e persistita in `appSettings`, resta attiva dopo il riavvio ed e indicata nel topbar di ogni pagina. L'uscita dalla forzatura richiede conferma. Un riferimento a una fiera non piu valida viene eliminato automaticamente.

Se piu fiere reali si sovrappongono, resta aperto il requisito di rendere esplicita l'ambiguita; la forzatura costituisce gia il meccanismo manuale di selezione del contesto.

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

La dashboard fiera mostra la sintesi economica, la copertura dei costi, le lavorazioni aperte con transizioni rapide e le vendite associate ordinate per data decrescente. Permette inoltre di registrare acconti o saldi entro il residuo della vendita.

La dashboard generale mostra metriche annuali di lavorazioni, fiere e bilancio. In presenza di una fiera attiva, il titolo della Dashboard permette uno switch temporaneo verso il Riepilogo annuale senza disattivare il contesto fiera.

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

Su mobile la barra inferiore contiene un FAB centrale che apre il wizard di nuova vendita. Se esiste una fiera reale o forzata, l'Operazione viene associata automaticamente al contesto risolto da `ActiveFairService`; dopo il salvataggio il flusso torna alla Dashboard. Il pulsante desktop **Nuova vendita fiera** usa lo stesso trigger.

Il wizard apre direttamente il primo passo, senza schermate intermedie, e puo raccogliere prodotto, servizio o bundle, quantita, cliente, importo, pagamento e note. Il pagamento rapido puo essere completo o parziale e usa Contanti come modalita predefinita quando disponibile.

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

Stato: Implementata V1.

- `ActiveFairService` risolve fiera reale/forzata ed e inizializzato al bootstrap;
- la forzatura e persistita in `appSettings`;
- `DashboardPage` espone vista fiera e vista annuale;
- `OperationsPage` usa lo stesso contesto per wizard, associazione `fairEditionId` e ritorno Dashboard;
- `MobileActionBarComponent` apre il wizard vendita tramite query parameter;
- Fiere, Operazioni e Pagamenti sono persistiti in Dexie;
- `SettingsPage` espone persistenza, sincronizzazione e trasparenza AI.

Restano futuri la gestione esplicita di fiere reali sovrapposte, la normalizzazione di Booking/FairCost e funzionalita AI operative.
