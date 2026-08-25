# Terminologia di dominio

> **Decisione prevalente:** [OPERATIONS-DOMAIN-SPECIFICATION.md](OPERATIONS-DOMAIN-SPECIFICATION.md) definisce Operazione, stati persistenti, Cliente soft e fiera di contabilizzazione. Le definizioni precedenti incompatibili sono superate.

Questo glossario e normativo per interfaccia, modello dati, report e import/export. Ogni termine mantiene il significato qui definito; quando serve un concetto diverso si usa un termine diverso.

## Soggetti

### Cliente

Persona o organizzazione con cui esiste una relazione commerciale come destinatario di un lavoro oppure acquirente di un prodotto. Il cliente e un ruolo nel rapporto con l'artista: puo essere collegato a una commissione o a una vendita, ma non e necessariamente il soggetto che ordina il lavoro.

### Committente

Persona o organizzazione che richiede, approva o finanzia uno specifico lavoro. Il committente e riferito a un incarico; puo coincidere con il cliente, ma puo anche essere diverso dall'acquirente finale o dal destinatario del risultato.

### Party

Soggetto generale con cui l'artista mantiene una relazione: puo essere una persona o un'organizzazione e puo ricoprire uno o piu ruoli. Party e l'anagrafica unica usata per evitare duplicazioni tra clienti, committenti, editori, fornitori e collaboratori.

### Persona

Tipo di Party riferito a un individuo identificabile. Una Persona puo avere i ruoli di cliente, committente, collaboratore o altri ruoli applicabili.

### Organizzazione

Tipo di Party riferito a un'entita collettiva, azienda, editore o associazione. Un'Organizzazione puo ricoprire piu ruoli senza duplicare i dati anagrafici.

### Ruoli del Party

Ruoli contestuali assegnabili a un Party: Cliente, Committente, Editore, Fornitore e Collaboratore. Il ruolo descrive la relazione in uno specifico contesto; non crea una nuova persona o organizzazione.

### Fornitore

Persona o organizzazione da cui l'artista acquista prodotti o servizi, ad esempio tipografia, editore, fornitore di materiali, marketplace o altro fornitore. Fornitore e un ruolo di Party e puo convivere con altri ruoli quando il soggetto reale e lo stesso.

### Categoria fornitore

Classificazione operativa minima del fornitore: tipografia, editore, materiali, marketplace o altro. Serve per ricerca e inserimento rapido, non per contabilita, statistiche o relazioni complesse.

## Organizzazione del lavoro

### Progetto

Contenitore organizzativo di durata variabile che raggruppa obiettivi, attivita, task, risorse e risultati collegati. Un progetto puo contenere piu lavori o produrre un risultato interno; non implica da solo l'esistenza di un cliente o di un compenso.

### Attivita

Unita di lavoro significativa, descrivibile con un obiettivo e un risultato atteso, che appartiene a un progetto o a un lavoro. Un'attivita puo essere ulteriormente scomposta in task e puo avere una propria scadenza.

### Task

Azione operativa atomica assegnabile e verificabile, necessaria per completare un'attivita. Un task ha un'azione concreta e uno stato di completamento; non e un contenitore di altre attivita.

### Commissione

Incarico richiesto da un committente per produrre un risultato specifico, generalmente con brief, compenso concordato, revisioni e consegna. Una commissione e un tipo di lavoro; non coincide con il progetto che puo contenerla ne con il pagamento che la remunera.

## Eventi e commercio

### Evento

Occorrenza pianificata in un luogo o intervallo temporale, con eventuali costi, partecipanti e attivita collegate. Un evento puo essere una fiera, una presentazione o un incontro e non implica necessariamente vendite.

### Fiera

Evento pubblico o commerciale a cui l'artista partecipa per esporre, promuovere o vendere prodotti. La fiera e una specializzazione di evento e aggiunge dati come stand, prenotazione, inventario portato e vendite associate.

### FairSeries

Manifestazione ricorrente considerata nel suo complesso, ad esempio Alecomics o Lucca Comics. Contiene dati riutilizzabili tra edizioni, come organizzatore, contatti, sito e luogo abituale.

### FairEdition

Specifico appuntamento o partecipazione a una fiera, ad esempio Alecomics 2026. Contiene date, luogo, costi, prenotazioni, scadenze, risultati e stato operativo della singola edizione.

### Booking

Prenotazione o impegno logistico collegato a una FairEdition. Puo rappresentare hotel, viaggio, parcheggio o altra prenotazione e include condizioni, riferimenti e scadenze come la cancellazione gratuita.

### Costo previsto / confermato / pagato / effettivo

Fasi diverse dello stesso costo. Il previsto e una stima; il confermato e un importo comunicato o prenotato; il pagato e il denaro effettivamente versato; l'effettivo finale e il costo consolidato dopo l'evento.

### Rimborso e gettone

Entrate collegate alla partecipazione a una fiera. Il rimborso compensa costi specifici; il gettone remunera la presenza. Entrambi possono essere previsti o ricevuti e incidono sul risultato economico dell'evento.

### Vendita

Transazione commerciale in cui uno o piu prodotti vengono ceduti a un acquirente a fronte di un prezzo. La vendita contiene righe, quantita e prezzi applicati; puo risultare non ancora incassata e non e sinonimo di entrata.

### Prodotto

Articolo o servizio definito nel catalogo e potenzialmente vendibile, con nome, identificativo, prezzo e regole proprie. Una vendita registra una fotografia del prodotto venduto, mentre il prodotto di catalogo puo cambiare in seguito.

### Acquisto destinato alla vendita

Registrazione del costo sostenuto per acquistare o produrre prodotti destinati alla vendita, come fumetti, calamite o stampe. Non e una vendita, non e un incasso e nella V1 non aggiorna il magazzino. Puo essere collegato a un Fornitore e in futuro a Prodotto o Lotto.

### Lotto

Raggruppamento normalizzato di produzione, stampa, ristampa o acquisto con quantita e costo. Un Acquisto puo preparare la creazione o il collegamento a un Lotto, ma non lo crea automaticamente nella V1.

### Canale

Modalita attraverso cui viene generata una vendita, una commissione, un contatto o un'opportunita lavorativa. Esempi sono Fiera, Instagram, Facebook, Sito web, Negozio, Editore, Marketplace, Passaparola, Evento e Altro.

Il Canale puo essere associato a vendite, commissioni, progetti, clienti ed eventi. Serve ad analizzare nel tempo quali origini generano piu lavoro, fatturato o clienti; non e il luogo fisico dell'evento ne il metodo di pagamento.

### Opportunity

Richiesta, contatto o possibile incarico non ancora trasformato in preventivo accettato o lavoro attivo. Conserva l'opportunita commerciale e il prossimo passo, ma non rappresenta ne un compenso concordato ne una commissione.

### Tag

Etichetta applicabile a piu entita per ricerca e classificazione trasversale, ad esempio `ritratto`, `urgenza` o `ristampa`. Un Tag non descrive lo stato operativo, la categoria economica o il Canale.

### WorkType

Classificazione del tipo di lavoro, ad esempio commissione privata, lavoro editoriale, fumetto, illustrazione o altro. WorkType descrive la natura dell'incarico e non sostituisce ne lo stato ne il Canale.

### Work

Concetto descrittivo della componente di lavoro di un'Operazione. Non e un'entita persistente separata: Commissione e Lavoro editoriale sono profili classificati tramite WorkType.

## Catalogo e configurazione

### Categoria

Raggruppamento configurabile che organizza opzioni e varianti di un prodotto. Una categoria rappresenta un aspetto mutabile come Formato, Tecnica, Colore o Confezione. Ogni categoria puo essere creata, modificata ed eliminata dall'utente senza intervento tecnico.

Una categoria e definita da: nome, descrizione opzionale, modalita di selezione (singola o multipla), ordinamento, stato attivo/inattivo e un valore predefinito opzionale.

Modalita di selezione singola: l'utente puo scegliere un solo tag della categoria.
Modalita di selezione multipla: l'utente puo scegliere zero o piu tag della categoria.

Esempio:
- Categoria "Formato": modalita singola (scegli un formato tra A3, A4, A5, Altro)
- Categoria "Tecnica": modalita multipla (scegli una o piu tecniche tra Matita, China, Acquerello, Digitale)

### Tag

Opzione configurabile appartenente a una categoria. Un tag rappresenta una scelta concreta che l'utente puo fare, come "A4" nella categoria "Formato" o "Acquerello" nella categoria "Tecnica".

Un tag e definito da: nome, descrizione opzionale, ordinamento, stato attivo/inattivo, categoria di appartenenza, configurazione di prezzo opzionale e indicazione di supporto per campo libero.

Un tag puo influenzare il prezzo finale attraverso un modificatore di prezzo.
Un tag puo consentire un campo di testo libero inserito dall'utente al momento della vendita.

### Modificatore di prezzo

Configurazione numerica che definisce come un tag influenza il prezzo finale di un prodotto. Un modificatore e uno tra:

- Percentuale: valore positivo o negativo che moltiplica il prezzo base (ad esempio +50%, -25%)
- Valore fisso: importo positivo o negativo aggiunto al prezzo (ad esempio +10€, -5€)

La formula di calcolo del prezzo finale e:
prezzo finale = (prezzo base × (1 + Σ modificatori percentuali)) + Σ modificatori a valore fisso

Esempio:
- Prezzo base: €100
- Tag "A3" (+50% modifier): €150
- Tag "Copertina rigida" (+€10 modifier): €160

### Associazione Categoria-Prodotto

Legame esplicito che dichiara quali categorie siano rilevanti per un determinato prodotto. Rappresenta una scelta configurativa: il prodotto "Sketch" utilizza le categorie "Formato" e "Tecnica", mentre il prodotto "Fumetto" utilizza solo "Tecnica".

Un'associazione include: prodotto, categoria, ordinamento, valore predefinito opzionale (che sovrascrive il default della categoria) e stato attivo/inattivo.

### Default di categoria vs override di prodotto

Gerarchia di risoluzione quando l'utente non ha scelto esplicitamente un valore per una categoria:

1. Override del prodotto per quella categoria (se definito)
2. Default della categoria (se definito)
3. Nessun default: l'utente deve scegliere

Esempio:
- Categoria "Formato" ha default "A4"
- Prodotto "Sketch" ha override "Formato" = "A5"
- Utente vede "A5" come predefinito quando configura uno "Sketch", ma vede "A4" per altri prodotti

### Campo libero

Valore testuale libero inserito dall'utente durante la configurazione di un prodotto o la creazione di una vendita. Un campo libero e associato a un tag o a una configurazione di prodotto.

Attributi: etichetta personalizzabile, placeholder opzionale, valore suggerito opzionale (a livello di prodotto), validazioni future opzionali.

Esempio:
- Categoria "Formato", Tag "Altro", consente un campo libero con etichetta "Dimensioni personalizzate" e placeholder "es. 17x24 cm"
- Prodotto "Sketch" ha un valore suggerito "17x24 cm" per il campo libero del tag "Altro"

### Bundle

Prodotto virtuale composto da molteplici prodotti reali. Un bundle rappresenta un'offerta commerciale unica venduta come singola unita, ma contribuisce alle statistiche dei prodotti componenti.

Un bundle e definito da: nome, descrizione, prezzo bundle opzionale, elenco di prodotti inclusi (ciascuno con quantita), categorie ereditate dai componenti, override personalizzati, stato attivo/inattivo.

Esempio:
- Bundle "Fumetto + Sketch": 1 Fumetto + 1 Sketch
- Bundle "Artist Pack": 1 Sketchbook + 2 Print formato A4

### Eredita di categorie nel bundle

Un bundle eredita automaticamente tutte le categorie utilizzate dai prodotti che lo compongono. Categorie duplicate (ad esempio, se sia Fumetto che Sketch usano "Tecnica") sono consolidate a una singola categoria nel bundle.

Esempio:
- Prodotto "Fumetto" utilizza categorie: Tecnica
- Prodotto "Sketch" utilizza categorie: Formato, Tecnica
- Bundle "Fumetto + Sketch" eredita categorie: Formato, Tecnica

### Override di bundle

Personalizzazioni di bundle rispetto ai prodotti componenti. Un bundle puo definire:

- default tag differente dai prodotti originali
- valori liberi precompilati
- configurazioni specifiche non presenti nei prodotti

Esempio:
- Bundle "Fumetto + Sketch" ha override "Formato" = "Altro" con valore libero precompilato "17x24 cm"

Gerarchia di risoluzione per il default di una categoria in un bundle:

1. Override esplicito del bundle per quella categoria
2. Default del prodotto per quella categoria (se il bundle contiene un solo prodotto)
3. Default della categoria globale
4. Nessun default

Se il bundle contiene piu prodotti con default diversi della stessa categoria, non esiste un unico default; l'utente deve scegliere.

### Contabilizzazione del bundle

Processo di registrazione delle vendite di bundle. Quando un bundle viene venduto, la vendita contribuisce alle statistiche dei prodotti reali che lo compongono.

Esempio:
- Vendita: 1 Bundle "Fumetto + Sketch"
- Conseguenza: Fumetto incrementa il conteggio di vendite di 1 unita; Sketch incrementa il conteggio di 1 unita
- Il ricavo totale del bundle puo essere ripartito tra i componenti (logica di ripartizione da definire caso per caso)

## Finanza

### Preventivo

Proposta economica formulata prima della creazione o dell'attivazione di un incarico. Un preventivo puo essere accettato, rifiutato, scaduto o ancora in attesa; la sua accettazione puo generare una commissione o un lavoro, ma non e ancora un compenso incassato.

### Stato economico

Stato del rapporto tra valore proposto o concordato e denaro ricevuto per un incarico. Gli stati possibili sono: Preventivato, In attesa di approvazione, Concordato, Acconto ricevuto, Parzialmente pagato, Pagato, Insoluto e Annullato.

Lo stato economico non sostituisce lo stato operativo del lavoro e non modifica i movimenti economici registrati.

### Compenso concordato

Importo approvato dalle parti per un incarico, indipendentemente da quanto sia stato fatturato o incassato.

### Importo fatturabile

Quota del compenso che puo essere richiesta o documentata in una fase specifica secondo accordo e condizioni applicabili.

### Importo incassato

Somma degli incassi effettivamente ricevuti e riconciliati con un incarico; non include importi solo preventivati, fatturabili o promessi.

### Residuo da ricevere

Importo ancora dovuto, calcolato sottraendo gli incassi riconciliati dal compenso o dall'importo fatturabile pertinente.

### Movimento economico

Registrazione elementare di un fatto finanziario che modifica o documenta un valore economico, con importo, valuta, data, causale e direzione. E il termine generale che comprende entrate e uscite; non identifica da solo un incasso o un pagamento.

### Entrata

Movimento economico con direzione positiva per l'artista, che documenta un valore maturato o ricevuto, come una vendita, un compenso incassato o un rimborso. Un'entrata puo essere prevista o effettiva; quando il denaro e realmente ricevuto viene registrata anche come incasso.

### Uscita

Movimento economico con direzione negativa per l'artista, che documenta un costo maturato o sostenuto, come una spesa, un acquisto o una commissione bancaria. Un'uscita puo essere prevista o effettiva; la registrazione della spesa non prova da sola che sia gia stata pagata.

### Acconto

Quota di un compenso o prezzo ricevuta prima del completamento della prestazione o della consegna finale. L'acconto e un incasso parziale collegato a un importo concordato e riduce il residuo, ma non chiude automaticamente il rapporto economico.

### Saldo

Quota residua dovuta dopo aver sottratto acconti e altri importi gia riconciliati dal totale concordato. Il saldo puo indicare sia l'importo ancora da ricevere sia il pagamento finale che lo estingue; il contesto deve specificare quale dei due significati si applica.

## Pianificazione

### Scadenza

Data limite associata a un obbligo o a un risultato da completare, con stato, priorita e origine. Una scadenza non e l'attivita stessa: indica entro quando un'attivita, un pagamento, una consegna o un altro evento deve essere completato.

## Confini obbligatori

- Cliente identifica il rapporto commerciale; committente identifica chi ordina uno specifico lavoro.
- Party identifica il soggetto generale; Persona e Organizzazione ne sono i tipi; i ruoli descrivono la relazione senza duplicare l'anagrafica.
- Progetto organizza un insieme; attivita rappresenta un'unita significativa; task rappresenta un'azione atomica.
- Evento e la categoria generale; fiera e un tipo specifico di evento.
- Vendita descrive lo scambio commerciale; prodotto descrive cio che viene venduto; canale descrive l'origine commerciale.
- Opportunity descrive una possibilita non ancora attivata; Work descrive un incarico attivo o accettato; WorkType ne classifica la natura; Tag serve solo alla classificazione trasversale.
- Movimento economico e la categoria generale; entrata e uscita ne indicano la direzione.
- Preventivo, compenso concordato, importo fatturabile, importo incassato e residuo da ricevere rappresentano momenti diversi dello stesso rapporto economico.
- Acconto e una parte ricevuta in anticipo; saldo e la parte residua o il pagamento che la estingue.
- Scadenza descrive un limite temporale e non sostituisce l'entita o il lavoro a cui si riferisce.
- Categoria rappresenta un raggruppamento configurabile; Tag rappresenta una scelta concreta dentro una categoria.
- Modalita di selezione (singola o multipla) controlla quanti tag possono essere scelti dalla stessa categoria.
- Modificatore di prezzo influenza il prezzo finale; puo essere percentuale o a valore fisso e applicato in ordine.
- Associazione Categoria-Prodotto dichiara quale categoria e rilevante per un prodotto; un prodotto puo ignorare categorie globali non applicabili.
- Default di categoria vs override di prodotto: l'override di prodotto ha priorita sul default globale.
- Campo libero consente testo personalizzato da parte dell'utente; non sostituisce la scelta tra tag predefiniti.
- Bundle e un prodotto virtuale; ha identita propria e prezzo opzionale, ma statistiche di vendita dei componenti.
- Bundle eredita categorie dai componenti; puo definire override personalizzati della gerarchia di default.
- Contabilizzazione di bundle: una vendita di bundle incrementa i contatori dei prodotti componenti.
