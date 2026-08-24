# Operation Lifecycle

## Scopo

Questo documento definisce stati, transizioni e regole di dominio per le principali entita operative di Artist Business Manager. E il riferimento per i workflow futuri e per l'implementazione delle feature Angular.

Non definisce schema database, API, componenti UI o diagrammi tecnici. Usa `Operation` come contenitore persistente primario, coerentemente con `WORK-SALES-BOUNDARIES.md`.

## Principi generali

- Work e Sale sono componenti concettuali di una Operation.
- Una Operation puo contenere solo Work, solo Sale oppure Work + Sale.
- Pagamento, consegna e completamento creativo sono eventi distinti.
- Una consegna non implica pagamento automatico.
- Un pagamento non implica consegna automatica.
- Ogni transizione deve conservare storico, data e motivo quando rilevante.
- Le cancellazioni sono logiche e non distruttive.
- Le transizioni arbitrarie sono vietate salvo operazione di correzione esplicita e auditata.

## 1. Lifecycle di Work

`Work` descrive la componente creativa/lavorativa di una Operation.

### Stati

#### Draft

Significato: appunto iniziale o richiesta non ancora strutturata.

Entra quando l'artista annota un possibile lavoro, anche incompleto.

Esce verso: `Requested`, `Cancelled`.

Vietato passare direttamente a: `In Progress`, `Delivered`, `Completed`.

#### Requested

Significato: richiesta ricevuta dal cliente, committente o editore.

Entra quando esiste una richiesta riconoscibile, anche senza prezzo definitivo.

Esce verso: `Quoted`, `Accepted`, `Cancelled`.

Vietato passare direttamente a: `Ready`, `Completed`.

#### Quoted

Significato: proposta economica o preventivo preparato.

Entra quando l'artista comunica prezzo, condizioni o proposta.

Esce verso: `Accepted`, `Cancelled`.

Vietato passare a: `Delivered` senza accettazione o decisione esplicita.

#### Accepted

Significato: lavoro accettato, da realizzare.

Entra quando il cliente conferma la proposta oppure l'artista accetta di procedere.

Esce verso: `In Progress`, `Cancelled`.

Vietato passare direttamente a: `Completed`.

#### In Progress

Significato: lavoro creativo in corso.

Entra quando l'artista inizia la produzione.

Esce verso: `Waiting Review`, `Ready`, `Cancelled`.

Vietato passare a: `Paid` perche il pagamento e stato economico, non stato Work.

#### Waiting Review

Significato: lavoro inviato o mostrato per revisione/approvazione.

Entra quando il cliente o committente deve dare feedback.

Esce verso: `Approved`, `In Progress`, `Cancelled`.

Vietato passare a: `Completed` se l'approvazione e obbligatoria e non e stata ricevuta.

#### Approved

Significato: lavoro approvato dopo revisione.

Entra quando la revisione e accettata.

Esce verso: `Ready`, `Delivered`.

Vietato passare a: `Cancelled` senza motivo esplicito.

#### Ready

Significato: lavoro pronto per consegna o ritiro.

Entra quando la produzione e terminata e il lavoro puo essere consegnato.

Esce verso: `Delivered`, `Cancelled`.

Vietato passare a: `In Progress` senza registrare riapertura o correzione.

#### Delivered

Significato: lavoro consegnato o ritirato.

Entra quando il risultato arriva al cliente o destinatario.

Esce verso: `Completed`, `In Progress` solo per riapertura motivata.

Vietato assumere pagamento automatico.

#### Completed

Significato: ciclo creativo concluso e nessuna azione operativa residua.

Entra quando consegna e verifiche sono concluse.

Esce solo tramite riapertura auditata o correzione amministrativa.

Vietato cancellare fisicamente.

#### Cancelled

Significato: lavoro annullato.

Entra da qualunque stato prima di `Completed`, con motivo.

Esce solo tramite ripristino o riapertura auditata.

### Diagramma testuale

```text
Draft
  -> Requested
  -> Quoted
  -> Accepted
  -> In Progress
  -> Waiting Review
  -> Approved
  -> Ready
  -> Delivered
  -> Completed

Alternative:
Requested/Quoted/Accepted/In Progress/Ready -> Cancelled
Waiting Review -> In Progress
Delivered -> In Progress (riapertura motivata)
```

## 2. Lifecycle di Sale

`Sale` descrive la componente commerciale di una Operation.

### Differenza tra vendita, incasso e pagamento

- Vendita: cessione o impegno commerciale relativo a prodotto, bundle o lavoro.
- Incasso: denaro effettivamente ricevuto dall'artista.
- Pagamento: evento finanziario; puo essere incasso, acconto, saldo, rimborso o storno.

Una vendita non coincide automaticamente con l'incasso. Una vendita puo essere non pagata, parzialmente pagata o rimborsata.

### Stati

#### Draft

Vendita abbozzata o incompleta.

Esce verso: `Pending Payment`, `Paid`, `Cancelled`.

#### Pending Payment

Vendita registrata, pagamento atteso.

Esce verso: `Partially Paid`, `Paid`, `Cancelled`.

#### Partially Paid

Almeno un incasso e stato ricevuto, ma resta un saldo.

Esce verso: `Paid`, `Refunded`, `Cancelled` solo con storno o motivo.

#### Paid

Importo dovuto completamente incassato.

Esce verso: `Refunded` o correzione auditata.

#### Refunded

Importo rimborsato totalmente o parzialmente.

Esce tramite nuova transazione compensativa, non cancellando la vendita originale.

#### Cancelled

Vendita annullata prima di completamento economico oppure resa non valida.

Richiede motivo e conserva storico.

### Diagramma testuale

```text
Draft
  -> Pending Payment
  -> Partially Paid
  -> Paid

Alternative:
Draft/Pending Payment -> Paid
Pending Payment/Partially Paid -> Cancelled
Paid/Partially Paid -> Refunded
```

## 3. Lifecycle di Operation

Operation aggrega i lifecycle di Work, Sale ed Economic status.

### Tipi di Operation

- Solo Work: commissione gratuita, lavoro editoriale non ancora pagato, sketch da realizzare.
- Solo Sale: prodotto pronto venduto, print, fumetto, bundle standard.
- Work + Sale: commissione pagata, sketch richiesto e saldato, bundle con personalizzazione.

### Stati aggregati suggeriti

- `Draft`: nessuna componente ancora stabilizzata.
- `Open`: Work o Sale richiede azione.
- `In Progress`: Work attivo o pagamento aperto.
- `Waiting`: in attesa di revisione, ritiro, pagamento o dati.
- `Done`: componenti operative concluse.
- `Cancelled`: Operation annullata logicamente.

### Coerenze richieste

- Work `Completed` non impone Sale `Paid`.
- Sale `Paid` non impone Work `Delivered`.
- Operation `Done` richiede che non ci siano azioni operative o economiche aperte.
- Operation con Work cancellato puo mantenere Sale/Incasso se esistono storni o penali.
- Operation con Sale rimborsata non cancella il Work consegnato.

### Esempi

- Fumetto venduto allo stand: Operation solo Sale, finale `Done` quando pagata/consegnata.
- Commissione con saldo aperto: Operation Work `Delivered`, Sale `Partially Paid`, aggregato `Waiting`.
- Sketch pagato prima: Sale `Paid`, Work `In Progress`, aggregato `In Progress`.

## 4. Lifecycle di Preventivo

Preventivo e proposta economica precedente o collegata alla Operation.

### Stati

#### Draft

Preventivo in preparazione.

Esce verso: `Sent`, `Cancelled` implicito se scartato.

#### Sent

Preventivo inviato al cliente/committente.

Esce verso: `Viewed`, `Accepted`, `Rejected`, `Expired`.

#### Viewed

Il destinatario ha visto o ricevuto conferma di lettura.

Esce verso: `Accepted`, `Rejected`, `Expired`.

#### Accepted

Il destinatario accetta condizioni e importo.

Esce verso: `Converted`.

Genera o aggiorna un Work quando l'accettazione crea un impegno creativo da realizzare.

#### Rejected

Preventivo rifiutato. Non genera Work attivo.

#### Expired

Scadenza offerta superata. Non genera Work senza nuova conferma.

#### Converted

Preventivo trasformato in Operation/Work. Lo storico del preventivo resta conservato.

### Diagramma testuale

```text
Draft -> Sent -> Viewed -> Accepted -> Converted
              \-> Rejected
              \-> Expired
Sent -> Accepted -> Converted
```

## 5. Lifecycle di Scadenza

Scadenza rappresenta un obbligo temporale.

### Stati

- `Planned`: scadenza futura non imminente.
- `Upcoming`: scadenza futura entro una finestra configurabile.
- `Due Today`: scadenza nella data corrente.
- `Overdue`: scadenza passata e non completata.
- `Completed`: obbligo completato.
- `Cancelled`: scadenza annullata.

### Logiche di calcolo

- Se completata: `Completed` indipendentemente dalla data.
- Se annullata: `Cancelled`.
- Se `dueDate` e oggi: `Due Today`.
- Se `dueDate` e passata: `Overdue`.
- Se `dueDate` e entro la soglia imminente: `Upcoming`.
- Altrimenti: `Planned`.

La soglia `Upcoming` deve essere configurabile; valore iniziale suggerito: 7 giorni per scadenze ordinarie, 30 giorni per pianificazione fiera.

### Diagramma testuale

```text
Planned -> Upcoming -> Due Today -> Overdue
   \          \            \          \
    -> Completed / Cancelled
```

## 6. Lifecycle di Evento/Fiera

Evento/Fiera copre pianificazione, preparazione, partecipazione e consuntivo.

### Stati

#### Planned

Evento registrato come possibilita o appuntamento noto.

Esce verso: `Confirmed`, `Cancelled`.

#### Confirmed

Partecipazione confermata dall'artista o dall'organizzatore.

Esce verso: `Preparing`, `Cancelled`.

#### Preparing

Hotel, viaggio, stand, materiali e scadenze sono in gestione.

Esce verso: `Active`, `Cancelled`.

#### Active

La data corrente rientra nell'intervallo dell'evento.

Esce verso: `Completed` dopo la fine.

#### Completed

Evento concluso; vendite, costi e note possono essere ancora completati.

Esce verso: `Archived`.

#### Archived

Evento consolidato e usato principalmente per storico/report.

#### Cancelled

Evento annullato; restano costi, rimborsi e prenotazioni da gestire.

### Diagramma testuale

```text
Planned -> Confirmed -> Preparing -> Active -> Completed -> Archived
    \          \            \
     -> Cancelled
```

## 7. Lifecycle economico

Lo stato economico e separato da Work e Sale.

### Stati

- `Preventivato`: importo stimato o proposta preparata.
- `Concordato`: importo accettato da cliente/committente.
- `Acconto ricevuto`: primo incasso ricevuto.
- `Parzialmente pagato`: incasso inferiore al dovuto.
- `Pagato`: saldo completo ricevuto.
- `Insoluto`: pagamento atteso non ricevuto entro scadenza.
- `Annullato`: rapporto economico annullato o stornato.

### Eventi di cambio stato

- Creazione preventivo: `Preventivato`.
- Accettazione preventivo o prezzo concordato: `Concordato`.
- Registrazione acconto: `Acconto ricevuto` o `Parzialmente pagato`.
- Registrazione saldo: `Pagato`.
- Scadenza pagamento superata: `Insoluto`.
- Cancellazione o storno: `Annullato`.

### Relazioni con Work e Sale

- Work `Ready` non cambia stato economico.
- Work `Delivered` non cambia stato economico automaticamente.
- Sale `Paid` di solito porta stato economico a `Pagato`.
- Acconto puo esistere prima di Work `In Progress`.
- Saldo puo essere ricevuto mesi dopo Work `Delivered`.

## 8. Aggregate Ownership

Questa sezione chiarisce ownership concettuale e confini di consistenza. Non impone una struttura tecnica definitiva, ma guida repository e feature future.

### Operation

Aggregate root principale per fatti commerciali e incarichi. Rappresenta un fatto reale: richiesta, vendita, prenotazione, commissione, acconto o combinazione di questi.

Possiede:

- componenti Work;
- componenti Sale;
- stato economico della Operation;
- cliente soft;
- riferimenti a origin/delivery/accounting fair;
- note operative e dati incompleti;
- storico delle transizioni operative della Operation.

Referenzia:

- Party registrati;
- Event/FairEdition;
- Product/Bundle;
- Payment/Income se modellati come entita autonome;
- Deadline se condivisa o riutilizzata fuori dalla Operation.

Invarianti:

- non duplicare Work e Sale per lo stesso fatto;
- una Operation puo essere incompleta ma deve essere riconoscibile;
- cancellazione logica e storico sempre conservati;
- stati Work, Sale ed economico non devono essere confusi.

Decisione: `Operation` deve essere considerata l'aggregate root principale per la maggior parte dei workflow commerciali e creativi.

### Work

Work e componente interna o profilo della Operation, non aggregate root autonomo nella V1 concettuale. Puo avere stato, consegna, review e dati specifici, ma non dovrebbe esistere senza Operation.

Eccezione futura possibile: progetti editoriali complessi o opere lunghe possono richiedere un aggregate dedicato, ma devono collegarsi a Operation quando hanno valore commerciale.

### Sale

Sale e componente commerciale della Operation. Non dovrebbe esistere senza Operation perche prezzo, righe, cliente, evento e incassi devono essere riconducibili allo stesso fatto reale.

### Payment / Income

Payment o Income puo essere modellato come entita autonoma quando serve riconciliazione, rate, storni, rimborsi o report finanziari. Deve sempre referenziare una Operation o una causale esterna esplicita.

Non e posseduto da Work. Puo essere collegato a Sale o alla Operation aggregata.

### Deadline

Deadline puo esistere autonomamente perche puo riferirsi a Operation, FairEdition, Booking, pagamento, task o promemoria manuale. Deve sempre indicare origine, anche se l'origine e manuale.

### Party

Party e aggregate root autonomo dell'anagrafica. Operation referenzia Party o contiene Cliente soft. Party non possiede le Operation.

### Event / FairEdition

Event/FairEdition e aggregate root autonomo del contesto evento. Possiede pianificazione, booking, costi, stati logistici e informazioni organizzative. Operation lo referenzia per origine, consegna o contabilizzazione.

### Product / Bundle

Product e Bundle sono aggregate root di catalogo. Sale/Operation mantiene snapshot storico di prezzo, descrizione e configurazione al momento della vendita. Il catalogo non possiede le vendite.

## 9. Persistence Boundaries

Questa sezione evita futuri repository incoerenti. Non definisce tabelle, ma separa oggetti persistiti autonomamente, componenti interne e riferimenti.

### Oggetti persistiti autonomamente

- Operation;
- Party;
- FairSeries / FairEdition;
- Product;
- Bundle;
- Deadline, se manuale o condivisa tra piu contesti;
- Payment / Income, se richiede riconciliazione o report autonomo;
- Preventivo, se deve restare consultabile anche prima o dopo conversione.

### Componenti interne

- Work component dentro Operation;
- Sale component dentro Operation;
- righe di vendita o righe Operation;
- cliente soft;
- snapshot di prodotto/prezzo/configurazione;
- stato economico derivato o della Operation;
- transizioni di stato quando non devono essere consultate come entita indipendenti.

### Riferimenti

- `partyId` verso Party;
- `originFairId`, `deliveryFairId`, `accountingFairId` verso FairEdition;
- `productId` o `bundleId` verso catalogo;
- `paymentId` verso Payment/Income autonomo;
- `deadlineId` verso Deadline autonoma.

### Repository concettuali

`OperationRepository`: consigliato come repository principale per Operation, Work component e Sale component.

`WorkRepository`: da evitare nella V1 se rischia di duplicare Operation. Ammissibile solo come query/proiezione sui Work component.

`SaleRepository`: da evitare come repository di scrittura separato nella V1. Ammissibile come query/proiezione commerciale.

`PaymentRepository`: ammissibile quando Payment/Income diventa entita autonoma per riconciliazione e report.

`DeadlineRepository`: ammissibile per scadenze autonome e trasversali.

Regola: i repository di scrittura devono rispettare l'aggregate root. Le query possono avere viste specializzate, ma non devono creare nuove fonti di verita.

## 10. Cliente soft

Cliente soft e un riferimento testuale dentro una Operation, usato quando l'artista non vuole o non puo creare subito un Party completo.

### Quando usare Party completo

- cliente ricorrente;
- committente con contatti completi;
- editore o organizzazione;
- soggetto con pagamenti, storico, scadenze o relazioni multiple;
- cliente da ricontattare dopo la fiera.

### Quando usare Cliente soft

- nome annotato velocemente allo stand;
- contatto incompleto;
- visitatore occasionale;
- commissione rapida con solo nome e telefono;
- vendita dove non serve anagrafica.

### Limiti operativi

- non supporta deduplicazione affidabile;
- non dovrebbe essere usato per report cliente di lungo periodo;
- non sostituisce ruoli Party;
- deve poter essere convertito in Party senza perdere storico.

### Esempi in fiera

- "Marco, tel. 333..." per uno sketch da ritirare nel pomeriggio;
- "ragazza cosplay Zelda" come riferimento temporaneo;
- "Luca Instagram @..." per una commissione da completare dopo l'evento.

## 11. Fiere di origine, consegna e contabilizzazione

Questi riferimenti possono esistere nel dominio anche se non sono subito esposti nella UI.

### Origin Fair

Fiera in cui nasce la richiesta, la vendita, il contatto o la prenotazione. Serve a capire dove e stata generata l'opportunita.

Esempio: commissione presa ad Alecomics.

### Delivery Fair

Fiera in cui il lavoro viene consegnato o ritirato. Serve a pianificare logistica e scadenze.

Esempio: commissione consegnata ad Albissola Comics.

### Accounting Fair

Fiera a cui attribuire economicamente ricavi, costi o redditivita percepita. Serve al reporting gestionale e puo essere modificata dall'utente.

Esempio: lavoro preso ad Alecomics, consegnato ad Albissola, ma contabilizzato su Alecomics per valutare l'efficacia commerciale della fiera di origine.

### Regole

- I tre riferimenti possono coincidere.
- I tre riferimenti possono essere diversi.
- Accounting Fair non e una classificazione fiscale.
- Cambiare Accounting Fair non modifica origine o consegna.
- Le modifiche devono essere storicizzate.

## 12. Diagrammi semplificati

### Work

```text
Draft
↓
Requested
↓
Quoted
↓
Accepted
↓
In Progress
↓
Waiting Review
↓
Approved
↓
Ready
↓
Delivered
↓
Completed
```

### Sale

```text
Draft
↓
Pending Payment
↓
Partially Paid
↓
Paid
↓
Refunded
```

### Preventivo

```text
Draft
↓
Sent
↓
Viewed
↓
Accepted
↓
Converted
```

### Evento/Fiera

```text
Planned
↓
Confirmed
↓
Preparing
↓
Active
↓
Completed
↓
Archived
```

## 13. Casi reali

| Caso | Operation | Work | Sale | Payment | Economic Status | Stato finale previsto |
|---|---|---|---|---|---|---|
| Fumetto venduto allo stand | vendita immediata | No | Paid se incassato | incasso immediato | Pagato | Done |
| Print venduta online | vendita immediata | No | Pending o Paid | pagamento online o bonifico | Pending Payment/Pagato | Done quando spedizione e incasso sono chiusi |
| Sketch richiesto e ritirato in giornata | commissione rapida | In Progress -> Delivered | Paid o Partially Paid | acconto o saldo allo stand | Pagato o Parzialmente pagato | Completed quando consegnato e saldato |
| Sketch pronto sul tavolo | vendita immediata | No | Paid | incasso immediato | Pagato | Done |
| Commissione presa in fiera | commissione | Requested -> Accepted -> In Progress | Pending/Partial/Paid | acconto opzionale | Concordato o Acconto ricevuto | Waiting/In Progress |
| Commissione con acconto | commissione con acconto | Accepted -> In Progress | Partially Paid | acconto registrato | Acconto ricevuto | Waiting fino a consegna/saldo |
| Commissione gratuita | commissione | Requested -> In Progress -> Delivered | No | nessuno | Annullato o non applicabile | Completed quando consegnata |
| Copertina editoriale | lavoro editoriale | Quoted -> Accepted -> Waiting Review -> Approved -> Delivered | incassi separati | fattura, acconto, saldo | Concordato/Parzialmente pagato/Pagato | Completed dopo approvazione e consegna |
| Fumetto completo | progetto/opera | Work se produzione tracciata | Sale solo quando venduto | incassi su vendite successive | variabile | Completed come opera, vendite separate |
| Bundle con personalizzazione | ibrida | Accepted -> Ready -> Delivered | Pending/Partial/Paid | acconto o saldo | Variabile | Done quando Work e Sale sono chiusi |
| Commissione presa ad Alecomics e consegnata ad Albissola Comics | fair-delivery-commission | Requested -> Ready -> Delivered | Pending/Partial/Paid | acconto in origine, saldo in consegna | Acconto ricevuto -> Pagato | Completed dopo consegna e saldo |
| Acconto ricevuto in fiera | aggiornamento economico della commissione | Requested o Accepted | Partially Paid | acconto | Acconto ricevuto | Operation resta Waiting/In Progress |
| Saldo ricevuto mesi dopo | aggiornamento economico | gia Delivered/Completed | Paid | saldo | Pagato | Done se nessuna azione aperta |

## 14. Regole fondamentali

1. Nessun salto arbitrario di stato senza audit.
2. Nessuna duplicazione tra Work e Sale nella stessa situazione reale.
3. Lo storico delle transizioni deve essere conservato.
4. Le cancellazioni sono logiche.
5. Pagamenti e lavori sono concetti distinti.
6. Una consegna non implica pagamento automatico.
7. Un pagamento non implica consegna automatica.
8. Un preventivo accettato genera Work solo se crea un impegno creativo.
9. Uno stato economico non deve essere usato come stato operativo.
10. Uno stato operativo non deve essere usato come stato economico.
11. Event/FairEdition fornisce contesto, non determina da solo il tipo Work/Sale.
12. Ogni correzione retroattiva deve essere tracciabile.
