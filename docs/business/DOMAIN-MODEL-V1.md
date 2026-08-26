# Domain Model v1

## Stato del documento

Versione normativa del modello di dominio di Artist Business Manager. Questo documento consolida le decisioni su Operazioni, fiere, catalogo, clienti, finanza, persistenza e provenance. In caso di conflitto con documenti precedenti, prevale questo modello.

Le severita e le regole riutilizzabili di controllo qualita sono definite in [DATA-QUALITY-VALIDATION.md](DATA-QUALITY-VALIDATION.md).

Per le Fiere, l'implementazione corrente e `FairValidation`; il service applicativo coordina il salvataggio ma non contiene le regole specifiche.

## Aggiornamento fiere: serie ed edizioni

La precedente entita `Fair` rappresentava implicitamente una singola edizione. Nel modello aggiornato `FairSeries` rappresenta la manifestazione ricorrente, mentre `FairEdition` rappresenta una specifica edizione con date, luogo, costi e risultati propri. Il tipo `Fair` resta un alias di compatibilita per `FairEdition` e non introduce un terzo concetto.

## 1. Principi del dominio

- L'applicazione e un assistente operativo per artisti, illustratori, fumettisti e creativi.
- `Operazione` e l'aggregate root primaria per fatti commerciali e incarichi.
- Vendita, commissione e prenotazione sono tipi o profili di Operazione, non cicli di vita separati.
- Un'Operazione mantiene la propria identita mentre viene completata, pagata, consegnata o attribuita a una fiera.
- I record incompleti sono validi, persistenti e ricercabili.
- Lo stato operativo e distinto dallo stato economico.
- Le date, gli importi, le provenienze e le relazioni storiche non vengono sovrascritti senza audit.
- La persistenza locale e la fonte operativa primaria; rete e sync non sono prerequisiti.

## 2. Value object e tipi comuni

```text
EntityId = identificativo stabile generato localmente
IsoDateTime = istante ISO 8601 UTC
CalendarDate = data ISO YYYY-MM-DD
CurrencyAmount = importo intero nella minima unita della valuta
CurrencyCode = codice ISO 4217
```

Metadati comuni a ogni entita persistente:

- `id: EntityId`;
- `createdAt: IsoDateTime`;
- `updatedAt: IsoDateTime`;
- `deletedAt?: IsoDateTime` per soft delete;
- `revision: number`;
- `syncStatus: local-only | pending | synced | sync-error | conflict`;
- `sourceDeviceId?: string`;
- `lastModifiedBy?: EntityId`.

## 3. Entita

### 3.1 Party

Soggetto generale, persona o organizzazione, con uno o piu ruoli.

Attributi: nome visualizzato, tipo `person | organization`, recapiti, note, ruoli `customer | commissioner | publisher | supplier | collaborator`, categoria fornitore opzionale per il ruolo `supplier`, stato e metadati comuni.

La feature Clienti e la feature Fornitori sono viste operative filtrate della stessa anagrafica Party. Clienti mantiene compatibilita con i Party storici privi di ruoli; Fornitori richiede il ruolo `supplier` e una categoria iniziale tra tipografia, editore, materiali, marketplace e altro.

### 3.2 Cliente soft

Riferimento cliente dentro un'Operazione. Puo contenere `partyId` di un Party registrato, `freeName` testuale oppure nessun riferimento. `freeName` non crea automaticamente un'anagrafica.

Nella feature Party, Cliente soft non e una terza tipologia di anagrafica: resta un value object preparatorio da convertire eventualmente in Party in un secondo momento.

### 3.3 Canale

Origine commerciale o del contatto, ad esempio fiera, Instagram, sito, negozio, editore, marketplace, passaparola o altro.

Attributi: nome, classificazione, descrizione, stato e metadati comuni. Non e luogo fisico e non e metodo di pagamento.

### 3.4 Evento, FairSeries e FairEdition

`Evento` e un'occorrenza pianificata con nome, tipo, luogo, data inizio, data fine, note, stato e costi. `FairSeries` identifica la manifestazione ricorrente; `FairEdition` e la specializzazione operativa di Evento per una specifica edizione.

`FairSeries` contiene nome, organizzatore, contatti, sito, luogo predefinito e note. `FairEdition` contiene `fairSeriesId`, anno descrittivo, nome snapshot, date, luogo specifico, note sul luogo e note operative. L'anno non e l'identita dell'edizione.

Attributi specifici Fiera: nome, luogo, `startDate`, `endDate`, note, organizzatore, stand, partecipazione e stato.

Una Fiera e attiva quando:

`startDate <= currentDate <= endDate`

Le date sono inclusive. Se piu fiere sono attive, il sistema deve mostrare l'ambiguita e chiedere il contesto; non deve scegliere silenziosamente.

### 3.5 Operazione

Aggregate root primaria per vendita immediata, commissione, prenotazione e futuri flussi.

Attributi:

- `type`: `immediate-sale | commission | reservation | commission-with-deposit | fair-delivery-commission | shipment-commission | future`;
- `createdAt`, date dell'operazione, consegna e ultimo contatto;
- `description`, note e testo libero;
- `customer`: Cliente soft;
- `partyId?` oppure `customerName?` per cliente registrato o cliente soft;
- `commissionerId?` e `publisherId?`;
- `channelId?`;
- `productId?`, `lotId?`, `bundleId?`, righe e quantita;
- tag e configurazione applicata;
- `plannedAmount?`, `agreedAmount?`, `invoicedAmount?`, `receivedAmount`, `outstandingAmount`;
- valuta e metodo di pagamento quando applicabili;
- `operationalStatus` e `economicStatus` separati;
- stato di completezza, `missingFields`, `needsReview`, `nextAction`;
- `originFairId?`, `deliveryFairId?`, `accountingFairId?`;
- scadenze, incassi, allegati, audit e provenance.

La Modalita Fiera crea Operazioni tolleranti ai dati mancanti: il wizard parte dalla selezione Prodotto e richiede poi solo descrizione, importo e cliente opzionale. La fiera attiva viene associata automaticamente quando presente; il Lotto resta opzionale e viene gestito in Backoffice. Il `+` mobile apre sempre questo flusso.

I suggerimenti su Party esistenti sono assistivi e non decisionali: l'associazione a `partyId` richiede selezione esplicita, altrimenti il testo resta `customerName`.

### 3.6 Profilo Commissione

Specializzazione di Operazione con brief, risultato, revisioni, consegne e stato operativo della commissione. Non crea una seconda identita persistente. La definizione commerciale ripetibile della commissione appartiene al catalogo come Prodotto di categoria `commission`.

### 3.7 Profilo Lavoro editoriale

Specializzazione di Operazione con editore, contratto, milestone, diritti, royalties, rimborsi e consegne.

### 3.8 Preventivo

Proposta precedente all'accettazione. Attributi: richiesta, Party, canale, voci, importo, valuta, condizioni, revisioni, emissione, validita, stato e `operationId?`.

### 3.9 Progetto, Attivita e Task

- `Progetto`: contenitore di obiettivi, Operazioni, attivita e risultati.
- `Attivita`: lavoro significativo con obiettivo, periodo e risultato.
- `Task`: azione atomica con stato, responsabile, data prevista e data completata.

### 3.10 Scadenza

Obbligo temporale associato a Operazione, progetto, attivita, task, fiera, spesa o incasso. Attributi: titolo, descrizione, `dueDate?`, priorita, stato, origine, completamento, rinvii e note.

Una scadenza mancante puo essere evidenziata come dato da completare; una scadenza oltre data e ritardo solo se non completata.

### 3.11 Prodotto

Concetto centrale del catalogo e dell'offerta commerciale. Puo rappresentare oggetti fisici, originali, servizi creativi, commissioni, sketch, copertine, illustrazioni e bundle.

Attributi V1: nome, prezzo suggerito, descrizione opzionale, stato attivo/non attivo, tag come placeholder, date e metadati comuni. Attributi futuri: variante, SKU, soglia, configurazioni e specializzazioni.

Stampa A4, Stampa A5, Artbook, Fumetto, Calamita, Originale, Commissione, Sketch, Copertina, Illustrazione e Bundle sono valori di Prodotto, non categorie. Diventano profili di Operazione solo quando esiste un caso concreto con cliente, stato, consegna o pagamento. Bundle e un Prodotto, eventualmente composto da altri prodotti in una fase successiva.

### 3.12 Lotto e Movimento di magazzino

`Lotto` rappresenta un raggruppamento logico subordinato al Prodotto. Attributi V1: nome lotto, `productId`, `purchaseId?`, alias e note. Product e Lot non sono la stessa cosa: Product e cio che viene venduto, Lot e classificazione operativa utile per futuri suggerimenti.

Il Lotto V1 non contiene data creazione operativa, quantita iniziale, quantita residua, costo totale o costo unitario. Non e magazzino, giacenza o movimento inventariale.

`Movimento di magazzino` registra entrata, uscita, reso o rettifica con prodotto/lotto, quantita, data, origine, Operazione, fiera e note.

Gli alias del Lotto preparano futuri suggerimenti automatici, senza introdurre ora associazione vendita-lotto o stati di assegnazione.

### 3.12.1 Acquisto destinato alla vendita

`Acquisto` registra il costo sostenuto per ottenere prodotti destinati alla vendita. Attributi V1: `supplierId?`, data acquisto, descrizione, importo totale, note e `productId?`. La relazione con i lotti vive su `Lot.purchaseId`, per permettere a un acquisto di originare uno o piu lotti.

Nella V1 l'Acquisto non genera Movimento di magazzino, non crea Lotto automaticamente e non partecipa alle vendite. Serve a conservare rapidamente il dato storico e operativo osservabile nell'Excel `Prodotti`, anche quando quantita, costo unitario o identita prodotto non sono ancora normalizzati.

### 3.13 Categoria, Tag e pricing

`Categoria` raggruppa opzioni con nome, descrizione, selezione `single | multiple`, ordine, stato e default globale.

`Tag` appartiene a una Categoria e contiene nome, ordine, stato, modificatore di prezzo e configurazione di testo libero.

`ProductCategoryAssociation` collega prodotto e categoria con ordine, stato, default locale e valore libero suggerito. Non appartiene alla V1 del Prodotto: resta una specializzazione futura per varianti e configurazioni.

`PriceModifier` e `percentage | fixed`, valore e valuta se fisso.

### 3.14 Bundle

Prodotto virtuale composto da prodotti reali. Contiene nome, descrizione, prezzo, componenti con quantita, categorie ereditate e override.

`BundleComponent` collega bundle e prodotto. `BundleOverride` personalizza default, tag e valori liberi senza modificare i componenti.

### 3.15 Riga di Operazione

Dettaglio di prodotto o bundle con quantita, descrizione, prezzo storico, sconto, coupon, categorie/tag selezionati, testo libero e snapshot della configurazione.

### 3.16 Costo e Spesa

`FairCost` e costo associato a una Fiera con tipo `stand | travel | accommodation | other`, etichetta, importo previsto ed effettivo.

`Spesa` e costo generale collegabile a Fiera, Operazione, progetto, prodotto o attivita. La spesa e distinta dal suo pagamento.

### 3.17 Movimento economico e Pagamento

`Movimento economico` ha direzione, importo, valuta, data, causale e origine.

`Payment` e denaro effettivamente ricevuto, collegato a una Operation: importo positivo, data e Modalita di pagamento. La relazione e `Operation 1 : 0..* Payment`: una commissione puo non avere incassi, avere un acconto e un saldo, oppure un solo pagamento completo. Il totale incassato e derivato dalla somma delle righe Payment; non esiste piu un singolo metodo di pagamento o stato vendita nell'Operation.

Storni e rimborsi sono movimenti inversi collegati all'origine; non cancellano il movimento originale.

### 3.18 Allegato, Audit e Provenance

`Allegato` collega file o riferimento a un'entita. `AuditEntry` registra autore, data, azione e valori precedente/nuovo.

`AiProvenance` puo accompagnare qualunque contenuto: `manual | ai-assisted | ai-generated | calculated`, timestamp, revisione utente, modello e versione prompt quando applicabili.

### 3.19 Configurazione AI e persistenza

`AiTransparencySettings` contiene AI abilitata, consenso e autorizzazione cloud.

La persistenza infrastrutturale usa identificativi, revisioni, soft delete e sync status definiti nei documenti Offline First. Il dominio non dipende da Dexie o IndexedDB.

### 3.20 FairTask, ContactLog e Reservation pianificate

`FairTask` e un'attivita pianificata per una `FairEdition`, con titolo, descrizione, scadenza, stato e note. `ContactLog` registra comunicazioni riferite a un'edizione, con data, canale e note. `Reservation` resta un tipo di `Operazione` e non diventa un aggregate separato; puo riferire edizione, provider, costo, codice prenotazione e scadenza di cancellazione.

Queste entita non fanno parte dell'MVP implementativo corrente, ma i loro riferimenti devono usare `fairEditionId`.

## 4. Relazioni e cardinalita

| Relazione | Cardinalita | Regola |
|---|---:|---|
| Party - Ruolo | `1 : 0..*` | un Party puo avere piu ruoli |
| Party - Operazione | `0..1 : 0..*` per ruolo | cliente, committente o editore possono coincidere |
| Operazione - Cliente soft | `1 : 0..1` | Party registrato, testo libero o assente |
| Canale - Operazione | `0..1 : 0..*` | un canale origina molte operazioni |
| FairSeries - FairEdition | `1 : 0..*` | una serie ha molte edizioni |
| FairSeries - organizzatore | `0..1 : 0..1` | dati comuni riutilizzabili |
| Evento - FairEdition | `1 : 0..1` | l'edizione e l'occorrenza operativa |
| FairEdition - Operazione origine | `1 : 0..*` | dove nasce il contatto |
| FairEdition - Operazione consegna | `1 : 0..*` | dove avviene ritiro/consegna |
| FairEdition - Operazione contabilizzazione | `1 : 0..*` | attribuzione economica modificabile |
| Operazione - Preventivo | `1 : 0..*` | uno o piu preventivi possono precedere l'accettazione |
| Operazione - Riga | `1 : 0..*` | una vendita normalmente ha almeno una riga |
| Operazione - Incasso | `1 : 0..*` | acconti, rate, saldo e rimborsi |
| Operazione - Scadenza | `1 : 0..*` | consegna, verifica o pagamento |
| FairEdition - FairCost | `1 : 0..*` | costi ordinati per tipo |
| FairEdition - Spesa | `1 : 0..*` | costi direttamente associati |
| Fornitore - Acquisto | `0..1 : 0..*` | fornitore opzionale, non bloccante |
| Acquisto - Prodotto | `0..* : 0..1` | collegamento futuro quando normalizzato |
| Acquisto - Lotto | `0..1 : 0..*` | un acquisto puo originare uno o piu lotti |
| Prodotto - Lotto | `1 : 0..*` | un prodotto puo avere molti raggruppamenti logici |
| Prodotto - Movimento magazzino | `1 : 0..*` | entrate, uscite, resi e rettifiche |
| Prodotto - Categoria | `0..* : 0..*` | post-V1 tramite ProductCategoryAssociation; non presente nel Product V1 |
| Categoria - Tag | `1 : 0..*` | post-V1 per configurazioni e varianti |
| Tag - PriceModifier | `1 : 0..1` | post-V1 per pricing configurabile |
| Bundle - BundleComponent | `1 : 1..*` | bundle con almeno un componente |
| Bundle - BundleOverride | `1 : 0..*` | override per categoria o tag |
| Progetto - Operazione | `1 : 0..*` | progetto puo contenere operazioni |
| Progetto - Attivita | `1 : 0..*` | lavoro organizzato |
| Attivita - Task | `1 : 0..*` | azioni atomiche |
| Entita - Allegato | `1 : 0..*` | documenti e ricevute |
| Entita - AuditEntry | `1 : 0..*` | storico delle modifiche |
| FairEdition - FairTask | `1 : 0..*` | attivita future di preparazione |
| FairEdition - ContactLog | `1 : 0..*` | comunicazioni future |

## 5. Stati normativi

### 5.1 Stato operativo della commissione

```text
Bozza -> Richiesta -> Accettata -> In lavorazione -> Pronta -> Consegnata
```

Sono possibili `Sospesa` e `Annullata`; entrambe richiedono motivo. `Pagata` e uno stato economico, non una transizione operativa obbligatoria. Puo essere mostrato come stato derivato quando il residuo e zero.

### 5.2 Stato economico

`Preventivato`, `In attesa di approvazione`, `Concordato`, `Acconto ricevuto`, `Parzialmente pagato`, `Pagato`, `Insoluto`, `Annullato`.

### 5.3 Stati di completezza

- `complete`;
- `incomplete`;
- `needsReview`;
- `missingFields`;
- `nextAction`.

### 5.4 Stati catalogo

Categorie, tag, prodotti e bundle: `active`, `inactive`, con archiviazione tramite `archivedAt`.

### 5.5 Stati sincronizzazione

`local-only`, `pending`, `synced`, `sync-error`, `conflict`.

## 6. Regole di business

1. Una Operazione non viene duplicata quando cambia stato, consegna o completezza.
2. Un record rapido puo essere salvato con i soli dati minimi riconoscibili.
3. Cliente soft e Cliente registrato sono riferimenti distinti.
4. La conversione del cliente soft e esplicita e non perde lo storico.
5. Vendita, commissione, prenotazione e acconto restano tipi della stessa Operazione.
6. Stato operativo ed economico sono indipendenti.
7. Vendita non significa incasso; compenso concordato non significa denaro ricevuto.
8. Spesa non significa pagamento effettuato.
9. Incassi, rate, storni e rimborsi sono movimenti separati e auditabili.
10. Fiera di origine, fiera di consegna e fiera di contabilizzazione possono differire.
11. La fiera di contabilizzazione e modificabile dall'utente e guida i report gestionali, non la fiscalita.
12. Default di contabilizzazione: origine se presa e consegnata fuori fiera; consegna se presa fuori e consegnata in fiera; fiera corrente proposta se origine e consegna sono fiere diverse.
13. Una fiera e attiva con intervallo di date inclusivo.
14. Sovrapposizioni di fiere richiedono scelta esplicita dell'utente.
15. Costi non coperti: `max(0, costi considerati - ricavi attribuiti)`.
16. Profitto: `ricavi attribuiti - costi considerati`; la metrica dichiara se usa costi diretti o allocati.
17. Le vendite conservano snapshot di prezzo, tag, bundle e configurazione.
18. Resi e rettifiche non cancellano la vendita originale.
19. Categorie o tag inattivi non sono selezionabili in nuove operazioni, ma restano nello storico.
20. Pricing: prima modificatori percentuali cumulativi, poi modificatori fissi, quindi arrotondamento.
21. Nel bundle prevalgono override bundle, default prodotto applicabile, default categoria, nessun default.
22. Categorie duplicate ereditate da un bundle vengono consolidate; se una e multipla, la selezione del bundle e multipla.
23. Il bundle non modifica i prodotti componenti.
24. I dati locali devono essere salvati prima di qualunque sync futura.
25. La cancellazione applicativa e logica e non elimina la storia.
26. Valute diverse non vengono sommate senza conversione esplicita.
27. Contenuti AI e manuali devono essere distinguibili e quelli AI devono avere provenance e revisione umana.

## 7. Confini e invarianti

- Il dominio non importa Angular, Dexie, IndexedDB o provider cloud.
- Un `EntityId` resta stabile durante export/import e sincronizzazione.
- Ogni incasso deve riferire una Operazione o una causale esterna esplicita.
- Ogni accountingFair deve riferire una Fiera esistente o essere nullo.
- Una data fine non puo precedere la data inizio della Fiera.
- Un importo monetario non puo essere NaN; importi negativi richiedono semantica esplicita di storno, rimborso o sconto.
- Una categoria `single` non puo avere piu tag selezionati nella stessa riga.
- Una riga di vendita deve contenere quantita positiva; resi usano movimento compensativo.
- Le transizioni di stato non ammesse devono fallire senza mutare il record.
- L'assegnazione a una fiera contabile deve essere storicizzata.
- Un record incompleto non deve essere escluso dalle ricerche operative.

## 8. Matrice di tracciabilita

| Area | Entita principali | Output |
|---|---|---|
| Modalita Fiera | Fiera, Operazione, FairCost | dashboard evento e copertura |
| Commissioni | Operazione, Preventivo, Scadenza, Incasso | ciclo di vita persistente |
| Vendite | Operazione, Riga, Prodotto, Movimento | ricavi e magazzino |
| Clienti | Party, Cliente soft, Operazione | anagrafica opzionale |
| Catalogo | Prodotto, Categoria, Tag, Bundle | pricing e configurazione |
| Finanza | Incasso, Spesa, Movimento economico | netto e residui |
| Offline First | metadata, AuditEntry, sync status | continuita senza rete |
| AI | AiProvenance, AiTransparencySettings | trasparenza e revisione |

## 9. Decisioni successive

Restano da dettagliare in documenti tecnici separati: schema fisico Dexie, indici e migrazioni, repository, `IStorageProvider`, outbox, algoritmo di conflitto, ruoli multiutente, allegati e retention. Queste decisioni non possono modificare gli invarianti di questo Domain Model v1 senza un ADR e una nuova versione del modello.
