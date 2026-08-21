# Terminologia di dominio

Questo glossario e normativo per interfaccia, modello dati, report e import/export. Ogni termine mantiene il significato qui definito; quando serve un concetto diverso si usa un termine diverso.

## Soggetti

### Cliente

Persona o organizzazione con cui esiste una relazione commerciale come destinatario di un lavoro oppure acquirente di un prodotto. Il cliente e un ruolo nel rapporto con l'artista: puo essere collegato a una commissione o a una vendita, ma non e necessariamente il soggetto che ordina il lavoro.

### Committente

Persona o organizzazione che richiede, approva o finanzia uno specifico lavoro. Il committente e riferito a un incarico; puo coincidere con il cliente, ma puo anche essere diverso dall'acquirente finale o dal destinatario del risultato.

### Party

Soggetto generale con cui l'artista mantiene una relazione: puo essere una persona o un'organizzazione e puo ricoprire uno o piu ruoli. Party e una possibile direzione architetturale per evitare duplicazioni; non sostituisce ancora il modello dati definitivo.

### Persona

Tipo di Party riferito a un individuo identificabile. Una Persona puo avere i ruoli di cliente, committente, collaboratore o altri ruoli applicabili.

### Organizzazione

Tipo di Party riferito a un'entita collettiva, azienda, editore o associazione. Un'Organizzazione puo ricoprire piu ruoli senza duplicare i dati anagrafici.

### Ruoli del Party

Ruoli contestuali assegnabili a un Party: Cliente, Committente, Editore, Fornitore e Collaboratore. Il ruolo descrive la relazione in uno specifico contesto; non crea una nuova persona o organizzazione.

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

### Vendita

Transazione commerciale in cui uno o piu prodotti vengono ceduti a un acquirente a fronte di un prezzo. La vendita contiene righe, quantita e prezzi applicati; puo risultare non ancora incassata e non e sinonimo di entrata.

### Prodotto

Articolo o servizio definito nel catalogo e potenzialmente vendibile, con nome, identificativo, prezzo e regole proprie. Una vendita registra una fotografia del prodotto venduto, mentre il prodotto di catalogo puo cambiare in seguito.

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

Concetto unificato e futuro per rappresentare lavori con elementi comuni come Party, Canale, stato, scadenze, consegne e valori economici. Commissione e Lavoro editoriale possono essere specializzazioni di Work; questa direzione non modifica ancora il modello dati definitivo.

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
