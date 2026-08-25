# ADR-012: Operation come aggregate root

**Stato:** Accettato  
**Data:** 2026-08-24

## Contesto

Il dominio distingue `Work` e `Sale`, ma i workflow reali mostrano spesso casi ibridi: una commissione puo avere acconto, saldo, consegna futura, fiera di origine e fiera di contabilizzazione; uno sketch puo essere un prodotto gia pronto oppure un lavoro creativo richiesto; una vendita puo non essere ancora incassata.

`DATA-MODEL.md`, `WORK-SALES-BOUNDARIES.md` e `OPERATION-LIFECYCLE.md` convergono su un principio: Work e Sale descrivono componenti della stessa situazione reale e non devono generare record duplicati quando appartengono allo stesso fatto.

## Decisione

`Operation` deve diventare un **aggregate root del dominio**.

`Work` e `Sale` non sono aggregate root separati nella V1. Sono componenti, profili o proiezioni della `Operation`:

- `Work` rappresenta la componente creativa/lavorativa;
- `Sale` rappresenta la componente commerciale;
- `Payment/Income` puo diventare entita autonoma quando serve riconciliazione, ma deve riferire una `Operation` o una causale esterna esplicita.

## Motivazione

Questa scelta evita duplicazione e divergenza tra commissioni, vendite e pagamenti. Una sola `Operation` puo rappresentare:

- solo Work, ad esempio una commissione gratuita;
- solo Sale, ad esempio un fumetto venduto allo stand;
- Work + Sale, ad esempio uno sketch richiesto, pagato e ritirato in giornata.

`Prodotto` resta la definizione commerciale di catalogo. Commissione, Sketch e Bundle sono Prodotti quando descrivono l'offerta ripetibile; diventano parte di una `Operation` solo quando esiste un caso concreto con cliente, stato, consegna, vendita o pagamento.

`Lotto` resta distinto da `Prodotto`: rappresenta un raggruppamento operativo di quel prodotto. Una vendita rapida deve poter salvare il Prodotto senza selezionare subito il Lotto.

La registrazione Operazioni ha due superfici: Modalita Fiera, ottimizzata per pochi passaggi e dati incompleti, e Backoffice, dedicato a correzioni e completamento. Entrambe scrivono la stessa `Operation`.

Permette inoltre di mantenere nello stesso confine:

- cliente registrato o Cliente soft;
- stato Work;
- stato Sale;
- stato economico;
- incassi e saldi;
- fiera di origine, consegna e contabilizzazione;
- completezza e dati mancanti;
- storico delle transizioni.

## Conseguenze

- Il futuro `OperationRepository` sara il repository principale di scrittura per questi casi.
- `WorkRepository` e `SaleRepository`, se introdotti, dovranno essere query/proiezioni o adapter di lettura, non fonti di verita autonome.
- Le feature Angular dovranno evitare di creare una commissione e una vendita separate quando descrivono lo stesso fatto reale.
- La Modalita Fiera non deve richiedere selezione Lotto o creazione Party; questi dati possono essere recuperati dopo.
- Le transizioni operative e gli stati economici devono essere coordinati dalla `Operation`, mantenendo concetti separati.
- La migrazione da dati storici dovra mappare righe legacy verso Operation, marcando i casi ambigui come `needsReview`.

## Alternative considerate

### Work e Sale come aggregate root separati

Scartata perche introduce duplicazione nei casi ibridi e rende difficile mantenere coerenti pagamento, consegna, cliente e fiera contabile.

### Operation solo come concetto documentale

Scartata perche non fornisce un confine di consistenza sufficiente per repository, workflow e UI future.

### Payment come aggregate principale

Scartata perche il pagamento non rappresenta il fatto creativo o commerciale completo. E un evento economico collegato.

### Acquisto destinato alla vendita come Operation

Scartata per la V1 perche l'acquisto di prodotti destinati alla vendita non rappresenta una vendita al cliente ne un incarico creativo. E un costo di approvvigionamento osservabile nel foglio storico `Prodotti`, spesso senza prodotto o lotto normalizzato. Modellarlo come `Operation` rallenterebbe il workflow reale e confonderebbe Work/Sale con approvvigionamento. Resta collegabile in futuro a Prodotto, Lotto, Uscita o Pagamento.

### Commissione, Sketch e Bundle come entita separate dal catalogo

Scartata perche peggiora la velocita operativa e duplica l'offerta commerciale. In fiera l'artista deve poter cercare rapidamente un prodotto chiamato Sketch, Commissione o Bundle, poi aprire una Operation solo se serve gestire cliente, consegna, stato o pagamento. Il catalogo resta la fonte della definizione vendibile; Operation resta la fonte del fatto operativo. La V1 rimuove anche la categoria prodotto per evitare una selezione intermedia non presente nell'Excel storico.

## Criteri di revisione

La decisione puo essere rivalutata se in futuro emergono workflow in cui Work o Sale hanno vita autonoma completa, regole di consistenza indipendenti e storico separato non riconducibile a una Operation. In quel caso dovra essere creato un nuovo ADR e una migrazione esplicita del modello.
