# Requisiti funzionali

## Scopo del documento

Questo documento definisce i requisiti funzionali dell'applicazione Artist Business Manager, focalizzati su configurabilita, flessibilita e gestione di opzioni configurabili per prodotti, bundle, prezzi e caratteristiche.

L'obiettivo e consentire ad artisti, illustratori, fumettisti e piccoli editori di gestire in modo flessibile questi elementi senza dover modificare il software.

## Requisiti generali

- **R.GEN.001:** L'applicazione deve consentire all'utente di creare, modificare e visualizzare categorie, tag, prodotti, bundle, prezzi e configurazioni senza interventi tecnici.
- **R.GEN.002:** Ogni scelta di configurazione deve essere retroattiva agli storici: un cambio di categoria non deve perdere i dati di vendita che la referenziavano.
- **R.GEN.003:** Tutte le configurazioni devono essere persistenti in IndexedDB e sincronizzabili via export/import.
- **R.GEN.004:** L'interfaccia di configurazione deve essere intuitiva e accessibile a utenti non tecnici.

## Sistema categorie e tag

### Categorie

- **R.CAT.001:** L'utente deve poter creare una categoria con i seguenti attributi:
  - Nome (obbligatorio)
  - Descrizione (opzionale)
  - Flag "consenti selezione multipla" (obbligatorio, default: falso)
  - Ordinamento (automatico o manuale)
  - Stato (attivo/inattivo)
  - Valore predefinito (opzionale)

- **R.CAT.002:** L'utente deve poter modificare una categoria esistente senza perdere i riferimenti storici delle vendite.

- **R.CAT.003:** L'utente deve poter eliminare una categoria (logicamente); le vendite storiche continuano a riferirsi alla categoria anche se disattivata.

- **R.CAT.004:** Categorie di esempio predefinite devono includere:
  - Formato (singola selezione): A3, A4, A5, Altro
  - Tecnica (selezione multipla): Matita, China, Acquerello, Digitale
  - Opzionali: Colore, Confezione, Personalizzazione

- **R.CAT.005:** Una categoria non attiva non puo essere assegnata a nuovi prodotti, ma rimane associata ai prodotti e bundle esistenti.

### Tag

- **R.TAG.001:** L'utente deve poter creare un tag appartenente a una categoria con i seguenti attributi:
  - Nome (obbligatorio)
  - Descrizione (opzionale)
  - Ordinamento (automatico o manuale)
  - Stato (attivo/inattivo)
  - Configurazione di prezzo (opzionale)
  - Flag "consenti campo libero" (opzionale, default: falso)
  - Etichetta del campo libero (se abilitato)
  - Placeholder del campo libero (se abilitato)

- **R.TAG.002:** L'utente deve poter modificare un tag mantenendo il riferimento alle vendite storiche.

- **R.TAG.003:** Un tag non attivo non puo essere selezionato in nuove vendite, ma rimane referenziato nelle vendite storiche.

- **R.TAG.004:** Un tag puo consentire un campo di testo libero per inserimento personalizzato (ad esempio "Altro" con valore libero "17x24 cm").

- **R.TAG.005:** Campi liberi supportano placeholder e etichette personalizzate per guidance dell'utente.

- **R.TAG.006:** Validazioni su campi liberi sono configurabili per evoluzione futura (lunghezza, pattern, ecc.).

## Modificatori di prezzo

### Configurazione

- **R.PRICE.001:** Un tag puo avere una e una sola configurazione di prezzo (nessuno, percentuale, o valore fisso).

- **R.PRICE.002:** Modificatore percentuale:
  - Tipo: "Percentuale"
  - Valore: numero positivo o negativo (ad esempio +50, -25)
  - Interpretazione: aggiunge/sottrae una percentuale al prezzo base

- **R.PRICE.003:** Modificatore a valore fisso:
  - Tipo: "ValoreFixo"
  - Valore: importo in minima unita della valuta (ad esempio 1000 centesimi = €10)
  - Valuta: codice ISO (EUR, USD, ecc.)
  - Interpretazione: aggiunge/sottrae un importo fisso al prezzo

### Calcolo

- **R.PRICE.004:** Formula di calcolo del prezzo finale di una riga di vendita:
  ```
  prezzo_finale = (prezzo_base × (1 + Σ modificatori_percentuali)) + Σ modificatori_fissi
  arrotondamento alla minima unita della valuta
  ```

- **R.PRICE.005:** Modificatori percentuali sono applicati in ordine e sono cumulativi (si moltiplicano).

- **R.PRICE.006:** Modificatori a valore fisso sono applicati dopo i percentuali e sono additivi (si sommano).

- **R.PRICE.007:** L'ordine di applicazione dei modificatori deve essere documentato chiaramente.

- **R.PRICE.008:** Il prezzo finale non puo mai diventare negativo; se i modificatori lo porterebbero sotto zero, il prezzo finale e 0.

### Gestione e validazione

- **R.PRICE.009:** Ogni tag puo avere un solo modificatore di prezzo. Se l'utente vuole applicare piu modificatori, deve usare piu tag.

- **R.PRICE.010:** Modificatori percentuali e fissi possono coesistere nello stesso ordine di calcolo per prodotto/bundle, ma singolarmente per tag.

- **R.PRICE.011:** L'interfaccia di definizione modificatori deve mostrare l'effetto sul prezzo tramite preview.

## Default di categoria e override di prodotto

### Gerarchia di risoluzione

- **R.DEFAULT.001:** Quando un utente non ha scelto esplicitamente un tag per una categoria durante una vendita, la gerarchia di risoluzione del default e:
  1. Override del prodotto per quella categoria (se definito)
  2. Default della categoria (se definito)
  3. Nessun default (l'utente deve scegliere)

- **R.DEFAULT.002:** L'override del prodotto consente di impostare un default diverso da quello globale della categoria, ad esempio:
  - Categoria "Formato" ha default globale "A4"
  - Prodotto "Sketch" ha override "Formato" = "A5"
  - Conseguenza: "Sketch" mostra "A5" come predefinito, altri prodotti mostrano "A4"

### Definizione e gestione

- **R.DEFAULT.003:** L'utente deve poter definire il default della categoria globale quando crea o modifica la categoria.

- **R.DEFAULT.004:** L'utente deve poter definire il default del prodotto per ogni categoria associata al prodotto, durante la configurazione del prodotto.

- **R.DEFAULT.005:** Se un default e stato rimosso (es. il tag predefinito viene disattivato), il prodotto/categoria ritorna al default precedente o a nessun default.

## Campi liberi

### Configurazione a livello di tag

- **R.FREETEXT.001:** Un tag puo consentire un campo di testo libero tramite flag "consenti campo libero".

- **R.FREETEXT.002:** Se abilitato, il tag deve avere:
  - Etichetta personalizzabile (es. "Dimensioni personalizzate")
  - Placeholder personalizzabile (es. "es. 17x24 cm")
  - Validazioni future opzionali

- **R.FREETEXT.003:** Al momento della vendita, se l'utente sceglie un tag con campo libero, deve inserire un valore testuale.

### Configurazione a livello di prodotto

- **R.FREETEXT.004:** Un prodotto puo avere un valore libero suggerito per una categoria, indipendentemente dal tag scelto.

- **R.FREETEXT.005:** Esempio: Prodotto "Sketch", categoria "Formato", tag "Altro", valore suggerito "17x24 cm".

- **R.FREETEXT.006:** Il valore suggerito a livello di prodotto riduce la necessita di inserimento ripetitivo durante le vendite.

- **R.FREETEXT.007:** L'utente puo sovrascrivere il valore suggerito al momento della vendita.

## Associazione categorie ai prodotti

### Configurazione

- **R.ASSOC.001:** Ogni prodotto deve poter indicare quali categorie siano rilevanti per lui.

- **R.ASSOC.002:** L'associazione categoria-prodotto include:
  - Prodotto
  - Categoria
  - Ordinamento (per determinare l'ordine di presentazione)
  - Default opzionale del prodotto per quella categoria (override globale)
  - Stato (attivo/inattivo)

- **R.ASSOC.003:** Un prodotto puo utilizzare zero, una o piu categorie (nessuna categoria e valida se il prodotto non ha varianti).

- **R.ASSOC.004:** Un prodotto non puo utilizzare una categoria non associata a lui, anche se la categoria esiste globalmente.

- **R.ASSOC.005:** Un'associazione non attiva non viene presentata all'utente durante la vendita, ma rimane nei dati storici.

### Gestione dell'interfaccia

- **R.ASSOC.006:** Quando l'utente configura un prodotto, deve poter selezionare facilmente le categorie rilevanti.

- **R.ASSOC.007:** L'interfaccia deve mostrare categorie disponibili e consentire drag-and-drop o ordinamento per priorita.

- **R.ASSOC.008:** Per ogni categoria associata, deve essere possibile definire il default del prodotto visualmente.

## Bundle

### Definizione

- **R.BUNDLE.001:** Un bundle e un prodotto virtuale composto da uno o piu prodotti reali.

- **R.BUNDLE.002:** Un bundle ha i seguenti attributi:
  - Nome (obbligatorio)
  - Descrizione (opzionale)
  - Prezzo bundle opzionale (se non specificato, e calcolato dalla somma dei componenti)
  - Elenco di prodotti inclusi con quantita (almeno uno)
  - Categorie ereditate dai componenti
  - Override personalizzati opzionali
  - Stato (attivo/inattivo)

- **R.BUNDLE.003:** Un bundle inattivo non puo essere venduto, ma rimane nei dati storici.

- **R.BUNDLE.004:** Esempi di bundle:
  - "Fumetto + Sketch": 1 fumetto + 1 sketch
  - "Artist Pack": 1 sketchbook + 2 print A4
  - "Commissione dorata": 1 commissione privata + 1 scansione di alta qualita

### Composizione

- **R.BUNDLE.005:** La quantita di ogni prodotto in un bundle puo essere configurata (1, 2, 5, ecc.).

- **R.BUNDLE.006:** Un bundle puo contenere lo stesso prodotto piu volte (ad esempio, 2x "Print A4").

- **R.BUNDLE.007:** Nessun limite sul numero di prodotti in un bundle (prevista evoluzione con bundle annidati).

### Eredita di categorie

- **R.BUNDLE.008:** Un bundle eredita automaticamente tutte le categorie utilizzate dai prodotti che lo compongono.

- **R.BUNDLE.009:** Se due prodotti nel bundle usano la stessa categoria, la categoria appare una sola volta nel bundle (consolidamento).

- **R.BUNDLE.010:** Esempio:
  ```
  Fumetto utilizza: Tecnica
  Sketch utilizza: Formato, Tecnica
  Bundle "Fumetto + Sketch" eredita: Formato, Tecnica
  ```

- **R.BUNDLE.011:** Le categorie ereditate mantengono le stesse regole di selezione (singola/multipla) dal prodotto source (se piu prodotti la usano, priorita a multipla).

### Override di bundle

- **R.BUNDLE.012:** Un bundle puo definire personalizzazioni rispetto ai prodotti componenti:
  - Default tag differente dai prodotti originali
  - Valori liberi precompilati
  - Configurazioni specifiche aggiuntive

- **R.BUNDLE.013:** Esempio di override:
  ```
  Bundle "Fumetto + Sketch"
  Formato: Altro (override)
  Valore libero: "17x24 cm" (precompilato)
  ```

### Gerarchia di risoluzione bundle

- **R.BUNDLE.014:** La gerarchia di risoluzione per il default di una categoria in un bundle e:
  1. Override esplicito del bundle per quella categoria
  2. Default del prodotto per quella categoria (se bundle contiene un solo prodotto che ha questo default)
  3. Default della categoria globale
  4. Nessun default

- **R.BUNDLE.015:** Se il bundle contiene piu prodotti con default diversi della stessa categoria, non esiste un unico default; l'utente deve scegliere.

- **R.BUNDLE.016:** I default sono calcolati al momento della vendita, non memorizzati nel bundle (dinamici).

## Contabilizzazione bundle

### Registrazione

- **R.ACC.001:** Quando un bundle viene venduto, la vendita contribuisce alle statistiche dei prodotti reali che lo compongono.

- **R.ACC.002:** Una vendita di bundle deve registrare:
  - Identita del bundle
  - Data, quantita bundle, cliente, ricavo totale, metodo di pagamento
  - Configurazione scelta (categorie, tag, valori liberi)

- **R.ACC.003:** Conseguenza commerciale:
  ```
  Vendita: 1 Bundle "Fumetto + Sketch"
  
  Fumetto:
    - Incrementa conteggio vendite di 1
    - Incrementa quantita totale venduta di 1
    - Contribuisce al fatturato (logica di ripartizione da definire)
  
  Sketch:
    - Incrementa conteggio vendite di 1
    - Incrementa quantita totale venduta di 1
    - Contribuisce al fatturato (logica di ripartizione da definire)
  ```

### Ripartizione economica

- **R.ACC.004:** La logica di ripartizione del ricavo del bundle tra i prodotti componenti e soggetto a futura decisione:
  - Opzione A: proporzionale al prezzo base di ogni componente
  - Opzione B: uguale per tutti i componenti
  - Opzione C: configurabile per bundle
  - Opzione D: non ripartito, solo il ricavo totale del bundle e registrato

- **R.ACC.005:** La scelta di ripartizione deve essere esplicitamente documentata nel file CONFIG-ARCHITECTURE.md.

- **R.ACC.006:** I report devono mostrare chiaramente se un contributo al fatturato proviene da una vendita diretta o da un bundle.

## Configurabilita

### Principi

- **R.CONFIG.001:** Tutti gli elementi descritti sopra (categorie, tag, prodotti, bundle, prezzi, default, associazioni, campi liberi) devono essere completamente gestibili dall'utente.

- **R.CONFIG.002:** L'obiettivo e minimizzare la necessita di interventi tecnici per gestire nuove esigenze.

- **R.CONFIG.003:** Ogni scelta di configurazione deve poter essere modificata senza perdere i dati storici.

### Interfaccia di configurazione

- **R.CONFIG.004:** Deve esistere una sezione "Configurazione" o "Impostazioni" accessibile dall'interfaccia principale.

- **R.CONFIG.005:** La sezione di configurazione deve presentare aree distinte per:
  - Gestione categorie
  - Gestione tag
  - Gestione associazioni categoria-prodotto
  - Gestione bundle
  - Gestione default e override

- **R.CONFIG.006:** Ogni area di configurazione deve avere funzioni CRUD (Create, Read, Update, Delete) chiare e intuitive.

- **R.CONFIG.007:** Deve essere possibile un'esportazione della configurazione attuale e un'importazione di configurazioni salvate.

## Casi d'uso e flussi

### UC.001: Creazione di una categoria

**Attore:** Utente (artista, illustratore)

**Precondizioni:** Nessuna

**Flusso principale:**
1. Utente accede alla sezione "Configurazione > Categorie"
2. Clicca su "Nuova categoria"
3. Inserisce nome (obbligatorio), descrizione (opzionale)
4. Seleziona modalita di selezione (singola o multipla)
5. Salva

**Flusso alternativo (con default):**
6a. Durante la creazione, seleziona un tag come default (solo se la categoria ha gia tag)
7a. Salva

**Postcondizioni:** La categoria e creata e disponibile per l'associazione ai prodotti.

### UC.002: Creazione di tag per una categoria

**Attore:** Utente

**Precondizioni:** Categoria esistente

**Flusso principale:**
1. Utente accede a "Configurazione > Categorie > [Nome categoria] > Tag"
2. Clicca su "Nuovo tag"
3. Inserisce nome (obbligatorio), descrizione (opzionale), ordinamento
4. Opzionalmente: abilita "Consenti campo libero" e inserisce etichetta e placeholder
5. Opzionalmente: configura modificatore di prezzo (percentuale o valore fisso)
6. Salva

**Postcondizioni:** Il tag e creato e puo essere scelto durante le vendite.

### UC.003: Associazione di categorie a un prodotto

**Attore:** Utente

**Precondizioni:** Prodotto esistente, categorie create

**Flusso principale:**
1. Utente accede a "Catalogo > Prodotti > [Nome prodotto] > Configurazione"
2. Visualizza liste di categorie disponibili e categorie gia associate
3. Clicca su "Aggiungi categoria" e seleziona una categoria non ancora associata
4. Ordina le categorie tramite drag-and-drop
5. Per ogni categoria, opzionalmente: imposta un default di prodotto diverso dal default globale
6. Salva

**Postcondizioni:** Il prodotto utilizza le categorie configurate; durante le vendite, verranno presentate solo queste categorie.

### UC.004: Creazione di un bundle

**Attore:** Utente

**Precondizioni:** Almeno due prodotti esistenti

**Flusso principale:**
1. Utente accede a "Catalogo > Bundle"
2. Clicca su "Nuovo bundle"
3. Inserisce nome (obbligatorio), descrizione (opzionale)
4. Ricerca e seleziona il primo prodotto da includere
5. Specifica la quantita (default 1)
6. Clicca su "Aggiungi altro prodotto" e ripete per altri prodotti
7. Opzionalmente: inserisce un prezzo bundle; se non specificato, e calcolato dalla somma
8. Visualizza categorie ereditate dai componenti
9. Opzionalmente: definisce override di categoria (default diverso, valore libero precompilato)
10. Salva

**Postcondizioni:** Il bundle e creato e puo essere venduto. Le categorie ereditate sono immediatamente disponibili.

### UC.005: Vendita di un prodotto con categorie

**Attore:** Utente (durante una fiera o operazione di vendita)

**Precondizioni:** Prodotto con una o piu categorie associate

**Flusso principale:**
1. Utente accede a "Vendite > Nuova vendita" o interfaccia rapida
2. Seleziona il prodotto
3. L'interfaccia presenta le categorie associate al prodotto (in ordine)
4. Per ogni categoria:
   a. Se modalita singola: mostra radio button con i tag disponibili
   b. Se modalita multipla: mostra checkbox con i tag disponibili
   c. Mostra il default (da UC.001 o UC.003)
5. Se un tag ha campo libero, mostra input testuale con placeholder
6. Mostra preview del prezzo finale (base + modificatori)
7. Utente sceglie i tag (rispettando modalita) e inserisce valori liberi
8. Completa la vendita

**Postcondizioni:** La vendita e registrata con la configurazione scelta. Il prezzo finale e calcolato. Le statistiche del prodotto sono incrementate.

### UC.006: Vendita di un bundle

**Attore:** Utente

**Precondizioni:** Bundle creato

**Flusso principale:**
1. Utente accede a "Vendite > Nuova vendita"
2. Seleziona il bundle
3. L'interfaccia presenta le categorie ereditate dal bundle (in ordine)
4. Per ogni categoria, applica la gerarchia di risoluzione (UC.BUNDLE.002) per determinare il default
5. Utente sceglie i tag e inserisce valori liberi (come UC.005)
6. Mostra preview del prezzo del bundle (prezzo bundle o somma dei componenti, con modificatori)
7. Completa la vendita

**Postcondizioni:** La vendita di bundle e registrata. Le statistiche di tutti i prodotti componenti sono incrementate.

### UC.007: Modifica di una categoria

**Attore:** Utente

**Precondizioni:** Categoria esistente

**Flusso principale:**
1. Utente accede a "Configurazione > Categorie > [Nome categoria]"
2. Modifica nome, descrizione, modalita di selezione, default globale
3. Salva

**Postcondizioni:** La categoria e aggiornata. Le vendite storiche continuano a riferirsi alla categoria con i valori al momento della vendita. I prodotti/bundle che la usano vedono le modifiche.

### UC.008: Disattivazione di una categoria

**Attore:** Utente

**Precondizioni:** Categoria esistente, attiva

**Flusso principale:**
1. Utente accede a "Configurazione > Categorie > [Nome categoria]"
2. Cambia stato da "Attivo" a "Inattivo"
3. Salva

**Postcondizioni:** La categoria non e piu disponibile per nuove vendite. Prodotti/bundle che la usano non la presentano piu. Vendite storiche continuano a referire i tag storici della categoria.

## Dati di progetto esemplari

Categoria "Formato" (singola selezione):
- A3 (nessun modificatore)
- A4 (nessun modificatore, default globale)
- A5 (modificatore: -25%)
- Altro (consente campo libero)

Categoria "Tecnica" (selezione multipla):
- Matita (nessun modificatore)
- China (nessun modificatore)
- Acquerello (modificatore: +10%)
- Digitale (nessun modificatore)

Prodotto "Sketch":
- Categoria Formato (default override: A5)
- Categoria Tecnica (nessun override)

Prodotto "Fumetto":
- Categoria Tecnica (nessun override)

Bundle "Sketch + Fumetto":
- 1 Sketch + 1 Fumetto
- Eredita: Formato, Tecnica
- Override: Formato = "Altro" (precompilato "17x24 cm")
