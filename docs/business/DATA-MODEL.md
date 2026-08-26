# Modello concettuale del dominio

> **Decisione prevalente:** per il modello aggiornato di Operazione, commissioni, clienti soft e riferimenti fieristici consultare [OPERATIONS-DOMAIN-SPECIFICATION.md](OPERATIONS-DOMAIN-SPECIFICATION.md). In caso di conflitto, quella specifica prevale.

> **Domain Model v1:** entita, cardinalita, stati e regole consolidate sono raccolti in [DOMAIN-MODEL-V1.md](DOMAIN-MODEL-V1.md), che prevale sulle sezioni storiche di questo documento.

> **Migrazione storico:** l'importazione del workbook personale e una capability Post-MVP/MVP+1 amministrativa, descritta in [HISTORICAL-DATA-MIGRATION.md](HISTORICAL-DATA-MIGRATION.md). Il file Excel resta fonte storica durante la validazione iniziale.

> **Confini Work/Sale:** i criteri pratici per distinguere lavoro creativo, vendita e casi ibridi sono in [WORK-SALES-BOUNDARIES.md](WORK-SALES-BOUNDARIES.md).

> **Lifecycle operativi:** stati e transizioni ufficiali di Work, Sale, Operation, Preventivo, Scadenza, Evento/Fiera e stato economico sono in [OPERATION-LIFECYCLE.md](OPERATION-LIFECYCLE.md).

## Scopo e fonte

Questo documento descrive esclusivamente il modello concettuale del dominio. Non definisce tabelle, database, schema Dexie, API o codice applicativo.

La fonte primaria e `docs/legacy/archivio.xlsx`, integrata con `TERMINOLOGY.md`, `WORKFLOWS.md` e `REPORTING-REQUIREMENTS.md`.

| Foglio | Evidenza | Interpretazione |
|---|---|---|
| `Fiere` | 40 righe, 13 colonne | fiere, periodo, costi, ricavi e stati di pagamento |
| `Prodotti` | 18 righe, 8 colonne | tipologie o lotti di prodotto, costi, quantita e ricavi |
| `Vendite` | 320 righe, 9 colonne | righe di vendita con contesto fieristico, cliente e ricavo |

Le righe `Totale` sono aggregati del foglio e non entita. `Varie` e un valore operativo per contesti non specificati. Celle vuote e valori come `N.A.` sono dati mancanti o non applicabili, non valori pari a zero.

## Evidenze dell'Excel

### Fiere

Il foglio contiene `Fiera`, `Anno`, `Inizio`, `Fine`, `Costo`, `Rimborso`, `Hotel`, `Viaggio`, `Ricavo`, `Bilancio`, `Spazio pagato`, `Viaggio pagato` e `Hotel pagato`. La coppia `Fiera + Anno` identifica apparentemente le registrazioni, ma il modello concettuale non la assume come identita definitiva. `Bilancio` e derivato da ricavi e costi.

### Prodotti

Il foglio contiene `Tipo`, `Data acquisto`, `Descrizione`, `Spesa`, `Quantita`, `Costo unitario`, `Ricavo` e `Bilancio`. `Tipo` puo indicare categoria, prodotto, formato o lotto; le quantita sono spesso vuote. Il foglio rappresenta soprattutto consuntivi aggregati, non sempre singoli articoli vendibili.

### Vendite

Il foglio contiene `Fiera`, `Anno`, `Giorno`, `Tipo`, `Descrizione`, `Cliente`, `Nr`, `Ricavo` e `Coupon/Bancomat`. Ogni riga e la rappresentazione piu vicina a una riga di vendita. `Giorno` e relativo alla fiera, non una data assoluta. La relazione verso Fiere e implicita in `Fiera + Anno`; quella verso Prodotti e debole e passa da `Tipo` e `Descrizione`.

## Entita e attributi

### Party

Soggetto generale con cui l'artista ha una relazione. Puo essere Persona o Organizzazione e puo ricoprire piu ruoli: Cliente, Committente, Editore, Fornitore o Collaboratore.

Attributi: identita, tipo, nome visualizzato, recapiti, note, ruoli, categoria fornitore quando il ruolo e `Fornitore`, date di creazione e aggiornamento. La colonna `Cliente` dell'Excel e spesso vuota e non consente sempre di ricostruire un'anagrafica completa.

La vista Clienti mostra Party senza ruoli legacy oppure con ruolo `Cliente` o `Committente`. La vista Fornitori mostra solo Party con ruolo `Fornitore`, evitando contaminazioni operative tra chi compra e chi vende all'artista. Questa separazione e necessaria per restare aderenti all'Excel storico e ai workflow reali: in fiera l'inserimento di una vendita deve trovare rapidamente clienti o nomi liberi, mentre l'acquisto di materiali, stampe o servizi deve cercare fornitori senza affollare la lista clienti.

Categorie iniziali dei fornitori: tipografia, editore, fornitore materiale, marketplace e altro fornitore. La categoria non sostituisce il ruolo `Fornitore` e non introduce relazioni complesse; serve solo a rendere piu rapida la ricerca e a preparare il collegamento futuro agli Acquisti.

### Canale

Origine di vendita, commissione, progetto, contatto o evento, ad esempio Fiera, Instagram, Sito web, Negozio, Editore, Marketplace o Passaparola. Attributi: nome, classificazione, descrizione e stato. Il canale non e il luogo dell'evento ne il metodo di pagamento; nell'Excel non e una colonna autonoma.

### Opportunity

Richiesta, contatto o possibile incarico non ancora trasformato in preventivo accettato o lavoro attivo. Attributi concettuali: origine, canale, Party, descrizione, valore stimato, prossimo passo e stato. Non e una commissione, un preventivo o un compenso.

### Tag

Etichetta trasversale applicabile a piu entita per ricerca e classificazione. Non sostituisce stato operativo, categoria economica, WorkType o Canale.

### WorkType

Classificazione della natura operativa di un lavoro, come commissione privata, editoriale o altro profilo creativo. Non e lo stato del lavoro e non identifica la sua origine commerciale. Quando il lavoro viene venduto o proposto come offerta ripetibile, il relativo formato deve essere anche un Prodotto di catalogo, ad esempio Commissione, Sketch, Copertina o Illustrazione.

### Work

Concetto descrittivo per la componente di lavoro di un'Operazione. Non e un aggregate root separato: commissione e lavoro editoriale sono profili o WorkType dell'Operazione e condividono stato, scadenze, consegne e valori economici.

### Evento

Occorrenza pianificata con periodo, luogo e attivita associate. Attributi: identita, nome, tipo, date, luogo, canale, stato e note.

### Fiera

Specializzazione di Evento per esposizione, promozione o vendita. Attributi osservati o derivati: nome, anno, inizio, fine, luogo, stand, canale, costo spazio, hotel, viaggio, rimborso, ricavo, stati di pagamento logistico, note e bilancio derivato.

### Pianificazione fiera

La fiera non e solo un consuntivo dei giorni di manifestazione. Una `FairEdition` attraversa un ciclo di vita lungo: pianificazione, prenotazioni, preparazione, partecipazione e consuntivo. Le informazioni economiche e logistiche possono essere registrate molti mesi prima dell'evento e servono a decidere se partecipare realmente.

Attributi concettuali della pianificazione: stato operativo, stato economico previsto, costi previsti, costi confermati, costi pagati, costi effettivi finali, rimborsi/gettoni previsti e ricevuti, scadenze collegate, note organizzative e decisione finale di partecipazione.

### Campi economici V1 della FairEdition

Per coerenza con il foglio storico `Fiere`, la V1 puo mantenere direttamente su `FairEdition` alcuni campi economici aggregati:

- budget previsto;
- costo stand;
- rimborso/gettone;
- costo hotel;
- costo viaggio;
- altri costi;
- stand pagato;
- viaggio pagato;
- hotel pagato.

Questi campi sono temporanei e pragmatici: permettono di rappresentare subito i dati esistenti nell'Excel e di supportare la decisione di partecipazione. In una fase successiva devono evolvere verso `FairCost`, `Booking`, `Incasso` e `Spesa` collegati all'evento, mantenendo migrazione e compatibilita storica.

### Booking

Prenotazione collegata a una `FairEdition`. Rappresenta un impegno logistico o organizzativo e non deve essere ridotta a una semplice spesa, perche contiene scadenze, condizioni e riferimenti operativi.

Booking e il termine concettuale preferito per coprire hotel, alloggio, treno, aereo, parcheggio o altre prenotazioni. Specializzazioni future come `AccommodationBooking` o `TravelBooking` possono essere introdotte solo se il comportamento diverge davvero.

Attributi: identita, `fairEditionId`, tipo (`hotel`, `alloggio`, `treno`, `aereo`, `parcheggio`, `altro`), provider, costo previsto, costo confermato, costo pagato, costo effettivo finale, riferimento prenotazione, scadenza cancellazione gratuita, scadenza saldo, stato, note e allegati.

### FairCost

Voce economica prevista o sostenuta per una `FairEdition`. Copre stand, viaggio, hotel/alloggio, parcheggi, vitto e altre spese.

Ogni costo deve distinguere:

- costo previsto: stima iniziale usata per decidere se partecipare;
- costo confermato: importo comunicato o prenotato;
- costo pagato: importo effettivamente pagato;
- costo effettivo finale: importo finale dopo variazioni, cancellazioni o rimborsi.

Il costo non coincide necessariamente con il pagamento. Un booking puo generare o collegare una o piu voci FairCost.

### Rimborso e gettone fiera

Entrata prevista o ricevuta collegata a una `FairEdition`. Il rimborso puo coprire viaggio, alloggio o altri costi; il gettone presenza e un compenso per la partecipazione.

Attributi: tipo (`rimborso`, `gettone`), importo previsto, importo ricevuto, data prevista, data incasso, stato, note e riferimento all'organizzatore. Rimborsi e gettoni contribuiscono al risultato economico finale dell'evento.

### Stato operativo ed economico della fiera

Stato operativo suggerito per una `FairEdition`: `Idea`, `Valutazione`, `Confermata`, `Prenotata`, `In preparazione`, `In corso`, `Conclusa`, `Annullata`.

Stato economico suggerito: `Budget positivo`, `Budget neutro`, `Budget negativo`, `In attesa di dati`. Lo stato economico e derivato da costi e rimborsi/gettoni previsti o effettivi, non sostituisce i movimenti economici.

### Progetto

Contenitore organizzativo di obiettivi, lavori, attivita e risultati. Attributi: titolo, descrizione, obiettivo, stato, periodo, canale, Party collegati, note e allegati.

### Attivita

Unita di lavoro significativa con obiettivo e risultato atteso, appartenente a un progetto o lavoro. Attributi: titolo, descrizione, stato, appartenenza, responsabile, periodo, scadenza, risultato e note.

### Task

Azione operativa atomica e verificabile necessaria a un'attivita. Attributi: azione, stato, attivita, assegnatario, date prevista e completata, note.

### Commissione

Incarico per produrre un risultato specifico, preceduto normalmente da richiesta e preventivo. Attributi: titolo, brief, risultato, cliente, committente, canale, progetto opzionale, stato operativo, compenso concordato, importo fatturabile, importo incassato, residuo, stato economico, revisioni, consegne, scadenze e allegati.

### Lavoro editoriale

Incarico professionale con editore o committente, contratto, milestone e consegne. Attributi: titolo, Party, canale, riferimento contrattuale, compenso, importo fatturabile, incassato e residuo, stato operativo ed economico, diritti, royalties, rimborsi, milestone, revisioni, consegne, scadenze e allegati.

### Fumetto

Opera narrativa organizzata in serie, volume, episodio e tavole. Attributi: titolo, gerarchia narrativa, formato, fasi, tavole, avanzamento derivato, stato, scadenze, note, allegati e collegamenti a progetto o editore.

### Prodotto

Concetto centrale del catalogo: articolo, servizio, offerta creativa o composizione vendibile. Sono Prodotti sia oggetti fisici sia offerte creative: Stampa A4, Stampa A5, Artbook, Fumetto, Calamita, Originale, Commissione, Sketch, Copertina, Illustrazione e Bundle.

Attributi V1: identita, nome, prezzo suggerito, descrizione opzionale, stato attivo/non attivo, tag come placeholder, date di creazione e aggiornamento. Attributi futuri: variante, SKU, soglia, specializzazioni e configurazioni di categoria/tag.

Nel foglio Excel storico `Tipo` puo indicare direttamente il prodotto venduto o acquistato, non una categoria stabile. Per la V1 le voci come Stampa A4, Stampa A5, Sketch, Commissione, Originale, Artbook, Fumetto, Calamita, Copertina, Illustrazione e Bundle devono quindi essere create come Prodotti distinti, non selezionate da una tendina Categoria.

Commissione e Sketch non sono anagrafiche operative separate dal catalogo: sono Prodotti. Una Operation puo usare un Prodotto chiamato Commissione o Sketch e aggiungere workflow, cliente, stato e pagamenti, ma il catalogo resta la fonte della definizione commerciale ripetibile.

### Lotto

Raggruppamento logico subordinato a un Prodotto, derivato da produzione, stampa, ristampa o acquisto. Product e Lot non coincidono: l'utente vende il Prodotto `Stampa A5`, mentre l'app puo distinguere lotti come `Stampe casalinghe`, `Acquisto tipografia marzo 2026` o `Acquisto tipografia settembre 2026`.

Attributi V1: identita, nome lotto, prodotto associato, acquisto origine opzionale, alias e note.

Il Lotto V1 non e gestione di magazzino: non contiene data creazione operativa, quantita iniziale, quantita residua, costo totale o costo unitario. Questi dati potranno appartenere a una futura gestione inventariale, ma non derivano dal workflow reale attuale.

I codici storici dell'Excel come `A5`, `A5+` e `A5-` devono essere interpretati come possibili lotti o varianti operative dello stesso Prodotto `Stampa A5`, non come prodotti finali da vendere al cliente con nomi diversi. La normalizzazione deve preservare il nome vendibile rapido e spostare il raggruppamento operativo nel Lotto.

Gli alias del Lotto sono termini testuali utili al riconoscimento futuro. Nella V1 non esiste un secondo elenco testuale separato dagli alias.

### Acquisto destinato alla vendita

Record minimale di acquisto di prodotti o materiali destinati alla vendita, ad esempio 100 fumetti, 200 calamite o 50 stampe A5. Attributi V1: fornitore opzionale, data acquisto, descrizione, importo totale, note, riferimenti futuri opzionali a Prodotto e Lotto.

L'Acquisto rappresenta il fatto osservabile nel foglio storico `Prodotti`: una spesa sostenuta o consuntivata per ottenere prodotti vendibili. Non crea ancora Movimento di magazzino, non calcola ammortamento e non modifica vendite o disponibilita. Questa scelta mantiene rapido il workflow reale durante fiere e preparazione eventi: l'artista puo registrare subito il costo storico senza essere obbligato a normalizzare prodotto, quantita o lotto quando l'informazione non e certa.

### Vendita

Transazione commerciale in cui prodotti vengono ceduti a fronte di un prezzo. Nella V1 viene registrata come Operazione, con Prodotto, descrizione, importo, cliente opzionale, fiera/evento, lotto opzionale per backoffice e note. Le righe Excel sono il livello osservabile piu vicino, ma durante una fiera il salvataggio rapido prevale sulla completezza.

La Modalita Fiera apre prima un unico elenco di Prodotti ordinato per uso recente nelle ultime 10 fiere concluse, poi un form rapido gia precompilato. Puo salvare una Operazione con solo Prodotto, descrizione, importo e cliente opzionale. Se una fiera corrente e attiva viene collegata automaticamente. Il Lotto non e richiesto al salvataggio rapido.

Il cliente digitato in fiera puo restare Cliente soft. Eventuali Party esistenti vengono solo suggeriti: l'associazione a un Party richiede scelta esplicita dell'utente.

La Modalita Fiera apre prima un unico elenco di Prodotti ordinato per uso recente nelle ultime 10 fiere concluse, poi un form rapido gia precompilato. Il pulsante `+` mobile apre sempre il wizard Fiera. Se una fiera corrente e attiva, l'Operazione viene associata automaticamente; il Lotto resta opzionale.

### Riga di vendita

Dettaglio di una vendita per prodotto, tipo o descrizione. Attributi: riferimento prodotto, descrizione, quantita (`Nr`), prezzo o ricavo, sconto/coupon e note.

### Movimento di magazzino

Entrata, uscita, reso o rettifica che modifica la disponibilita. Non esiste come foglio autonomo ma e implicato da vendite, acquisti e produzioni. Attributi: prodotto/lotto, tipo, quantita, data, origine, evento e note.

### Movimento economico

Registrazione di un fatto finanziario con direzione, importo, valuta, data, causale e origine. Comprende entrate e uscite, ma non coincide automaticamente con incasso o pagamento.

### Entrata

Movimento economico di direzione positiva per l'artista, previsto o effettivo, come ricavo di vendita, compenso o rimborso.

### Uscita

Movimento economico di direzione negativa, previsto o effettivo, come costo di fiera, acquisto, spesa o commissione bancaria.

### Incasso

Ricezione effettiva di denaro collegata a vendita, compenso, acconto, saldo o rimborso. Attributi: importo, valuta, data, metodo, origine, causale, tipo di rata, stato e riferimento esterno.

### Spesa

Costo previsto o sostenuto, collegabile a evento, progetto, lavoro, prodotto o attivita. Attributi: descrizione, categoria, importo, valuta, data di competenza, fornitore, contesto, documento, allegato, stato e scadenza di pagamento.

### Preventivo

Proposta economica precedente all'attivazione di una commissione o di un lavoro editoriale. Attributi: richiesta, cliente, committente, canale, voci, importo, valuta, condizioni, revisioni, emissione, validita, stato e incarico generato se accettato.

### Scadenza

Data limite per obbligo, consegna, pagamento o attivita. Attributi: titolo, descrizione, data limite, priorita, stato, origine, completamento, rinvii, note e allegati.

## Evoluzione dei profili di Operazione

Commissione e Lavoro editoriale condividono attributi e relazioni perche sono profili della stessa Operazione. WorkType e i dettagli specifici estendono il profilo senza creare un record parallelo; Opportunity resta precedente all'accettazione e puo essere convertita nella stessa Operazione quando il dominio lo richiede.

## Relazioni e cardinalita

Le cardinalita indicano il modello concettuale previsto. Dove l'Excel non contiene dati sufficienti la relazione e opzionale o da confermare.

| Relazione | Cardinalita | Significato |
|---|---:|---|
| Party - Ruolo | Party `1` : ruolo `0..*` | un soggetto puo avere piu ruoli |
| Party - Commissione | Party `0..1` : commissione `0..*` per ruolo | cliente e committente possono coincidere o essere distinti |
| Party - Progetto | Party `0..*` : progetto `0..*` | un progetto puo coinvolgere piu soggetti |
| Canale - Vendita/Commissione/Progetto/Evento | Canale `0..1` : entita `0..*` | un'origine puo generare molti elementi |
| Canale - Party | Canale `0..1` : Party `0..*` | origine del contatto o cliente |
| Evento - Fiera | Evento `1` : Fiera `0..1` | ogni fiera e un evento specializzato |
| Fiera - Operazione | Fiera `1` : operazione `0..*` per ruolo fieristico | relazione osservata tramite `Fiera + Anno` e distinta per origine, consegna e contabilizzazione |
| Prodotto - Lotto | Prodotto `1` : lotto `0..*` | un prodotto vendibile puo avere piu raggruppamenti logici |
| Fornitore - Acquisto | Party con ruolo Fornitore `0..1` : acquisto `0..*` | il fornitore puo essere indicato quando noto, senza bloccare la registrazione rapida |
| Acquisto - Prodotto | Acquisto `0..*` : prodotto `0..1` | collegamento quando l'identita del prodotto e certa |
| Acquisto - Lotto | Acquisto `0..1` : lotto `0..*` | un acquisto puo originare uno o piu lotti normalizzati |
| Prodotto - Riga vendita | Prodotto `0..1` : riga `0..*` | riferimento certo o da normalizzare |
| Vendita - Riga vendita | Vendita `1` : riga `1..*` | una vendita ha una o piu righe |
| Operazione - Incasso | Operazione `1` : incasso `0..*` | vendita, acconto, rata, saldo o rimborso |
| FairEdition - Booking | FairEdition `1` : booking `0..*` | hotel, viaggio e altre prenotazioni operative |
| FairEdition - FairCost | FairEdition `1` : costo `0..*` | costi previsti, confermati, pagati o finali |
| FairEdition - Rimborso/Gettone | FairEdition `1` : entrata prevista/ricevuta `0..*` | contributi che incidono sul risultato dell'evento |
| Fiera - Spesa | Fiera `1` : spesa `0..*` | costi direttamente associati |
| Preventivo - incarico | Preventivo `0..1` : incarico `0..1` | un preventivo accettato puo attivare un incarico |
| Commissione/Lavoro - Incasso | incarico `1` : incasso `0..*` | acconto, rate e saldo separati |
| Progetto - Attivita | Progetto `1` : attivita `0..*` | organizzazione del lavoro |
| Attivita - Task | Attivita `1` : task `0..*` | scomposizione operativa |
| Entita operativa - Scadenza | entita `0..1` : scadenza `0..*` | lavori, task, eventi e pagamenti hanno obblighi |
| Entita - Allegato | Entita `1` : allegato `0..*` | documenti, ricevute e consegne |
| Categoria - Tag | Categoria `1` : tag `1..*` | relazione futura per configurazioni post-V1 |
| Prodotto - Categoria | Prodotto `0..*` : categoria `0..*` | relazione futura; nella V1 il prodotto non ha categoria |
| Tag - PriceModifier | Tag `1` : modificatore `0..1` | relazione futura per pricing configurabile |
| Categoria - ProductCategoryAssociation | Categoria `1` : associazione `0..*` | relazione futura per legami espliciti con prodotti |
| Prodotto - ProductCategoryAssociation | Prodotto `1` : associazione `0..*` | relazione futura; non parte del Product V1 |
| Bundle - Prodotto | Bundle `1` : prodotto `1..*` | un bundle contiene almeno un prodotto (con quantita) |
| Bundle - Categoria | Bundle `0..*` : categoria `0..*` | ereditate dai prodotti componenti |
| Bundle - BundleOverride | Bundle `1` : override `0..*` | personalizzazioni di bundle rispetto ai prodotti |
| Bundle - Vendita | Bundle `0..1` : vendita riga `0..*` | un bundle venduto registra i prodotti componenti |
| Riga di vendita - Categoria/Tag | Riga `0..*` : categoria/tag `0..*` | configurazione scelta al momento della vendita |

## Aggregati

Gli aggregati sono confini concettuali di consistenza, non tabelle o moduli tecnici.

### Fiera

Radice Fiera; comprende partecipazione, costi logistici, prodotti pianificati, vendite associate e consuntivo. Il bilancio e calcolato dai componenti economici.

### Catalogo e disponibilita

Radice Prodotto; comprende varianti, lotti e movimenti di magazzino. Le vendite conservano il prezzo storico del momento della cessione.

`Lotto` e il confine che consente di distinguere raggruppamenti operativi senza cambiare il Prodotto venduto. `Acquisto` puo originare un Lotto, ma nella V1 non genera movimenti di magazzino, giacenze, costi lotto o report.

La futura associazione vendita-lotto non fa parte di questa implementazione. Le vendite dovranno poter salvare rapidamente il Prodotto senza scelta obbligatoria del Lotto; in seguito potranno suggerire o verificare un Lotto usando gli alias, ma nessuno stato di assegnazione viene introdotto nella V1.

### Vendita

Radice Vendita; comprende righe, stato commerciale e riferimenti a incassi. Resi e rettifiche sono movimenti tracciati, non cancellazioni.

### Lavoro

Radice Commissione o Lavoro editoriale; comprende richiesta, preventivo accettato, fasi, consegne, scadenze e valori economici. Un preventivo non accettato resta un'opportunita distinta.

### Progetto

Radice Progetto; comprende attivita, task, Party, canale, scadenze e risultati, senza assorbire pagamenti o vendite dei lavori collegati.

### Party

Radice Party; comprende identita, tipo, recapiti e ruoli. Le relazioni con lavori, vendite ed eventi restano contestuali.

### Movimento economico

Radice del fatto finanziario; comprende importo, direzione, valuta, date, causale e riconciliazione. Incasso e spesa aggiungono il significato operativo.

### Fumetto

Radice Fumetto, serie o volume; comprende episodi, tavole, fasi, task, scadenze e allegati. L'avanzamento e derivato dalle unita completate.

### Configurazione Categorie

Radice Categoria; comprende tag, modificatori di prezzo, defaults e validazioni. Le categorie vengono applicate ai prodotti attraverso associazioni esplicite. Un cambio di categoria non riscrive la storia delle vendite; ogni riga di vendita mantiene la fotografia della categoria e tag scelti al momento.

### Bundle

Radice Bundle; comprende composizione di prodotti, categorie ereditate, override personalizzati, prezzo opzionale e stato. Ogni vendita di bundle registra la configurazione scelta e incrementa i contatori dei prodotti componenti secondo le regole di contabilizzazione.

## Gerarchie di risoluzione

### Categoria predefinita vs override prodotto

Quando un utente configura un prodotto, la gerarchia di risoluzione per il valore predefinito di una categoria e:

1. Override del prodotto per quella categoria (se definito)
2. Default della categoria (se definito)
3. Nessun default (l'utente deve scegliere)

### Bundle predefinito vs componenti

Quando un utente configura un bundle, la gerarchia di risoluzione e:

1. Override esplicito del bundle per quella categoria (se definito)
2. Default del prodotto per quella categoria (se il bundle include un solo prodotto con quel default)
3. Default della categoria (se non contraddetto dai prodotti)
4. Nessun default

Se il bundle contiene piu prodotti con override diversi della stessa categoria, il bundle deve consolidare a un unico default (eventualmente "Nessun default").

### Calcolo prezzo

Il prezzo finale di una riga di vendita e calcolato come:

1. Prezzo base del prodotto (o bundle, se applicabile)
2. Applicazione di modificatori percentuali in ordine (cumulativi)
3. Applicazione di modificatori a valore fisso in ordine (additivi)
4. Arrotondamento alla minima unita della valuta

Esempio:
- Base: €100
- Tag "A3" (+50%): €150
- Tag "Copertina rigida" (+€10): €160
- Tag "Sconto Fedeltà" (-10%): €144

La priorita di applicazione deve essere documentata chiaramente nel file CONFIGURATION-ARCHITECTURE.md.

### Categoria

Raggruppamento configurabile di opzioni e varianti di prodotto. Una categoria rappresenta un aspetto mutabile di un prodotto, come Formato, Tecnica, Colore o Confezione.

Attributi: identita, nome, descrizione opzionale, flag "consenti selezione multipla", ordinamento, stato attivo/inattivo, valore predefinito opzionale e data di creazione/aggiornamento.

Una categoria puo prevedere un tag predefinito, applicato automaticamente a meno che l'utente non lo sovrascriva. Ogni categoria appartiene a un contesto configurativo condiviso tra tutti i prodotti.

Nota architetturale: le categorie devono poter essere versionate o archiviate; un cambio di categoria non deve perdere i dati storici di vendita che la referenziavano.

### Tag

Opzione configurabile appartenente a una categoria. Un tag rappresenta un valore concreto scelto dall'utente, come "A4", "Acquerello" o "Copertina rigida".

Attributi: identita, nome, descrizione opzionale, stato attivo/inattivo, ordinamento, categoria di appartenenza, configurazione di prezzo (tipo e valore), flag "consenti campo libero", etichetta del campo libero, placeholder, note.

Un tag puo influenzare il prezzo finale del prodotto attraverso modificatori percentuali o a valore fisso. I modificatori sono applicati secondo una formula esplicita definita nella configurazione del progetto.

Un tag puo consentire un campo di testo libero inserito dall'utente in fase di vendita o configurazione, con etichetta e placeholder personalizzabili.

### Modificatore di prezzo

Configurazione che definisce come un tag influenza il prezzo finale di un prodotto.

Attributi: tipo (percentuale o valore fisso), valore numerico, valuta (se applicabile al valore fisso), descrizione.

Esempi:
- Tag "A3", tipo: percentuale, valore: +50
- Tag "Copertina rigida", tipo: valore fisso, valore: 10 (euro)
- Tag "A5", tipo: percentuale, valore: -25

La formula di calcolo: prezzo finale = (prezzo base * (1 + sum(modificatori percentuali))) + sum(modificatori a valore fisso)

### Associazione Categoria-Prodotto

Legame esplicito tra una categoria e un prodotto che la utilizza. Rappresenta la scelta configurativa di quali categorie siano rilevanti per un determinato prodotto.

Attributi: prodotto, categoria, ordinamento, valore predefinito opzionale (override del default della categoria), stato attivo/inattivo.

Esempio: il prodotto "Sketch" utilizza le categorie "Formato" e "Tecnica", ma non "Personaggi" o "Confezione".

### Valore libero per categoria e prodotto

Configurazione opzionale di un campo di testo libero a livello di categoria o prodotto.

Attributi: categoria o prodotto, etichetta, placeholder, validazioni future opzionali, valore suggerito opzionale.

Quando associato a una categoria, il campo libero consente all'utente di inserire un valore personalizzato (ad esempio "17x24 cm" per il tag "Altro" della categoria "Formato").

Quando associato a un prodotto, il campo libero puo avere un valore suggerito che riduce la necessità di input ripetitivo.

### Bundle

Prodotto virtuale composto da molteplici prodotti reali. Un bundle rappresenta un'offerta commerciale unica ma eterogenea, venduta come singola unita.

Attributi: identita, nome, descrizione, prezzo bundle opzionale, elenco prodotti inclusi (con quantita), categorie ereditate, override di categoria opzionali, stato attivo/inattivo, data di creazione/aggiornamento.

Esempio: un bundle "Fumetto + Sketch" contiene un'istanza di "Fumetto" e un'istanza di "Sketch".

Un bundle eredita automaticamente tutte le categorie utilizzate dai prodotti che lo compongono. Categorie duplicate sono consolidate a una sola istanza per il bundle.

Un bundle puo definire override personalizzati:
- default tag differente dai prodotti originali (ad esempio, un bundle potrebbe avere "Formato" = "Altro" con valore libero precompilato come "17x24 cm");
- configurazione specifica non presente nei prodotti componenti;
- vincoli o restrizioni aggiuntivi.

### Contabilizzazione Bundle

Un bundle contribuisce alle statistiche e alle vendite dei prodotti che lo compongono, nonostante sia venduto come singola unita commerciale.

Attributi della registrazione: bundle venduto, data, quantita bundle, attributi di configurazione (categorie, tag, valori liberi), cliente, ricavo totale, metodo di pagamento.

Conseguenza: ogni prodotto incluso nel bundle incrementa i propri contatori di vendita, quantita totale venduta e contributo al fatturato, proporzionato o distribuito secondo le regole di contabilizzazione definite.

La logica di ripartizione economica (ad esempio, come dividere il ricavo del bundle tra i prodotti) e oggetto di decisione futura, ma l'architettura deve predisporla.

## Value object

I value object descrivono valori senza identita propria.

- **Money:** importo intero nella minima unita e codice valuta; somme e confronti richiedono valuta compatibile.
- **MoneyBreakdown:** imponibile, imposte, commissioni, rimborsi e altre componenti di un valore.
- **DateRange:** intervallo con inizio e fine per eventi, lavori e report.
- **CalendarDate:** data senza orario per acquisto, scadenza e giorno di fiera.
- **RelativeEventDay:** numero del giorno relativo alla fiera, corrispondente a `Giorno`; non e una data assoluta.
- **PaymentMethod:** metodo normalizzato; codici come `C` sono conservati come valore originale finche non confermati.
- **ChannelReference:** riferimento a Canale con eventuale valore originale importato.
- **EconomicStatus:** Preventivato, In attesa di approvazione, Concordato, Acconto ricevuto, Parzialmente pagato, Pagato, Insoluto, Annullato.
- **Quantity:** quantita e unita di misura; vuoto significa non rilevato o non applicabile, non zero.
- **ReferenceCode:** SKU, numero contratto o codice esterno distinto dal nome e dall'identita interna.
- **DataQualityStatus:** noto, mancante, non applicabile, stimato o non classificato.
- **PriceModifier:** tipo (Percentuale | ValoreOValore), valore numerico, valuta opzionale per ValoreFixo, descrizione opzionale.
- **CategorySelectionMode:** futura configurazione post-V1: Singola (uno solo) o Multipla (zero o piu).
- **CategoryDefault:** futura configurazione post-V1: categoria, tag predefinito opzionale, ordinamento, stato.
- **ProductCategoryOverride:** futura configurazione post-V1: prodotto, categoria, tag predefinito opzionale, ordinamento, valore libero suggerito.
- **BundleOverride:** futura configurazione post-V1: bundle, categoria, tag predefinito opzionale, valore libero precompilato.

## Regole di interpretazione e questioni aperte

- `Totale` e escluso dalle entita; `Bilancio` e derivato.
- `Fiera + Anno` e una relazione osservata, non una decisione sull'identita.
- `Tipo` e `Descrizione` richiedono normalizzazione prima di collegare con certezza Prodotti e Vendite.
- `Cliente` vuoto indica soggetto non registrato, non necessariamente un cliente riutilizzabile.
- `Giorno` deve essere ricostruito usando il periodo della fiera prima di diventare una data.
- `Coupon/Bancomat` contiene codici senza legenda; il significato va confermato.
- Il significato preciso di `Rimborso`, degli stati `Si/No` e dei costi aggregati deve essere verificato.
- Va chiarito se ogni riga Vendite e una transazione completa o una riga di transazione.
- Va chiarito quali righe Prodotti rappresentano disponibilita attuale e quali solo consuntivi storici.

Queste ambiguita non impediscono il modello concettuale, ma devono essere risolte prima del modello fisico o di un'importazione automatica.