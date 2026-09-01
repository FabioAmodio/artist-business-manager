# Specifica normativa delle Operazioni

## Stato del documento

Questa specifica integra e, dove necessario, sostituisce le assunzioni precedenti sul rapporto tra vendite, commissioni, fiere e contabilità gestionale. In caso di conflitto prevalgono le regole qui definite.

La persistenza delle Operazioni deve rispettare la strategia Offline First definita in [../architecture/OFFLINE-FIRST-PERSISTENCE.md](../architecture/OFFLINE-FIRST-PERSISTENCE.md): il commit locale precede qualsiasi sincronizzazione e la rete non e prerequisito.

Per la terminologia completa di serie ed edizioni fieristiche consultare [DOMAIN-MODEL-V1.md](DOMAIN-MODEL-V1.md). La vecchia `Fair` e trattata come `FairEdition` durante la migrazione.

## Visione del prodotto

Artist Business Manager e un assistente operativo per artisti, illustratori, fumettisti e creativi. Non e solamente un gestionale: deve assistere il lavoro quotidiano e soprattutto l'attivita durante fiere ed eventi.

Il prodotto combina:

- assistenza operativa da fiera;
- organizzazione delle commissioni;
- gestione prodotti e clienti;
- tracciamento vendite;
- analisi economica e statistica.

La velocita di registrazione e una priorita di dominio. Registrare un'informazione deve essere semplice quanto scrivere un appunto su un foglio, con il vantaggio di ritrovarla organizzata in seguito.

## Operazione come aggregate root

`Operazione` e l'entita persistente primaria per ogni fatto commerciale o incarico. Non si devono modellare Vendita e Commissione come cicli di vita totalmente separati.

Il Prodotto e invece la definizione commerciale di catalogo. Commissione, Sketch e Bundle sono Prodotti quando descrivono l'offerta vendibile; diventano Operazione solo quando esiste un caso concreto con cliente, stato, consegna, vendita o pagamento.

Tipi iniziali di Operazione:

- vendita immediata;
- commissione;
- prenotazione;
- commissione con acconto;
- commissione da consegnare in fiera;
- commissione da spedire;
- tipo futuro estendibile.

Un'Operazione conserva la stessa identita mentre cambiano stato, dati, incassi, consegna o attribuzione statistica. L'avanzamento non crea record duplicati.

Attributi concettuali minimi:

- identita e tipo;
- data di creazione e date operative;
- descrizione o testo libero;
- cliente registrato oppure nome cliente libero;
- prodotto, bundle, quantita e tag quando applicabili;
- importo concordato, previsto, incassato e residuo;
- metodo di pagamento quando applicabile;
- stato operativo e stato economico separati;
- stato di completezza e dati mancanti;
- note, allegati e provenance del contenuto;
- fiera di origine, fiera di consegna e fiera di contabilizzazione.

## Stato persistente delle commissioni

La commissione e un profilo di Operazione con una macchina a stati persistente:

`Bozza -> Richiesta -> Accettata -> In lavorazione -> Pronta -> Consegnata -> Pagata`

Lo stato puo includere anche `Sospesa` e `Annullata`, con motivo obbligatorio. Ogni transizione registra timestamp, autore, stato precedente, stato successivo e motivo quando richiesto. Lo stato operativo non sostituisce lo stato economico: un'Operazione puo essere consegnata ma avere un saldo aperto.

La migrazione dei dati storici senza stato deve usare uno stato esplicito `Da verificare` o una regola documentata, mai presumere che un campo vuoto significhi `Pagata`.

## Commissioni con consegna in fiera

Durante una fiera l'artista deve poter registrare rapidamente una richiesta di sketch o altro lavoro anche se non e ancora completato. Il minimo utile e:

- cliente registrato oppure nome libero;
- descrizione della richiesta;
- prezzo concordato se noto;
- eventuale anticipo;
- telefono o altro contatto se noto;
- note.

Il record viene salvato come Operazione incompleta, entra nello scadenziario e puo essere completato successivamente senza ricrearlo.

## Record rapidi e incompletezza

Le operazioni parziali sono valide registrazioni di dominio. Possono mancare cliente, importo, telefono, prodotto, tag o scadenza.

Ogni Operazione deve esporre:

- `complete`: completa o incompleta;
- `needsReview`: da verificare;
- `missingFields`: elenco dei dati mancanti;
- `nextAction`: eventuale passo suggerito.

Le viste devono distinguere Operazioni incomplete, da verificare e da completare. I report devono includerle in una categoria esplicita o segnalarne l'esclusione.

L'architettura deve lasciare spazio a appunti rapidi, testo libero, dettatura vocale e classificazione assistita da AI. Queste estensioni non devono cambiare l'identita dell'Operazione.

## Clienti soft

Un'Operazione puo riferire:

1. un Cliente registrato, selezionato dall'anagrafica;
2. un Nome cliente libero, cioe testo senza creazione automatica di un'anagrafica;
3. nessun cliente ancora indicato.

La ricerca suggerisce i Clienti registrati durante la digitazione. Se l'utente seleziona un risultato, l'Operazione si associa al Party. Se inserisce un nome nuovo, salva il testo come Cliente soft. In seguito una procedura esplicita puo associare il testo a un Party esistente o trasformarlo in un nuovo Cliente registrato.

La conversione non deve duplicare o perdere l'Operazione e deve conservare il valore originale nello storico quando necessario.

## Modalita Fiera

Quando la data corrente e compresa tra inizio e fine di una fiera, estremi inclusi, l'app entra automaticamente nel contesto della fiera. In assenza di una fiera reale, l'utente puo forzare temporaneamente e persistentemente una `FairEdition`; il topbar rende visibile la forzatura e permette di uscirne con conferma. In questo contesto:

- la dashboard diventa una dashboard operativa dell'evento;
- vendite e commissioni da fiera sono le azioni prioritarie;
- le informazioni essenziali devono essere raggiungibili con pochi tocchi e offline;
- l'utente mantiene comunque accesso a tutti gli altri workflow.

Se piu fiere risultano attive contemporaneamente, l'app deve rendere l'ambiguita esplicita e permettere di scegliere il contesto, senza selezione silenziosa. Se non esiste una fiera attiva o forzata, si usa il contesto generale.

Il contesto attivo e sempre una `FairEdition`, non una `FairSeries`: la serie identifica la manifestazione ricorrente, l'edizione determina date, luogo, costi e risultati dell'evento corrente.

## FAB centrale e inserimento rapido

Su mobile la Bottom Navigation Bar contiene al centro un FAB. La V1 apre direttamente il wizard Vendita tramite `/sales?create=...`. Se esiste una fiera reale o forzata, la vendita viene associata automaticamente e, dopo il salvataggio, il flusso torna al Riepilogo. Senza contesto fiera il wizard resta disponibile come vendita generale.

L'apertura porta direttamente al primo campo utile e non a una schermata intermedia di scelta. Un flusso dedicato e contestuale per `Nuova Commissione` resta un'evoluzione successiva.

La vendita rapida puo raccogliere prodotto, bundle, quantita, tag, importo, metodo di pagamento e note. La commissione rapida puo raccogliere cliente, prodotto, tag, acconto, importo previsto, stato, scadenza e note. I campi non indispensabili possono essere completati dopo.

## Fiere e contabilizzazione gestionale

Ogni Operazione puo avere tre riferimenti indipendenti:

- `originFair`: dove nasce l'operazione o viene acquisito il contatto;
- `deliveryFair`: dove avviene consegna o ritiro;
- `accountingFair`: la fiera a cui attribuire ricavi, costi e indicatori statistici.

I tre riferimenti possono coincidere, differire o essere assenti. `accountingFair` e modificabile dall'utente e serve a misurare la redditivita percepita della fiera; non costituisce necessariamente una contabilizzazione fiscale.

Regole predefinite modificabili:

- presa in fiera e consegnata fuori fiera: accountingFair = originFair;
- presa fuori fiera e consegnata in fiera: accountingFair = deliveryFair;
- presa in una fiera e consegnata in un'altra: proporre la fiera corrente al momento della consegna;
- l'utente puo sempre confermare, cambiare o rimuovere l'attribuzione.

La modifica deve essere storicizzata come scelta gestionale, senza alterare origine o consegna.

## KPI e costi fiera

La dashboard fiera puo mostrare nome, luogo, giorni rimanenti, vendite della giornata, vendite cumulative, numero vendite, prodotti e bundle piu venduti e incasso totale.

I costi sono estendibili e includono inizialmente:

- iscrizione / stand;
- viaggio;
- alloggio;
- altro.

Ogni costo deve supportare importo previsto e importo effettivo quando disponibile. L'analisi di copertura segue inizialmente l'ordine stand, viaggio, alloggio. Deve distinguere costo mancante, costo non coperto e costo coperto e calcolare almeno:

`costi non coperti = max(0, costi totali - ricavi attribuiti)`

`profitto corrente = ricavi attribuiti - costi considerati`

La metrica deve dichiarare se usa costi direttamente associati o costi allocati e deve usare `accountingFair`, non necessariamente la fiera attiva.

## Trasparenza e futuro AI

L'app deve mantenere una sezione `Impostazioni -> Informazioni -> Trasparenza AI` con la dichiarazione che l'app e stata sviluppata con supporto AI, mentre decisioni progettuali, architetturali, funzionali e implementative sono supervisionate e validate dallo sviluppatore.

Eventuali funzioni AI dirette devono essere identificate chiaramente. Ogni contenuto deve poter distinguere origine `manuale`, `assistita da AI`, `generata da AI` o `calcolata`, con timestamp, revisione utente e, se applicabile, modello e versione del prompt.

La direzione del prodotto resta la gestione dell'attivita artistica: l'AI e tecnologia di supporto, non il soggetto responsabile delle decisioni applicative.

## Requisiti di test documentali

La suite di dominio deve coprire almeno:

- intervallo fiera con estremi inclusivi, nessuna fiera e fiere sovrapposte;
- cambio stato senza duplicazione dell'Operazione;
- stati operativo ed economico indipendenti;
- record rapido incompleto e successivo completamento;
- Cliente registrato, Cliente soft e conversione;
- selezione e modifica della fiera contabile;
- regole predefinite per origine e consegna;
- FAB primario e azione alternativa dentro e fuori fiera;
- copertura costi e ricavi attribuiti;
- distinzione di provenance manuale, assistita, generata e calcolata.

I test devono inoltre verificare persistenza dopo reload, uso completamente offline, errori di quota e isolamento tra ambienti TEST e RELEASE.
