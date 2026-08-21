# Modello concettuale del dominio

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

Attributi: identita, tipo, nome visualizzato, recapiti, note, ruoli, date di creazione e aggiornamento. La colonna `Cliente` dell'Excel e spesso vuota e non consente sempre di ricostruire un'anagrafica completa.

### Canale

Origine di vendita, commissione, progetto, contatto o evento, ad esempio Fiera, Instagram, Sito web, Negozio, Editore, Marketplace o Passaparola. Attributi: nome, classificazione, descrizione e stato. Il canale non e il luogo dell'evento ne il metodo di pagamento; nell'Excel non e una colonna autonoma.

### Opportunity

Richiesta, contatto o possibile incarico non ancora trasformato in preventivo accettato o lavoro attivo. Attributi concettuali: origine, canale, Party, descrizione, valore stimato, prossimo passo e stato. Non e una commissione, un preventivo o un compenso.

### Tag

Etichetta trasversale applicabile a piu entita per ricerca e classificazione. Non sostituisce stato operativo, categoria economica, WorkType o Canale.

### WorkType

Classificazione della natura di un lavoro, come commissione privata, editoriale, fumetto o illustrazione. Non e lo stato del lavoro e non identifica la sua origine commerciale.

### Work

Concetto unificato futuro per gli incarichi attivi o accettati. Condivide Party, Canale, stato, scadenze, consegne e valori economici; Commissione e Lavoro editoriale possono diventare specializzazioni tramite WorkType. La direzione non modifica ancora il modello fisico.

### Evento

Occorrenza pianificata con periodo, luogo e attivita associate. Attributi: identita, nome, tipo, date, luogo, canale, stato e note.

### Fiera

Specializzazione di Evento per esposizione, promozione o vendita. Attributi osservati o derivati: nome, anno, inizio, fine, luogo, stand, canale, costo spazio, hotel, viaggio, rimborso, ricavo, stati di pagamento logistico, note e bilancio derivato.

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

Articolo o servizio vendibile di catalogo. Attributi: identita, tipo o categoria, descrizione, variante, SKU, data di acquisto o produzione, costo unitario, prezzo, soglia e stato. Nell'Excel `Tipo` puo essere solo una classificazione.

### Lotto o produzione prodotto

Raggruppamento per stampa, ristampa o acquisto usato dal foglio `Prodotti`. Attributi: prodotto o tipo, descrizione, data, quantita se nota, costo totale, costo unitario, ricavo, bilancio derivato e nota sulla qualita del dato.

### Vendita

Transazione commerciale in cui prodotti vengono ceduti a fronte di un prezzo. Attributi: identita, data o contesto temporale, fiera/evento, canale, cliente opzionale, righe, totale, stato, metodo di pagamento e note. Le righe Excel sono il livello osservabile piu vicino.

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

## Evoluzione verso Work unificato

Commissione e Lavoro editoriale condividono molti attributi e relazioni, ma il modello attuale li mantiene distinti per rispettare i workflow e l'incertezza dei dati storici. In futuro Work potra diventare l'aggregato comune, con WorkType e dettagli specifici; Opportunity restera precedente all'accettazione e non verra assorbita automaticamente.

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
| Fiera - Vendita | Fiera `1` : vendita `0..*` | relazione osservata tramite `Fiera + Anno` |
| Prodotto - Lotto | Prodotto `0..1` : lotto `0..*` | una tipologia puo avere piu produzioni |
| Prodotto - Riga vendita | Prodotto `0..1` : riga `0..*` | riferimento certo o da normalizzare |
| Vendita - Riga vendita | Vendita `1` : riga `1..*` | una vendita ha una o piu righe |
| Vendita - Incasso | Vendita `1` : incasso `0..*` | pagamento in una o piu tranche |
| Fiera - Spesa | Fiera `1` : spesa `0..*` | costi direttamente associati |
| Preventivo - incarico | Preventivo `0..1` : incarico `0..1` | un preventivo accettato puo attivare un incarico |
| Commissione/Lavoro - Incasso | incarico `1` : incasso `0..*` | acconto, rate e saldo separati |
| Progetto - Attivita | Progetto `1` : attivita `0..*` | organizzazione del lavoro |
| Attivita - Task | Attivita `1` : task `0..*` | scomposizione operativa |
| Entita operativa - Scadenza | entita `0..1` : scadenza `0..*` | lavori, task, eventi e pagamenti hanno obblighi |
| Entita - Allegato | Entita `1` : allegato `0..*` | documenti, ricevute e consegne |

## Aggregati

Gli aggregati sono confini concettuali di consistenza, non tabelle o moduli tecnici.

### Fiera

Radice Fiera; comprende partecipazione, costi logistici, prodotti pianificati, vendite associate e consuntivo. Il bilancio e calcolato dai componenti economici.

### Catalogo e disponibilita

Radice Prodotto; comprende varianti, lotti e movimenti di magazzino. Le vendite conservano il prezzo storico del momento della cessione.

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