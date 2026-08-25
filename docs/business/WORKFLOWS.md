# Workflow applicativi

> **Decisione prevalente:** tutti i workflow descritti qui sono varianti del ciclo di vita di una Operazione. Per record rapidi, stati di commissione, clienti soft e contabilizzazione fieristica vale [OPERATIONS-DOMAIN-SPECIFICATION.md](OPERATIONS-DOMAIN-SPECIFICATION.md).

> **Confini Work/Sale:** per decidere quando una commissione, sketch, prodotto o bundle e Work, Sale o caso ibrido consultare [WORK-SALES-BOUNDARIES.md](WORK-SALES-BOUNDARIES.md).

> **Lifecycle operativi:** gli stati e le transizioni consentite sono definiti in [OPERATION-LIFECYCLE.md](OPERATION-LIFECYCLE.md).

## Principi comuni

I workflow descrivono le operazioni principali dell'attivita artistica. Le entita possono essere salvate anche con dati incompleti, ma l'app deve evidenziare campi mancanti, scadenze assenti e riferimenti da completare.

Le scritture economiche devono mantenere lo storico. Un compenso concordato non equivale a un incasso; una spesa registrata non equivale a una spesa pagata; una vendita non deve essere modificata per correggere il magazzino.

## Requisiti trasversali di utilizzo

I workflow devono essere utilizzabili su smartphone, tablet e desktop senza cambiare regole o significato dei dati. Smartphone privilegia ricerca, inserimento rapido e una sola azione primaria per schermata; tablet supporta confronto e pannelli affiancati; desktop supporta viste dense e report.

Durante una fiera, vendita, commissione, inventario, cliente, fornitore e scadenza devono essere consultabili o aggiornabili con pochi passaggi, anche offline. Il salvataggio locale deve dare feedback immediato e le azioni distruttive devono richiedere conferma.

I controlli devono essere touch friendly, raggiungibili da tastiera e dotati di etichette accessibili. Stato operativo, stato economico, Canale, WorkType e Tag hanno significati distinti e non devono essere usati come sinonimi.

Una richiesta non ancora accettata puo essere registrata come Opportunity. Il percorso economico tipico resta: richiesta, Opportunity, Preventivo, accettazione, Operazione di tipo commissione o editoriale, Acconto, consegna, Saldo.

## 1. Gestione commissione privata

### Attore
Artista, con eventuale cliente privato che fornisce brief, approva revisioni e riceve la consegna.

### Obiettivo
Portare una richiesta privata dalla raccolta dei requisiti alla consegna, controllando lavoro, revisioni, compenso, pagamenti e scadenze.

### Flusso
1. Cercare un cliente esistente oppure crearne uno nuovo.
2. Registrare richiesta, titolo, descrizione, riferimenti, data desiderata e canale di origine.
3. Creare un preventivo con importo, valuta, condizioni, revisioni incluse e scadenza dell'offerta.
4. Portare il preventivo ad accettato, rifiutato o scaduto; solo dopo l'accettazione attivare la commissione.
5. Registrare compenso concordato, importo fatturabile e stato economico iniziale `Concordato`.
6. Portare la commissione da `idea` o `planned` a `in_progress`.
7. Registrare fasi operative, revisioni e comunicazioni rilevanti.
8. Creare o aggiornare scadenze per bozza, revisione e consegna.
9. Registrare acconto e saldo come incassi separati, aggiornando lo stato economico senza sovrascrivere lo storico.
10. Allegare o annotare il file consegnato e la data di invio.
11. Portare il lavoro a `completed` dopo l'accettazione o a `cancelled`, conservando lo storico.

### Dati coinvolti
Cliente, committente e contatti; Party e ruoli se applicabili; commissione, tipo, brief, riferimenti e canale; preventivo, accettazione, compenso concordato, importo fatturabile e stato economico; stato operativo, fasi, revisioni e note; scadenze; consegne e allegati; incassi, metodo, data e residuo.

## 2. Gestione lavoro editoriale

### Attore
Artista e, secondo il caso, editore, redazione o altro committente organizzativo.

### Obiettivo
Gestire un incarico editoriale composto da milestone e consegne, rispettando contratto, scadenze, revisioni e condizioni economiche.

### Flusso
1. Registrare editore, organizzazione e contatti.
2. Registrare richiesta e canale di origine, se noto.
3. Creare un preventivo o una proposta editoriale con compenso, valuta, diritti, royalties, rimborsi e condizioni.
4. Registrare approvazione e trasformare la proposta accettata in lavoro editoriale.
5. Distinguere compenso concordato, importo fatturabile, importo incassato e residuo da ricevere.
6. Scomporre l'incarico in milestone e fasi.
7. Assegnare scadenza, stato e criteri a ogni milestone.
8. Registrare consegne, feedback, revisioni e approvazioni.
9. Registrare incassi e aggiornare lo stato economico.
10. Chiudere il lavoro dopo le consegne approvate o registrare esplicitamente eccezioni.

### Dati coinvolti
Editore, committente e contatti; Party, ruoli e canale; lavoro, preventivo e contratto; compenso concordato, importo fatturabile, importo incassato, residuo e stato economico; diritti, royalties, rimborsi e valuta; milestone, fasi e scadenze; consegne, revisioni e approvazioni; allegati; incassi e spese collegate.

## 3. Gestione fumetto

### Attore
Artista o team creativo che produce una serie, un volume, un episodio o singole tavole.

### Obiettivo
Organizzare la produzione e misurarne l'avanzamento a partire dalle unita di lavoro effettive.

### Flusso
1. Creare serie, volume ed episodio.
2. Definire formato, obiettivi e fasi di produzione.
3. Creare l'elenco delle tavole con numero e riferimenti allo script.
4. Avanzare le tavole tra script, matite, chine, colore, lettering e revisione.
5. Registrare blocchi, note, revisioni e cambi di scadenza.
6. Collegare file di lavoro o consegna alle tavole.
7. Calcolare avanzamento per episodio, volume e serie dalle tavole completate.
8. Registrare verifica finale, consegna o pubblicazione.

### Dati coinvolti
Serie, volume ed episodio; tavole, ordine e stato; fasi e storico; script, note, blocchi e revisioni; scadenze e milestone; allegati; cliente o editore; consegna e pubblicazione.

## 4. Pianificazione Fiera

### Attore
Artista che valuta e prepara la partecipazione a una fiera molti mesi prima dell'evento.

### Obiettivo
Decidere se partecipare e arrivare all'evento con costi, prenotazioni e scadenze sotto controllo.

### Flusso
1. Registrare la fiera annunciata come FairEdition, anche con dati incompleti.
2. Valutare partecipazione, costi attesi, rimborsi, gettoni e potenziale commerciale.
3. Prenotare hotel o alloggio, spesso con cancellazione gratuita.
4. Registrare costo hotel previsto/confermato e data limite di cancellazione gratuita.
5. Stimare il viaggio, ad esempio con ViaMichelin o strumenti equivalenti.
6. Registrare costo viaggio previsto e ipotesi di mezzo.
7. Registrare eventuali costi stand, parcheggi, vitto o altri costi previsti.
8. Registrare rimborsi o gettoni presenza previsti.
9. Creare scadenze collegate: cancellazione gratuita, pagamento stand, invio materiale, saldo hotel, prenotazione viaggio.
10. Monitorare le scadenze nei mesi successivi.
11. Confermare definitivamente o annullare la partecipazione.
12. Passare alla preparazione operativa e poi alla partecipazione.
13. Durante e dopo l'evento registrare vendite, attivita e consuntivo finale.

### Dati coinvolti
FairSeries, FairEdition, Booking, FairCost, rimborso/gettone, scadenze, organizzatore, contatti, note logistiche, stato operativo, stato economico previsto, spese e incassi effettivi.

### Scadenze tipiche
- cancellazione gratuita hotel;
- pagamento stand;
- invio materiale all'organizzatore;
- saldo hotel;
- prenotazione o acquisto viaggio;
- conferma presenza;
- chiusura iscrizione o consegna documenti.

### Controlli consigliati
- data di cancellazione gratuita precedente all'inizio della fiera;
- costi previsti mancanti per hotel, viaggio o stand;
- budget previsto negativo;
- fiera confermata senza prenotazione hotel quando necessaria;
- scadenze nei prossimi 30 giorni;
- rimborso/gettone previsto ma non ancora ricevuto dopo l'evento.

## 5. Partecipazione a una fiera

### Attore
Artista partecipante, con eventuali organizzatore, collaboratori e fornitori.

### Obiettivo
Preparare, gestire e chiudere una fiera collegando logistica, prodotti, vendite, spese e risultato economico.

### Flusso
1. Creare l'evento con nome, luogo, date e contatti.
2. Registrare prenotazione, stand, viaggio, alloggio e attrezzatura.
3. Registrare costi previsti e spese sostenute.
4. Selezionare prodotti e quantita da portare, verificando il magazzino.
5. Registrare vendite durante o dopo la fiera con evento e canale.
6. Aggiornare il magazzino con vendite, rientri e rettifiche.
7. Registrare incassi e spese effettive.
8. Chiudere l'evento confrontando ricavi, costi e margine.
9. Archiviare note utili per eventi futuri.

### Dati coinvolti
Evento, tipo, luogo, date e organizzatore; stand e logistica; prodotti, varianti e quantita; vendite e canali; movimenti di magazzino; spese; incassi e metodi; note e report.

## 6. Registrazione vendite

### Attore
Artista o collaboratore che registra una vendita online, in fiera, in negozio o diretta.

### Obiettivo
Registrare una transazione verificabile, aggiornando la disponibilita e distinguendo vendita, incasso e reso.

### Flusso
1. Selezionare canale, con eventuale evento associato come contesto distinto.
2. Creare vendita con data, cliente opzionale e stato.
3. Aggiungere una riga per ogni prodotto o variante.
4. Conservare nella riga quantita e prezzo applicato.
5. Registrare il movimento di uscita dal magazzino.
6. Registrare incasso, metodo, valuta e stato oppure il residuo.
7. Gestire annullamenti e resi con movimenti compensativi tracciati.
8. Rendere la vendita disponibile nei report.

### Dati coinvolti
Vendita, data, canale ed evento; cliente; prodotti, varianti, SKU e righe; quantita, prezzo, sconti e totale; magazzino; incasso, metodo, valuta e stato; resi e rettifiche.

## 6.1 Gestione prodotti di catalogo

### Attore
Artista che prepara o aggiorna l'offerta vendibile.

### Obiettivo
Mantenere un catalogo rapido e coerente di prodotti fisici, offerte creative e bundle, senza attivare ancora workflow commissioni, vendite o magazzino.

### Flusso
1. Aprire la lista Prodotti.
2. Cercare un prodotto esistente per nome, descrizione o tag.
3. Creare o modificare nome, prezzo suggerito, descrizione opzionale, stato attivo/non attivo e tag.
4. Inserire come nome prodotto le voci operative reali: Stampa A4, Stampa A5, Artbook, Fumetto, Calamita, Originale, Commissione, Sketch, Copertina, Illustrazione, Bundle o varianti effettivamente usate.
5. Salvare localmente senza obbligare l'artista a definire categorie, varianti, lotti, magazzino o vendite.

### Vincoli V1
Commissione, Sketch e Bundle sono Prodotti. La loro presenza in catalogo non avvia workflow commissioni, non crea vendita e non modifica disponibilita. Durante una fiera questa scelta permette di cercare rapidamente l'offerta commerciale per nome senza scegliere una categoria intermedia.

## 7. Registrazione acquisti destinati alla vendita

### Attore
Artista che acquista o fa produrre articoli destinati alla vendita.

### Obiettivo
Registrare rapidamente il costo storico di prodotti vendibili, preparando il collegamento futuro a Prodotto e Lotto senza obbligare subito a gestire magazzino, vendite o ammortamento.

### Flusso
1. Creare l'acquisto dalla lista Acquisti.
2. Selezionare il fornitore se gia presente, oppure lasciare il campo non indicato e completarlo in seguito.
3. Inserire data acquisto, descrizione operativa e importo totale.
4. Aggiungere note utili, ad esempio quantita, formato o riferimento ordine.
5. Salvare localmente con feedback immediato.
6. Collegare in futuro Prodotto o Lotto solo quando l'identita e sufficientemente certa.

### Dati coinvolti
Acquisto, fornitore, data, descrizione, importo totale e note; riferimenti futuri a prodotto e lotto.

### Vincoli V1
La registrazione non crea movimento di magazzino, non alimenta statistiche, non aggiorna vendite e non calcola ammortamento. Questa scelta e intenzionale: il foglio storico `Prodotti` contiene righe spesso aggregate o incomplete, e durante una fiera o una preparazione evento il workflow piu rapido e annotare il costo senza bloccare l'artista su normalizzazioni premature.

## 8. Registrazione spese

### Attore
Artista o collaboratore che registra un costo previsto o sostenuto.

### Obiettivo
Classificare i costi e collegarli al contesto corretto, distinguendo competenza della spesa e pagamento.

### Flusso
1. Creare la spesa con data, descrizione, importo, valuta e categoria.
2. Indicare fornitore e riferimento del documento, se disponibili.
3. Collegarla a evento, lavoro, prodotto o attivita generale.
4. Allegare ricevuta o fattura.
5. Indicare stato, rimborsabilita e data di competenza.
6. Registrare separatamente il pagamento quando necessario.
7. Impostare una scadenza per le spese non pagate.
8. Includere il costo nei report.

### Dati coinvolti
Spesa, descrizione, categoria e stato; date; importo, valuta e imposte; fornitore e documento; progetto, lavoro, evento o prodotto; ricevute; pagamento, scadenza e rimborso.

### Workflow rapido fornitore

Quando il fornitore non esiste ancora, l'artista puo creare una scheda minimale prima o durante la registrazione della spesa: nome, categoria, sito web, email, telefono e note. La categoria iniziale deve coprire i casi osservati nei workflow reali ed Excel storico: tipografie per ristampe, editori e organizzazioni, fornitori di materiali, marketplace e altri fornitori.

La creazione del fornitore non deve bloccare il record economico: se durante una fiera serve solo registrare velocemente una spesa o un acquisto, il flusso deve privilegiare pochi campi e salvataggio locale immediato. Relazioni complesse, statistiche e dashboard dei fornitori restano fuori dalla V1.

## 9. Gestione incassi

### Attore
Artista che registra denaro ricevuto da cliente, editore o acquirente.

### Obiettivo
Tracciare ogni entrata e riconciliarla con compenso, vendita o rimborso, mantenendo visibile il saldo residuo.

### Flusso
1. Identificare l'origine: commissione, editoriale, vendita, rimborso o altra entrata.
2. Registrare data, importo, valuta e metodo.
3. Collegare l'incasso all'entita di origine e al soggetto o evento.
4. Indicare causale, riferimento esterno e stato di verifica.
5. Registrare separatamente acconto, rate e saldo.
6. Calcolare totale incassato e residuo senza modificare il compenso originario.
7. Gestire storni e rimborsi con movimento inverso collegato.
8. Includere l'incasso nei report per periodo e origine.

### Dati coinvolti
Incasso, data, importo e valuta; metodo e stato; causale e riferimento; compenso, preventivo o vendita di origine; cliente o editore; rate, saldo e scadenze; storni e rimborsi.

## 10. Gestione scadenze

### Attore
Artista, che crea e aggiorna scadenze proprie o derivate da lavori, eventi e pagamenti.

### Obiettivo
Raccogliere obblighi e attivita con data limite, collegandoli all'origine e rendendo evidenti ritardi e priorita.

### Flusso
1. Creare una scadenza manualmente o da lavoro, milestone, evento, spesa o pagamento.
2. Definire titolo, descrizione, data limite, priorita e stato.
3. Collegarla all'entita origine e alle eventuali dipendenze.
4. Visualizzare scadenze prossime, scadute, completate o senza data.
5. Registrare rinvii e cambi di piano nello storico.
6. Segnalare ritardi e conflitti.
7. Marcare la scadenza completata dopo verifica, senza completare automaticamente il lavoro.
8. Archiviare le scadenze concluse senza eliminarle dai report.

### Dati coinvolti
Scadenza, titolo, descrizione e stato; date e storico dei rinvii; priorita, categoria e dipendenze; origine; cliente o editore; notifiche; note, allegati e collegamenti.

## Report trasversali

I workflow alimentano report filtrabili per intervallo, cliente, progetto, lavoro, evento, categoria e canale. Le metriche iniziali includono compensi concordati, importi fatturabili, incassi, residui, vendite, acquisti, spese, margine evento, lavori aperti, scadenze e magazzino. Ogni report indica se usa data dell'operazione, di competenza o del pagamento.

## Backup e ripristino

Prima di un ripristino o di un'importazione distruttiva, l'app propone un export completo. L'import viene validato senza modificare i dati correnti, mostra conflitti e conteggi, quindi applica la scelta dell'utente in una transazione. Record e allegati devono restare coerenti anche in caso di errore.
