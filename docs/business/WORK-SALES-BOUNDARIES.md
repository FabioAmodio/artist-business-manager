# Confini di dominio tra Work e Sale

## Scopo

Questo documento definisce i confini concettuali tra `Work`, `Sale`, `Operation`, `Event` e `Party`. Non modifica il modello dati e non introduce nuove entita persistenti. Serve a evitare ambiguita nei workflow artistici e fumettistici, soprattutto durante fiere ed eventi.

Per gli stati e le transizioni consentite consultare [OPERATION-LIFECYCLE.md](OPERATION-LIFECYCLE.md).

## Principio guida

`Operation` e il contenitore persistente primario. `Work` e la componente di lavoro creativo di una Operazione. `Sale` e la componente commerciale di cessione o pagamento.

In termini pratici:

- se l'artista deve produrre, completare o consegnare un risultato creativo richiesto, esiste un `Work`;
- se l'artista cede un prodotto pronto o registra un incasso commerciale, esiste una `Sale`;
- una stessa `Operation` puo contenere sia Work sia Sale;
- Work e Sale non devono essere duplicati come record indipendenti quando descrivono lo stesso caso reale.

## Differenza tra Work e Sale

### Work

`Work` descrive il lavoro creativo da fare o gia fatto per una richiesta specifica. Ha senso parlare di Work quando esistono uno o piu di questi elementi:

- brief o descrizione richiesta;
- cliente o committente;
- stato di avanzamento;
- scadenza o consegna;
- revisioni o approvazioni;
- risultato creativo da produrre;
- file, originale, sketch, tavola o illustrazione da consegnare.

Esempi:

- commissione privata per un ritratto;
- sketch richiesto allo stand da consegnare dopo un'ora;
- tavola editoriale da consegnare a un editore;
- illustrazione personalizzata da spedire;
- commissione presa ad Alecomics e consegnata ad Albissola Comics.

### Sale

`Sale` descrive la transazione commerciale. Ha senso parlare di Sale quando esistono uno o piu di questi elementi:

- prodotto o bundle ceduto;
- prezzo applicato;
- quantita;
- metodo di pagamento;
- sconto, coupon o reso;
- incasso immediato o residuo da ricevere.

Esempi:

- vendita di un fumetto gia stampato;
- vendita di una print A4;
- vendita di un bundle fumetto + sketchbook;
- vendita di un originale gia pronto;
- incasso del saldo di una commissione.

## Quando una commissione e un Work

Una commissione e un Work quando richiede produzione o completamento di un risultato creativo personalizzato.

Esempi:

- il cliente chiede: "Puoi farmi un ritratto del mio personaggio?";
- un visitatore chiede uno sketch e torna a ritirarlo piu tardi;
- un committente approva un preventivo per una copertina;
- un editore richiede una sequenza di tavole.

La commissione puo essere incompleta al primo salvataggio. Se mancano telefono, prezzo, scadenza o prodotto, resta comunque una `Operation` con componente Work e stato da completare.

## Quando uno sketch e un Work

Uno sketch e un Work quando viene creato su richiesta o deve ancora essere completato/consegnato.

Esempi Work:

- sketch richiesto in fiera, pagato con acconto e completato dopo pranzo;
- sketch commissionato online e spedito successivamente;
- sketch personalizzato con soggetto indicato dal cliente;
- sketch da consegnare in una fiera futura.

In questi casi lo sketch ha un ciclo di vita: richiesta, accettazione, lavorazione, pronto, consegna, pagamento.

Uno sketch puo invece essere solo Sale quando e gia pronto e viene venduto come prodotto finito, senza personalizzazione e senza lavoro residuo.

## Quando un prodotto e una Sale

Un prodotto e Sale quando viene ceduto come articolo pronto, con quantita e prezzo.

Esempi:

- fumetto stampato venduto allo stand;
- artbook;
- print;
- sticker;
- segnalibro;
- originale gia realizzato;
- bundle predefinito.

La vendita puo avere cliente assente, cliente soft o cliente registrato. L'assenza del cliente non trasforma la vendita in Work.

## Operazioni ibride

Alcuni casi reali contengono sia Work sia Sale.

### Commissione pagata subito

Un visitatore ordina uno sketch personalizzato e paga tutto subito. La `Operation` contiene:

- Work: sketch da realizzare;
- Sale/Incasso: pagamento ricevuto;
- Event: fiera di origine;
- Party o cliente soft: nome o contatto del visitatore.

Non si crea una vendita separata e una commissione separata se descrivono lo stesso fatto.

### Prodotto piu personalizzazione

Il cliente compra un fumetto e chiede una dedica disegnata. Possibili interpretazioni:

- se la dedica e immediata, semplice e non tracciata, puo restare una Sale con nota;
- se la dedica richiede tempo, ritiro, prezzo aggiuntivo o scadenza, diventa Operation con componente Work.

### Bundle con sketch incluso

Un bundle "Fumetto + sketch personalizzato" puo essere:

- Sale, se lo sketch e un prodotto standard gia pronto;
- Operation ibrida, se lo sketch deve essere realizzato su richiesta.

## Collegamenti tra Work, Sale, Event e Party

### Party

`Party` rappresenta cliente, committente, editore o organizzazione. In una stessa Operation puo assumere ruoli diversi:

- cliente: riceve o acquista;
- committente: richiede e approva;
- editore: commissiona o paga;
- organizzatore: collegato a una fiera, non necessariamente alla vendita.

Se il nome non merita ancora anagrafica completa, si usa Cliente soft.

### Event / FairEdition

`Event` o `FairEdition` forniscono il contesto operativo. Per una Operation possono esistere riferimenti distinti:

- fiera di origine: dove nasce la richiesta o vendita;
- fiera di consegna: dove viene ritirato o consegnato il lavoro;
- fiera di contabilizzazione: dove l'utente vuole attribuire il risultato economico.

Questi riferimenti possono coincidere o differire.

### Sale e incassi

La Sale non equivale automaticamente a denaro incassato. Il pagamento e rappresentato da incassi o movimenti economici collegati alla Operation.

Esempio: una commissione concordata a 80 euro con acconto di 20 euro contiene un valore concordato e un incasso parziale. Il saldo resta aperto.

## Casi limite

### Sketch pronto sul tavolo

Se lo sketch e gia pronto e il visitatore lo compra, e Sale.

### Sketch disegnato al momento ma senza tracciamento

Se e prodotto immediatamente, pagato e consegnato senza bisogno di ricordare altro, puo essere Sale con nota. Se l'artista vuole misurare tempi, soggetto, cliente o consegna, diventa Work.

### Commissione gratuita

Una commissione gratuita resta Work se richiede produzione creativa. L'assenza di prezzo non la trasforma in Sale.

### Acconto senza lavoro avviato

Un acconto ricevuto per una richiesta accettata appartiene alla Operation della commissione. Non crea una Sale autonoma.

### Prenotazione di prodotto

Una prenotazione di fumetto o print pronta e una Operation di tipo prenotazione con futura Sale. Se include personalizzazione, contiene anche Work.

### Vendita con pagamento rimandato

Una vendita non incassata resta Sale con stato economico aperto. Non diventa Work per il solo fatto che il pagamento avverra dopo.

### Fiera diversa tra ordine e consegna

Una commissione presa ad Alecomics e consegnata ad Albissola Comics e una sola Operation con:

- Work: commissione;
- originFair: Alecomics;
- deliveryFair: Albissola Comics;
- accountingFair: scelta gestionale dell'utente.

## Regole operative

1. Non duplicare Operation per rappresentare Work e Sale dello stesso fatto.
2. Usare Work quando esiste lavoro creativo richiesto, stato o consegna.
3. Usare Sale quando esiste cessione, prezzo, quantita o incasso commerciale.
4. Usare entrambi come componenti della stessa Operation nei casi ibridi.
5. Party e cliente soft descrivono chi e coinvolto, non il tipo di Operation.
6. Event/FairEdition descrive dove o quando avviene il fatto, non decide da solo se e Work o Sale.
7. Pagamento, acconto e saldo sono movimenti economici collegati, non criteri sufficienti per creare Work.

## Esempi rapidi

| Caso | Work | Sale | Note |
|---|---:|---:|---|
| Fumetto venduto allo stand | No | Si | prodotto pronto |
| Print venduta online | No | Si | spedizione eventuale non crea Work |
| Ritratto commissionato | Si | Possibile | Sale/Incasso quando si paga |
| Sketch richiesto e ritirato dopo | Si | Possibile | Work con consegna |
| Sketch gia pronto venduto | No | Si | prodotto finito |
| Dedica rapida gratuita | Opzionale | No | nota se non serve tracciamento |
| Copertina per editore | Si | No/Incasso | lavoro editoriale |
| Bundle pronto | No | Si | se nessuna personalizzazione |
| Bundle con sketch su richiesta | Si | Si | Operation ibrida |
