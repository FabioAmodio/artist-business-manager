# ADR: Operation nel dominio applicativo

## Stato

Proposta accettata come linea architetturale di dominio.

Data: 2026-08-24

## Contesto

Nel dominio di Artist Business Manager il concetto di `Operation` e emerso per rappresentare un fatto reale che puo contenere componenti diverse:

- `Work`, cioe lavoro creativo richiesto o da completare;
- `Sale`, cioe cessione commerciale di un prodotto, bundle o risultato;
- `Payment` / `Income`, cioe incassi, acconti, saldi, rimborsi o storni;
- riferimenti a `Event` / `FairEdition`;
- riferimenti a `Party` o Cliente soft.

Esempi:

```text
Commissione presa in fiera
Operation
├── Work
├── Payment (acconto)
├── Party o Cliente soft
└── Event/FairEdition di origine
```

```text
Vendita di un Artbook
Operation
└── Sale
```

```text
Bundle con sketch personalizzato
Operation
├── Sale
└── Work
```

La documentazione corrente converge gia su questa direzione:

- `DATA-MODEL.md` descrive `Work` come componente/profilo e non come aggregate root autonomo;
- `WORK-SALES-BOUNDARIES.md` chiarisce che Work e Sale non devono duplicare la stessa situazione reale;
- `WORKFLOWS.md` descrive i workflow come varianti del ciclo di vita di una Operation;
- `TERMINOLOGY.md` distingue cliente, committente, vendita, lavoro e canale;
- `OPERATION-LIFECYCLE.md` definisce Operation come confine di ownership e consistenza.

## Opzioni valutate

## Opzione 1: Operation solo documentale

Operation resta un termine utile per ragionare sui workflow, ma non diventa un aggregate root reale. Le implementazioni future potrebbero avere repository separati per Work, Sale, Commissione, Prenotazione e Pagamento.

### Impatto sul dominio

Vantaggio: riduce il cambiamento immediato, perche non obbliga a riorganizzare il modello persistente.

Svantaggio: lascia ambigui i confini di consistenza. Work, Sale e Payment rischiano di diventare entita scollegate, anche quando descrivono lo stesso fatto reale.

### Impatto sui workflow

I workflow ibridi diventano difficili da rappresentare. Una commissione con acconto potrebbe richiedere un record commissione, un record vendita e un record pagamento da tenere sincronizzati manualmente.

### Impatto sulle relazioni

Party, Event/FairEdition e Product rischiano di essere collegati in modo diverso a Work, Sale e Payment, generando relazioni parallele e potenzialmente incoerenti.

### Impatto sulle statistiche

Le statistiche rischiano doppi conteggi: una commissione con acconto potrebbe apparire sia come lavoro sia come vendita separata.

### Impatto su fiere

La distinzione tra fiera di origine, consegna e contabilizzazione diventerebbe piu fragile, perche ogni entita potrebbe avere il proprio riferimento fiera.

### Impatto su clienti

Cliente registrato e Cliente soft potrebbero essere duplicati tra Work e Sale.

### Impatto su commissioni

Le commissioni rimarrebbero centrali, ma i pagamenti collegati dovrebbero essere coordinati fuori dal loro confine.

### Impatto su vendite

Le vendite semplici sarebbero facili, ma i casi ibridi richiederebbero collegamenti manuali.

### Impatto su pagamenti

Payment diventerebbe l'unico legame affidabile tra Work e Sale, ma non rappresenta il fatto creativo/commerciale completo.

### Valutazione

Questa opzione e sconsigliata. Va bene per analisi iniziale, ma non e abbastanza robusta per implementare feature Angular coerenti.

## Opzione 2: Operation come Aggregate Root

Operation diventa l'aggregate root principale per fatti commerciali e incarichi. Work e Sale sono componenti, profili o proiezioni della Operation. Payment/Income puo essere autonomo quando serve riconciliazione, ma deve riferire Operation o una causale esterna esplicita.

### Impatto sul dominio

Vantaggio: offre un confine chiaro per rappresentare un fatto reale completo. Permette di modellare vendite semplici, lavori creativi e casi ibridi senza duplicazioni.

Svantaggio: richiede disciplina nell'implementazione. Non bisogna ricadere in WorkRepository o SaleRepository come fonti di verita separate.

### Impatto sui workflow

I workflow diventano piu coerenti. Una Operation puo avanzare con componenti diverse:

- Work: stato creativo;
- Sale: stato commerciale;
- Economic Status: stato economico;
- Payment: eventi finanziari collegati.

### Impatto sulle relazioni

Party, Event/FairEdition e Product/Bundle vengono collegati alla Operation e, quando necessario, alle sue componenti interne. Questo riduce ambiguita e duplicazioni.

### Impatto sulle statistiche

Le statistiche possono partire da Operation come dimensione primaria e poi distinguere componenti Work, Sale e Payment. Questo evita doppi conteggi e consente drill-down coerente.

### Impatto su fiere

Operation puo contenere:

- `originFairId`;
- `deliveryFairId`;
- `accountingFairId`.

Questo rappresenta correttamente casi come commissione presa ad Alecomics e consegnata ad Albissola Comics.

### Impatto su clienti

Operation puo contenere Cliente soft oppure riferimento a Party. La conversione futura da Cliente soft a Party non richiede duplicare Work o Sale.

### Impatto su commissioni

Una commissione diventa una Operation con componente Work. Se ha acconto o saldo, la componente economica resta nello stesso confine concettuale.

### Impatto su vendite

Una vendita semplice diventa una Operation con solo Sale. Questo non introduce complessita e consente di gestire vendite non incassate o rimborsate.

### Impatto su pagamenti

Payment/Income resta distinto concettualmente, ma referenzia Operation. Un pagamento non crea automaticamente consegna e una consegna non crea automaticamente pagamento.

### Valutazione

Questa e l'opzione raccomandata. E la piu coerente con il dominio reale e con la documentazione gia prodotta.

## Opzione 3: Operation come futura evoluzione

Il progetto continua inizialmente con entita separate, ad esempio Commissione e Vendita, e introduce Operation solo dopo aver validato altri workflow.

### Impatto sul dominio

Vantaggio: rinvia una scelta strutturale complessa.

Svantaggio: crea debito concettuale quasi immediato. Le prime feature rischiano di nascere con confini sbagliati e richiedere migrazioni successive.

### Impatto sui workflow

Le feature iniziali potrebbero sembrare piu semplici, ma i casi reali gia noti sono ibridi. La migrazione a Operation diventerebbe piu costosa dopo avere implementato vendite e commissioni separate.

### Impatto sulle relazioni

Si dovrebbero definire relazioni provvisorie da smantellare in futuro, ad esempio tra vendita, commissione, pagamento e fiera.

### Impatto sulle statistiche

Le statistiche iniziali potrebbero basarsi su entita separate e poi dover essere riconciliate.

### Impatto su fiere

La contabilizzazione fieristica verrebbe probabilmente duplicata tra vendite e commissioni.

### Impatto su clienti

Cliente soft e Party potrebbero essere gestiti diversamente nei diversi moduli.

### Impatto su commissioni

Le commissioni verrebbero implementate come aggregate separati, ma poi dovrebbero essere ricondotte a Operation.

### Impatto su vendite

Le vendite sarebbero semplici nel breve periodo, ma diventerebbero difficili nei casi con personalizzazione o pagamento differito.

### Impatto su pagamenti

I pagamenti dovrebbero collegarsi a entita diverse prima e a Operation poi.

### Valutazione

Questa opzione e rischiosa. Rinvia il problema ma non lo elimina, e il dominio attuale contiene gia abbastanza evidenze per decidere ora.

## Verifica sui casi reali

| Caso | Lettura dominio | Operation consigliata |
|---|---|---|
| Artbook | Sale semplice | Operation solo Sale |
| Fumetto venduto allo stand | Sale semplice | Operation solo Sale |
| Print | Sale semplice | Operation solo Sale |
| Bundle pronto | Sale semplice | Operation solo Sale |
| Commissione privata | Work creativo | Operation solo Work, con Sale/Payment quando incassata |
| Copertina editoriale | Work professionale | Operation solo Work o Work + Payment |
| Fumetto completo | Opera/progetto; vendite separate | Operation per eventuali incarichi o vendite, non per ogni concetto editoriale astratto |
| Sketch ordinato e pagato in fiera | Caso ibrido | Operation Work + Sale/Payment |
| Commissione con acconto | Caso ibrido | Operation Work + Payment parziale |
| Commissione presa in una fiera e consegnata in un'altra | Caso ibrido con piu riferimenti fiera | Operation con originFair, deliveryFair, accountingFair |
| Bundle con sketch personalizzato | Caso ibrido | Operation Sale + Work |
| Originale personalizzato | Dipende: pronto o richiesto | Operation solo Sale se pronto; Work + Sale se personalizzato |

## Decisione proposta

**Raccomandazione finale: Operation Aggregate Root.**

Operation deve diventare una vera aggregate root del dominio, non solo un concetto documentale e non una futura evoluzione indefinita.

## Motivazioni

1. Il dominio reale contiene casi ibridi gia noti.
2. Work e Sale sono componenti della stessa situazione reale, non sempre fatti separati.
3. I pagamenti devono rimanere distinti da lavoro e consegna, ma collegati allo stesso contesto.
4. Le fiere richiedono riferimenti multipli: origine, consegna e contabilizzazione.
5. Cliente soft e Party devono poter evolvere senza duplicare record.
6. Le statistiche hanno bisogno di una dimensione primaria stabile.
7. Rinviare la decisione produrrebbe migrazioni e refactor piu costosi.

## Benefici

- Riduce duplicazione tra commissioni e vendite.
- Rende coerenti pagamenti, saldi e acconti.
- Supporta casi di fiera complessi.
- Permette report basati su una dimensione primaria.
- Supporta record incompleti e completamento progressivo.
- Semplifica la futura migrazione Excel verso un modello unico.
- Chiarisce il ruolo di Party e Cliente soft.

## Svantaggi

- Richiede progettazione attenta del modello Operation.
- Rende necessario evitare repository separati di scrittura per Work e Sale.
- Richiede UI capaci di mostrare componenti diverse dentro la stessa Operation.
- Puo apparire piu complesso rispetto a un CRUD separato Vendite/Commissioni.

## Impatto sul progetto Artist Business Manager

### Dominio

Operation diventa il confine principale per commissioni, vendite, prenotazioni e casi ibridi.

### Workflow

I workflow futuri dovranno creare o aggiornare Operation, non entita parallele scollegate.

### Repository

Il futuro `OperationRepository` deve essere repository principale di scrittura. Work e Sale possono avere viste o query dedicate, ma non fonti di verita autonome.

### UI Angular

Le future feature dovranno evitare wizard separati che creano duplicati. Una stessa schermata potra mostrare componenti Work, Sale e Payment quando presenti.

### Reporting

I report dovranno usare Operation come dimensione primaria e poi raggruppare per Work, Sale, Payment, Party, Product, FairEdition o Economic Status.

### Migrazione dati storici

Le righe legacy dovranno essere mappate verso Operation. I casi ambigui devono essere importati come `needsReview`.

## Raccomandazione per la fase attuale

La fase attuale non deve ancora implementare tutta la feature Operation, ma deve trattare la decisione come vincolante.

Azioni raccomandate:

1. Non implementare nuove feature Work o Sale come aggregate indipendenti.
2. Progettare `Operation` V1 come prossimo aggregate applicativo.
3. Tenere `Payment/Income` separabile ma sempre collegato a Operation.
4. Usare Party e Cliente soft come riferimenti della Operation.
5. Modellare i riferimenti fiera direttamente sulla Operation.
6. Aggiornare progressivamente le feature future per leggere Work/Sale come componenti o proiezioni.

## Decisione finale

**Operation Aggregate Root e la soluzione raccomandata e vincolante per le future implementazioni.**
