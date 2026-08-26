# Requisiti di reporting

> **Decisione prevalente:** i report devono usare Operazione come dimensione primaria e distinguere origine, consegna e contabilizzazione fieristica. La specifica normativa e [OPERATIONS-DOMAIN-SPECIFICATION.md](OPERATIONS-DOMAIN-SPECIFICATION.md).

## Obiettivo

Il reporting deve rispondere a domande operative e strategiche sull'attivita artistica, usando dati ricostruibili dai workflow. Ogni risultato deve indicare periodo, valuta, filtri applicati e definizione della metrica.

I report devono distinguere:

- dati effettivi da dati previsti;
- compenso concordato da importo fatturabile;
- importo incassato da residuo da ricevere;
- data dell'operazione, data di competenza e data del pagamento;
- vendite da entrate e spese da uscite.

I risultati devono consentire il passaggio dal totale all'elenco dei record che lo compongono.

## Dashboard

La Dashboard usa come periodo predefinito l'anno corrente e permette di selezionare un intervallo personalizzato o confrontarlo con un periodo precedente.

Deve rispondere almeno a queste domande:

- Quanto ho guadagnato quest'anno in entrate effettivamente incassate?
- Quanto ho speso quest'anno?
- Qual e il risultato netto, cioe entrate meno uscite secondo il criterio temporale scelto?
- Quali scadenze sono imminenti o gia scadute?
- Quali lavori sono in ritardo?
- Quali sono i clienti principali per entrate, lavori o compensi concordati?
- Quali eventi e fiere sono stati piu redditizi?
- Quali prodotti sono stati piu venduti per quantita e fatturato?
- Quali compensi devono ancora essere incassati?
- Quali acconti devono ancora essere ricevuti?
- Quali canali hanno generato piu clienti, lavori o fatturato?

Gli indicatori devono mostrare anche il confronto con il periodo precedente, quando esistono dati comparabili, e collegare ogni valore ai record di origine.

## Clienti

Il reporting clienti deve distinguere cliente, committente e altri ruoli dello stesso Party, evitando di contare due volte lo stesso soggetto.

Deve rispondere almeno a queste domande:

- Chi sono i migliori clienti per entrate incassate?
- Quali clienti generano piu entrate nel periodo selezionato?
- Quali clienti hanno lavori aperti?
- Quali clienti hanno piu compensi concordati ancora da incassare?
- Quali clienti hanno effettuato piu acquisti?
- Quale canale ha portato ciascun cliente?
- Quali clienti sono inattivi da piu tempo?
- Qual e il valore medio di una commissione per cliente?
- Quali clienti hanno pagamenti in ritardo o scadenze associate?

Filtri minimi: periodo, ruolo, canale, stato del lavoro, stato economico e intervallo di valore.

## Fornitori

Il reporting fornitori non e richiesto nella V1 dell'anagrafica Fornitori. La modellazione deve pero permettere report futuri senza duplicare i soggetti: i fornitori sono Party con ruolo `Fornitore` e categoria operativa.

Quando saranno implementati Acquisti, Spese e Pagamenti, il reporting dovra rispondere almeno a queste domande:

- Quali fornitori generano piu uscite nel periodo selezionato?
- Quanto viene speso per tipografie, editori, materiali, marketplace o altri fornitori?
- Quali fornitori sono collegati a costi di fiera, prodotti o ristampe?
- Quali spese verso fornitori risultano non ancora pagate?

Filtri futuri minimi: periodo, categoria fornitore, stato pagamento, evento, prodotto/lavoro collegato e intervallo di valore.

## Commissioni e progetti

Deve rispondere almeno a queste domande:

- Quanti lavori sono stati creati, avviati, completati o annullati?
- Quanti lavori ho completato nel periodo?
- Quali lavori sono in ritardo rispetto alla scadenza?
- Quali lavori hanno ancora un saldo aperto?
- Quali commissioni sono in attesa di approvazione del preventivo?
- Quanto valore e stato generato da ciascun progetto?
- Quali progetti contengono piu attivita o task aperti?
- Qual e il tempo medio tra accettazione del preventivo e consegna?
- Quali canali generano piu commissioni e piu compenso concordato?
- Qual e la distribuzione degli incarichi per stato economico?

Le metriche economiche devono esporre separatamente compenso concordato, importo fatturabile, importo incassato e residuo da ricevere. Il report deve poter filtrare per commissione privata, lavoro editoriale, progetto, cliente, committente e canale.

## Eventi e fiere

Il reporting fieristico ha due livelli distinti:

- **FairEdition:** risultati di una specifica edizione, con date, luogo, costi, vendite, commissioni e margine;
- **FairSeries:** aggregazione delle edizioni della stessa manifestazione, con confronti annuali, trend, medie e andamento storico.

Le metriche devono poter filtrare per `fairEditionId` e raggruppare per `fairSeriesId`. L'anno e una dimensione descrittiva dell'edizione, non la sua identita. Origine, consegna e contabilizzazione di un'Operazione possono riferire edizioni differenti.

Nel breve periodo i report potranno leggere campi aggregati V1 della FairEdition, come costo stand, hotel, viaggio, altri costi, rimborso/gettone e stati pagato. Nel modello maturo questi valori dovranno essere ricostruibili da booking, costi, incassi e spese collegate.

Deve rispondere almeno a queste domande:

- Quale fiera e stata piu redditizia?
- Quanto spendo mediamente per partecipare a una fiera?
- Qual e il margine medio per evento?
- Quali eventi hanno generato piu vendite?
- Quali prodotti hanno venduto meglio in ciascun evento?
- Qual e il costo totale di un evento includendo stand, viaggio, alloggio e altre spese?
- Qual e il ricavo lordo e quale il risultato netto di ogni evento?
- Quante vendite o entrate sono state generate per canale e per evento?
- Quali eventi hanno avuto il miglior rapporto tra costi e ricavi?
- Quale inventario e stato portato, venduto, restituito o rettificato?
- Quali fiere future non hanno ancora un hotel o alloggio registrato?
- Quali fiere hanno prenotazioni con scadenza di cancellazione vicina?
- Quali fiere hanno un budget previsto negativo?
- Quali fiere sono in attesa di dati economici essenziali?
- Quali fiere hanno ricevuto rimborsi o gettoni?
- Quale costo medio sostengo per hotel o alloggio?
- Quanto spendo mediamente in viaggio per fiera?
- Quali scadenze organizzative sono imminenti per le fiere future?

Il margine deve dichiarare se considera solo spese direttamente associate oppure anche costi allocati. Gli eventi senza vendite devono restare inclusi nelle analisi dei costi medi.

## Vendite

I report vendite dovranno considerare che la Modalita Fiera salva Operazioni rapide e potenzialmente incomplete. I totali devono distinguere dati completi, dati mancanti e record da completare in Backoffice.

Per le Fiere, i Ricavi sono la somma delle Operazioni di tipo vendita associate a `fairEditionId` piu il Rimborso. Il Bilancio e `Ricavi - Costi`. La copertura operativa dei costi segue l'ordine Stand, Viaggio, Hotel, Altri costi: ogni voce consuma il risultato disponibile prima della successiva.

Deve rispondere almeno a queste domande:

- Quali prodotti vendo di piu per quantita?
- Quali prodotti generano piu fatturato?
- Quale categoria genera piu fatturato?
- Quale canale genera piu vendite?
- Qual e il valore medio di una vendita?
- Quali varianti o SKU hanno scorte sotto soglia?
- Quali vendite risultano non ancora incassate?
- Quali prodotti hanno avuto il maggior numero di resi o rettifiche?
- Quali sono le vendite per periodo, evento, cliente e canale?

## Prodotti

La V1 della feature Prodotti non implementa statistiche o dashboard. Il modello deve pero conservare le dimensioni minime per i report futuri: nome prodotto, stato attivo/non attivo, prezzo suggerito, tag e collegamento futuro a Lotto.

Quando saranno implementati vendite e report, il reporting prodotti dovra rispondere almeno a queste domande:

- Quali prodotti generano piu vendite o ricavi?
- Quali prodotti attivi non sono stati venduti in un periodo?
- Quali prodotti chiamati Commissione, Sketch, Copertina o Illustrazione generano piu richieste o incassi?
- Quali bundle sono piu venduti e quali prodotti componenti contribuiscono al risultato?
- Quali tag descrivono meglio vendite, richieste o prodotti portati in fiera?

Filtri futuri minimi: periodo, prodotto, stato attivo, tag, lotto, evento, canale e intervallo di prezzo. I report devono distinguere il prezzo suggerito del catalogo dal prezzo effettivo registrato nella vendita.

## Lotti

La V1 della feature Lotti non implementa statistiche o dashboard. Il modello deve pero conservare i dati necessari per analisi economiche future:

- Ho recuperato il costo di stampa?
- Questo acquisto e stato ammortizzato?
- Vale la pena ristampare?
- Quanto utile ha generato questo lotto?

Filtri futuri minimi: prodotto, acquisto origine e alias. Le vendite non ancora collegate a un lotto dovranno restare analizzabili in futuro senza bloccare il workflow rapido in fiera, ma la relativa associazione non e implementata nella V1.

## Acquisti destinati alla vendita

La V1 della feature Acquisti non implementa statistiche o dashboard. Il modello deve pero conservare i dati necessari a ricostruire in futuro il costo di prodotti acquistati o prodotti per la vendita, coerentemente con il foglio storico `Prodotti`.

Quando saranno implementati report e collegamenti a catalogo/lotti, il reporting dovra rispondere almeno a queste domande:

- Quanto e stato speso per acquistare o produrre prodotti destinati alla vendita?
- Quali fornitori sono piu rilevanti per acquisti di prodotti vendibili?
- Quali acquisti non sono ancora collegati a un prodotto o lotto normalizzato?
- Qual e il costo storico associato a una stampa, ristampa o produzione?

Filtri futuri minimi: periodo, fornitore, prodotto, lotto, descrizione testuale e intervallo di importo. I report devono dichiarare se usano solo record Acquisto o anche movimenti economici/pagamenti riconciliati.
- Qual e l'andamento delle quantita vendute rispetto al periodo precedente?

Il fatturato delle vendite usa il prezzo storico registrato nella riga di vendita. Resi e annullamenti devono essere visibili separatamente e non cancellare la transazione originale.

## Finanza

Deve rispondere almeno a queste domande:

- Quanto devo ancora incassare?
- Quanto ho incassato per anno?
- Quanto ho speso per categoria?
- Qual e il totale delle entrate e delle uscite nel periodo?
- Qual e il risultato netto per mese, trimestre e anno?
- Quali compensi sono concordati ma non ancora fatturabili?
- Quali importi sono fatturabili ma non ancora incassati?
- Quali acconti sono attesi e quali sono gia ricevuti?
- Quali rapporti economici sono parzialmente pagati, pagati, insoluti o annullati?
- Quali spese sono previste, sostenute, pagate o ancora da pagare?
- Quali categorie di spesa sono cresciute rispetto al periodo precedente?
- Quali entrate provengono da vendite, commissioni, editoriale o rimborsi?
- Qual e il totale per cliente, progetto, evento, canale e valuta?

Ogni report finanziario deve esporre la definizione della metrica e la data usata. I totali in valute diverse non devono essere sommati senza una regola di conversione esplicita.

## Scadenze

Deve rispondere almeno a queste domande:

- Quali consegne scadono nei prossimi 7 giorni?
- Quali altre scadenze scadono nell'intervallo personalizzato?
- Quanti lavori sono in ritardo?
- Quante attivita sono aperte?
- Quali pagamenti o incassi hanno una scadenza superata?
- Quali scadenze appartengono a un evento o a una fiera imminente?
- Quali clienti o committenti sono associati alle scadenze piu urgenti?
- Qual e il tempo medio di completamento delle attivita?
- Quante scadenze sono state rinviate e con quale frequenza?
- Quali scadenze non hanno un'origine o una data valida?

Le scadenze completate restano consultabili. Un lavoro e in ritardo quando ha un obbligo non completato oltre la data limite; il semplice ritardo di un task non deve essere contato come lavoro in ritardo senza una regola esplicita.

## Analisi temporali

Deve supportare almeno:

- confronto anno su anno;
- confronto mese su mese;
- confronto trimestre su trimestre;
- evoluzione delle entrate nel tempo;
- evoluzione delle uscite nel tempo;
- andamento del risultato netto;
- andamento di vendite, commissioni e lavori completati;
- andamento del residuo da ricevere;
- evoluzione delle prestazioni dei canali;
- stagionalita di eventi, fiere e prodotti.

I confronti devono usare periodi equivalenti e rendere espliciti i periodi senza dati. Una metrica temporale deve specificare se raggruppa per data di vendita, data di competenza, data di incasso o data di pagamento.

## Dimensioni e filtri comuni

I report devono poter essere filtrati o raggruppati, quando applicabile, per:

- intervallo temporale;
- anno, trimestre e mese;
- cliente, committente, editore o altro ruolo del Party;
- progetto, commissione e lavoro editoriale;
- evento e fiera;
- prodotto, variante, SKU e categoria;
- canale;
- stato operativo e stato economico;
- categoria di entrata o uscita;
- metodo di pagamento;
- valuta.

## Requisiti di qualita dei dati

- Ogni valore aggregato deve essere riconducibile ai record di origine.
- I record archiviati o annullati devono essere esclusi dai totali operativi secondo una regola dichiarata, non rimossi silenziosamente.
- I dati mancanti devono produrre un avviso o una categoria "non classificato", non sparire dal report.
- Le entrate e uscite devono mantenere la direzione del movimento economico.
- Gli importi preventivati o concordati non devono essere presentati come denaro incassato.
- I report devono dichiarare quando un margine e parziale perche mancano costi o incassi.
- L'assenza di dati deve essere distinta da un valore pari a zero.
