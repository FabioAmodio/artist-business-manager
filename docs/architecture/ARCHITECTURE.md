# Architettura

> **Decisione prevalente:** l'architettura applicativa adotta Operazione come aggregate root per vendite, commissioni e prenotazioni. Le regole complete sono in [../business/OPERATIONS-DOMAIN-SPECIFICATION.md](../business/OPERATIONS-DOMAIN-SPECIFICATION.md).

## Obiettivo e principi

L'applicazione e una web app personale, offline-first e senza backend, per gestire l'attivita artistica e fumettistica: progetti, commissioni, lavori editoriali, fumetti, clienti, eventi, vendite, prodotti, spese, pagamenti, scadenze e report.

Principi architetturali:

- i dati appartengono all'utente e risiedono localmente;
- ogni funzione principale deve restare utilizzabile senza rete;
- la UI non conosce i dettagli di IndexedDB;
- le regole di dominio non dipendono da Angular o dal browser;
- le operazioni finanziarie devono essere ricostruibili dai record di origine;
- import ed export sono funzionalita di primo livello, non strumenti diagnostici;
- le cancellazioni di dati con valore storico sono logiche e non distruttive.

## Vincoli e decisioni tecnologiche

- **Framework:** Angular, ultima versione stabile disponibile al momento dell'implementazione.
- **Componenti:** standalone components; nessun NgModule applicativo salvo necessita degli strumenti.
- **Stato:** Signals per stato locale, stato di pagina e dati derivati; RxJS solo dove serve per integrazioni asincrone o stream esterni.
- **Persistenza:** IndexedDB tramite Dexie.
- **Backend:** assente. Nessun dato operativo dipende da una chiamata remota.
- **PWA:** service worker per shell, asset statici e aggiornamenti controllati.
- **Deploy:** GitHub Pages come hosting statico.
- **Lingua e formati:** date di sistema mostrate secondo le impostazioni dell'utente; istanti tecnici in ISO 8601 UTC; importi monetari in interi nella minima unita della valuta.

## Struttura delle cartelle

La struttura prevista separa codice applicativo, dominio e strumenti di persistenza. I nomi sono indicativi, ma i confini devono restare riconoscibili:

```text
src/
        app/
                core/
                        config/                 configurazione runtime e ambiente
                        navigation/             route e guardie di navigazione
                        persistence/            database Dexie, migrazioni e transazioni
                        services/               servizi applicativi condivisi
                        ui/                     componenti visuali riutilizzabili
                domain/
                        models/                 entita, value object e tipi di dominio
                        rules/                  validazioni e transizioni di stato
                        repositories/           contratti dei repository
                        queries/                contratti e risultati delle query
                application/
                        dashboard/              facade e casi d'uso della dashboard
                        works/                  progetti, commissioni ed editoriale
                        comics/                 serie, volumi, episodi e tavole
                        contacts/               clienti, editori e fornitori
                        events/                 eventi, fiere e logistica
                        catalog/                prodotti, varianti e magazzino
                        sales/                  vendite e incassi
                        finance/                spese, pagamenti e scadenze
                        data-management/        import, export e diagnostica
                features/
                        ...                     pagine e componenti standalone per feature
                app.routes.ts             composizione delle route
                app.config.ts             bootstrap e provider Angular
        assets/                     icone, manifest e risorse statiche
        styles/                     token e stili globali
        environments/               configurazioni di build
public/                       file pubblici necessari al deploy
docs/                         decisioni, dominio e flussi
```

Le feature possono contenere componenti, facade locali e route, ma non devono importare direttamente adapter Dexie. Gli elementi in `core` sono condivisi e privi di logica specifica di una sola schermata.

## Suddivisione per feature

- **Dashboard:** scadenze, lavori aperti, prossimi eventi, incassi, spese e indicatori sintetici.
- **Lavori:** Operazioni di tipo commissione privata o lavoro editoriale; brief, fasi, revisioni, consegne, compensi e pagamenti.
- **Fumetti:** serie, volumi, episodi, tavole e fasi di produzione.
- **Contatti:** clienti, editori, fornitori, contatti e storico delle relazioni.
- **Eventi:** fiere e altri eventi, date, luogo, stand, costi, inventario portato e vendite associate.
- **Catalogo:** prodotti, varianti, prezzi, SKU, soglie e movimenti di magazzino.
- **Vendite:** transazioni, righe di vendita, canali, metodi di pagamento e incassi.
- **Finanza:** spese, compensi, pagamenti, scadenze, categorie e report.
- **Gestione dati:** export, import, backup, rilevamento conflitti e stato della base locale.
- **Impostazioni:** valuta predefinita, categorie, preferenze di visualizzazione e configurazione PWA.

Ogni feature espone una superficie orientata al caso d'uso. Modelli, repository e query condivisi restano nel layer appropriato invece di essere duplicati tra feature.

## Responsive, mobile first e accessibilita

La UI deve essere progettata mobile first: smartphone e il vincolo iniziale per gerarchia dei contenuti, azioni primarie, densita e gestione degli errori. Desktop e tablet aggiungono spazio e colonne, ma non introducono un modello d'interazione incompatibile.

### Breakpoint e layout

- **Smartphone:** una colonna, navigazione compatta, azioni primarie sempre raggiungibili e liste con dettaglio apribile senza perdere il contesto.
- **Tablet:** layout a una o due colonne, pannelli affiancati quando lo spazio lo consente e tabelle trasformabili in righe leggibili.
- **Desktop:** sidebar e viste affiancate, tabelle dense e dashboard multi-colonna, mantenendo gli stessi comandi e la stessa gerarchia.

I breakpoint sono conseguenza del contenuto e non di dispositivi specifici. Ogni feature deve avere vincoli dimensionali stabili per toolbar, filtri, celle, card ripetute e aree di dettaglio, evitando salti di layout.

### Touch friendly UX

Le azioni usate durante una fiera devono essere raggiungibili con una mano: target touch ampi, spaziatura sufficiente, feedback immediato e conferme solo per azioni distruttive. Inserimento vendita, commissione, ricerca prodotto, ricerca cliente e consultazione scadenze devono richiedere il minor numero possibile di passaggi.

### Accessibilita

La shell e le feature devono rispettare HTML semantico, ordine di focus, navigazione da tastiera, nomi accessibili per icone e controlli, contrasto adeguato e messaggi di errore annunciabili. Colore, icone o gesture non possono essere l'unico modo per comunicare stato o risultato.

### Convention Mode

La UI deve prevedere una futura Convention Mode, ottimizzata per l'uso ripetitivo durante fiere e convention. E un profilo di presentazione e interazione, non un secondo dominio: usa gli stessi casi d'uso e dati, ma riduce navigazione, testo non essenziale e passaggi per vendita, commissione, inventario, cliente e scadenza. La modalita deve poter essere attivata senza perdere filtri, contesto dell'evento o stato del salvataggio locale.

### Dark mode

Il tema chiaro resta il default iniziale, ma colori, superfici, bordi e stati devono essere definiti tramite token semantici. La struttura deve consentire un futuro dark mode basato su preferenza di sistema e scelta manuale, senza hardcode cromatici nei componenti feature.

## Modalita fiera

La modalita fiera e un contesto operativo automatico, attivo quando la data corrente e compresa tra inizio e fine della fiera, estremi inclusi. Deve privilegiare velocita e leggibilita offline:

- inserimento rapido di una vendita con prodotto, quantita e metodo di pagamento;
- inserimento rapido di una commissione con contatto, brief minimo e canale;
- consultazione immediata dell'inventario e delle soglie;
- ricerca e consultazione dei clienti senza navigazioni profonde;
- elenco delle scadenze imminenti e dei lavori urgenti;
- operazioni ripetibili senza perdita del contesto dell'evento;
- feedback chiaro di salvataggio locale e stato offline.

Le viste complete desktop e le azioni rapide mobile devono chiamare gli stessi casi d'uso application. Non si deve creare una seconda logica per la modalita fiera.

## Offline first UX

Offline first non significa soltanto avere IndexedDB: ogni comando locale deve comunicare chiaramente se e stato salvato, se il dato e incompleto o se richiede una successiva verifica. La UI deve mostrare stato dati locali, ultimo export, disponibilita del database e stato di aggiornamento della PWA.

Le operazioni locali non devono essere disabilitate quando la rete manca. Le funzioni future dipendenti dal cloud devono avere stato `non disponibile offline` separato da errore di persistenza locale.

## Evoluzione cloud

Una futura sincronizzazione cloud deve essere considerata un'evoluzione, non una dipendenza dello schema iniziale. I dati locali devono mantenere identificativi stabili, timestamp di modifica, origine della modifica e informazioni sufficienti per rilevare conflitti. Prima di introdurla saranno necessari decisioni dedicate su identita, autorizzazione, merge, risoluzione conflitti, cifratura e privacy.

## Concetti di opportunita e classificazione

Il dominio puo evolvere oltre i lavori gia accettati introducendo:

- **Opportunity:** richiesta, contatto o possibile incarico non ancora trasformato in preventivo o lavoro. Deve poter conservare fonte, canale, valore stimato, prossimo passo e stato senza essere confusa con una commissione.
- **Tag:** etichetta libera o controllata applicabile a piu tipi di entita per ricerca e classificazione. Non sostituisce stato, categoria o canale.
- **WorkType:** classificazione del tipo di lavoro, ad esempio commissione privata, editoriale, fumetto, illustrazione o altro. Non e lo stato operativo e non e il canale.

Questi concetti devono restare separati dalle entita storiche dell'Excel e introdotti nel domain solo dopo una decisione sul loro ciclo di vita.

## Evoluzione verso Work unificato

Commissione privata e lavoro editoriale condividono ciclo operativo, scadenze, consegne e valori economici. Una possibile evoluzione e introdurre un concetto `Work` unificato con `WorkType` e profili specifici, mantenendo:

- una parte comune per titolo, Party, canale, stato, scadenze, consegne e finanza;
- dettagli specifici per commissione, editoriale o produzione fumetto;
- compatibilita con i workflow esistenti e con i riferimenti storici;
- separazione tra `Work` accettato e `Opportunity` ancora potenziale.

Questa e una direzione architetturale, non una richiesta di unificazione immediata del modello dati.

## Dashboard strategica

La Dashboard e il punto di ingresso e di controllo dell'applicazione. Non e una semplice pagina di riepilogo: deve aiutare l'artista a decidere dove intervenire, quali opportunita seguire e quali impegni economici od operativi richiedono attenzione.

Il periodo predefinito e l'anno corrente, con selettori per periodo personalizzato e confronto con il periodo precedente. Ogni indicatore deve mostrare la propria definizione, il periodo usato e il collegamento ai record di origine.

Indicatori principali:

- entrate dell'anno corrente;
- uscite dell'anno corrente;
- risultato netto, calcolato come entrate meno uscite secondo la definizione temporale scelta;
- scadenze imminenti e scadenze gia scadute;
- lavori in ritardo rispetto alle relative scadenze;
- clienti principali per entrate, lavori o valore concordato;
- eventi piu redditizi, con ricavi, costi e margine;
- prodotti piu venduti per quantita e fatturato;
- compensi da incassare;
- acconti da ricevere secondo preventivi o accordi non ancora coperti.

La Dashboard deve distinguere dati effettivi da dati previsti: un preventivo o un compenso concordato non entra nelle entrate fino alla registrazione dell'incasso. I widget economici devono inoltre rendere distinguibili importo fatturabile, importo incassato e residuo da ricevere.

Le sezioni devono essere componibili e degradare con eleganza quando non esistono dati. Le interrogazioni aggregate passano dal ReportingService e non replicano logica finanziaria nei componenti visuali. Ogni risultato deve poter aprire la vista filtrata dei record che lo compongono.

Il Canale e una dimensione trasversale della Dashboard: commissioni, progetti, clienti, eventi e vendite possono essere analizzati per origine, ad esempio Fiera, Instagram, Sito web, Editore o Passaparola. Questo consente di confrontare quali canali generano piu clienti, lavoro e fatturato nel tempo.

## Layer: domain, application, infrastructure

### Domain

Il layer domain descrive il significato dei dati e le regole indipendenti dal framework:

- entita e aggregate, con identificativi stabili;
- value object per importi, intervalli di date, stati e riferimenti;
- regole per transizioni di stato, totali, disponibilita e validazione;
- contratti dei repository e risultati delle query;
- errori di dominio distinguibili dagli errori tecnici.

Il domain non importa Angular, Dexie, API del browser o componenti UI. Non contiene side effect e deve essere testabile con test unitari ordinari.

### Application

Il layer application coordina i casi d'uso e traduce il dominio in stato consumabile dalla UI:

- facade per feature;
- comandi di creazione, modifica, archiviazione e completamento;
- query per liste, dettagli, dashboard e report;
- gestione di loading, errori, filtri e selezione corrente tramite Signals;
- orchestrazione di operazioni che coinvolgono piu aggregate.

Le facade validano l'intento dell'utente, invocano le regole domain e chiamano i repository tramite interfacce. Non devono contenere query Dexie o manipolazione diretta del DOM.

### Infrastructure

Il layer infrastructure implementa i contratti tecnici:

- database Dexie e schema IndexedDB;
- repository persistenti;
- serializzazione e validazione del formato di backup;
- gestione Blob e File System API quando disponibili;
- service worker, manifest e rilevamento aggiornamenti;
- adapter per download, selezione file e informazioni sul browser.

L'infrastructure puo dipendere dal framework e dal browser; domain e application no. Il bootstrap Angular collega le interfacce ai provider concreti.

## Servizi applicativi

Servizi condivisi previsti:

- **WorkspaceService:** inizializzazione dell'app, readiness del database e stato globale di errore.
- **DateService:** normalizzazione delle date, confronto dei giorni e conversione tra data di calendario e istante UTC.
- **MoneyService:** importi interi, arrotondamenti espliciti, somme e formattazione per valuta.
- **TaskService:** creazione, aggiornamento e interrogazione delle scadenze con origine e priorita.
- **WorkService:** casi d'uso comuni a progetto, commissione ed editoriale.
- **InventoryService:** movimenti, disponibilita calcolata, soglie e rettifiche.
- **ReportingService:** aggregazioni per periodo, cliente, lavoro, evento, canale e categoria.
- **ImportExportService:** validazione, anteprima, conflitti e applicazione transazionale dei backup.
- **AttachmentService:** registrazione dei metadati, lettura, download e rimozione degli allegati.
- **PwaUpdateService:** stato del service worker, disponibilita aggiornamenti e riavvio controllato.
- **SettingsService:** preferenze e configurazioni non sensibili dell'utente.

I servizi devono avere responsabilita singole. Una facade puo coordinarne piu di uno per un caso d'uso, ma non deve diventare un contenitore globale di logica.

## Stato e flusso dati

Il flusso standard e:

1. la UI invia un comando alla facade;
2. la facade valida input e autorizzazione funzionale;
3. un servizio applicativo invoca le regole domain;
4. il repository esegue la lettura o la scrittura;
5. la facade aggiorna Signals locali e dati derivati;
6. la UI riflette lo stato `idle`, `loading`, `ready` o `error`.

Le viste aggregate, come totali e scadenze, sono calcolate dai dati persistiti. Non si mantengono contatori duplicati senza una procedura di ricostruzione. Le scritture finanziarie devono essere idempotenti rispetto a un identificativo di operazione quando un comando puo essere ripetuto.

## Gestione Dexie

Dexie e confinato a un adapter di infrastructure. Una classe database centralizza nome del database, tabelle, versione e migrazioni. I repository convertono i record Dexie in modelli domain e viceversa.

Regole operative:

- una tabella per ogni aggregate principale;
- tabelle separate per righe, movimenti e relazioni molti-a-molti quando servono query o storico indipendente;
- indici solo per filtri realmente usati, ad esempio `id`, date, stato, riferimenti e SKU;
- letture paginate o limitate per liste estese;
- transazioni Dexie per operazioni multi-tabella, come vendita piu movimenti di magazzino;
- cancellazione logica per vendite, pagamenti, spese e record con valore storico;
- `createdAt`, `updatedAt` e identificativo stabile su ogni record persistito;
- apertura del database e migrazioni eseguite prima di rendere l'app pronta;
- errori di quota, versione bloccata o indisponibilita IndexedDB esposti come stato comprensibile all'utente.

Le migrazioni devono essere additive o trasformative in modo esplicito, testate su dati rappresentativi e accompagnate da una versione dello schema. Non si modifica manualmente lo schema in produzione senza aggiornare la sequenza Dexie.

## Strategia IndexedDB

IndexedDB e la fonte di verita locale. La cache del service worker contiene risorse applicative, non dati di dominio.

Ogni record deve usare un identificativo interno stabile e riferimenti espliciti. I riferimenti orfani sono rifiutati in scrittura o segnalati durante la validazione; non devono essere risolti silenziosamente. I dati derivati, come margini e avanzamento, vengono ricalcolati quando richiesti o ricostruiti dopo import.

L'app deve gestire:

- database non ancora inizializzato;
- browser privato o IndexedDB non disponibile;
- quota esaurita;
- concorrenza tra piu tab della stessa app;
- aggiornamento dello schema mentre un'altra tab e aperta;
- reset locale esplicito preceduto da un export.

Per la concorrenza tra tab, l'app rileva version change e chiede di ricaricare quando necessario. Non si tenta una sincronizzazione automatica tra dispositivi: senza backend, l'export/import e il meccanismo deliberato di trasferimento.

## Strategia import/export

Il formato di backup e un archivio versionato con metadati, versione formato, versione schema, impostazioni, record di dominio e allegati. Il formato iniziale consigliato e JSON UTF-8 con allegati separati o codificati in modo esplicito, evitando ambiguita sui Blob.

### Export

L'export completo legge tutte le tabelle in modo coerente, include i record archiviati e registra data, versione app e valuta. L'utente puo scaricare un backup completo; eventuali export parziali devono essere dichiarati come tali e non confusi con un ripristino completo.

Prima di azioni invasive l'app propone un export e mostra la data dell'ultimo backup. Un export fallito non aggiorna quella data.

### Import

Il percorso e sempre a fasi:

1. leggere il file senza modificare il database;
2. verificare firma logica, versione e struttura;
3. validare tipi, identificativi, date, importi e riferimenti;
4. verificare duplicati e conflitti con i dati correnti;
5. mostrare riepilogo, avvisi e scelta della politica di conflitto;
6. creare una copia di sicurezza dei dati correnti;
7. applicare la sostituzione o fusione in una transazione;
8. ricostruire indici e dati derivati;
9. registrare esito, versione e data dell'operazione.

La politica predefinita deve essere conservativa: nessuna sovrascrittura silenziosa. I formati precedenti sono supportati da migratori espliciti oppure rifiutati con un errore azionabile.

## Strategia allegati

Gli allegati possono essere ricevute, brief, contratti, bozze o file di consegna. Non sono inseriti direttamente nei modelli domain: un record allegato contiene metadati e un riferimento al contenuto.

Per la prima versione, il contenuto binario viene conservato in IndexedDB, in una tabella dedicata, mentre i record di dominio conservano solo l'identificativo dell'allegato. Ogni allegato deve avere:

- identificativo stabile;
- nome originale e tipo MIME;
- dimensione e checksum;
- data di aggiunta;
- riferimento all'entita proprietaria;
- eventuale stato di importazione o errore.

Gli allegati sono inclusi nell'export completo. Per file grandi, l'app deve mostrare limiti di quota e dimensione prima della scrittura; non deve lasciare un record metadata senza contenuto. La rimozione deve eliminare metadata e contenuto nella stessa transazione, salvo conservazione richiesta dallo storico.

Una futura integrazione con File System Access API puo offrire riferimenti a file esterni, ma non deve diventare il formato predefinito: un riferimento esterno non garantisce portabilita del backup.

## Strategia PWA e offline

La PWA installa una shell Angular con manifest, icone, service worker e risorse statiche versionate. Il service worker deve precaricare la shell minima e cacheare le risorse necessarie alle route principali; IndexedDB resta responsabile dei dati applicativi.

Comportamento previsto:

- dopo il primo caricamento, dashboard e feature gia visitate funzionano offline;
- la UI mostra lo stato online/offline senza bloccare le operazioni locali;
- una modifica locale viene salvata in IndexedDB prima di essere considerata riuscita;
- gli aggiornamenti del bundle sono rilevati e proposti con un'azione esplicita;
- un aggiornamento non interrompe una modifica o una transazione in corso;
- in caso di cache corrotta e disponibile una procedura di aggiornamento o reset della cache, senza cancellare automaticamente IndexedDB.

Non viene introdotta una coda di sincronizzazione remota finche non esiste un backend. Le funzionalita che richiedono rete devono essere opzionali e fallire con un messaggio chiaro.

## Strategia GitHub Pages

GitHub Pages serve file statici e non fornisce un backend applicativo. La pipeline di deploy deve:

1. installare dipendenze in modo riproducibile;
2. eseguire test, lint e build di produzione;
3. impostare il base href coerente con il nome del repository;
4. pubblicare gli artefatti nella directory prevista da GitHub Pages;
5. conservare manifest, service worker e asset con percorsi relativi corretti;
6. verificare una route iniziale e il caricamento offline dopo il deploy.

Per il routing si sceglie una strategia compatibile con l'hosting statico: preferibilmente hash routing se non viene configurato un fallback affidabile. Le route devono funzionare sia da navigazione interna sia dopo un refresh diretto su GitHub Pages.

Il deploy non deve contenere token, dati personali, database esportati o configurazioni segrete. Il repository contiene soltanto codice e asset pubblicabili; i dati dell'utente restano nel browser.

## Architettura di configurabilita

La configurabilita e un principio fondamentale dell'applicazione: l'utente deve poter modificare categorie, tag, prodotti, bundle, prezzi e default senza interventi tecnici.

### Livelli di configurazione

**Livello 1: Globale (Workspace)**

Configurazioni valide per l'intero workspace dell'utente:

- Valuta predefinita
- Data system (fuso orario, formato data)
- Categorie e tag globali
- Default globali di categoria

**Livello 2: Prodotto**

Configurazioni specifiche di ogni prodotto:

- Categorie associate al prodotto
- Override di default della categoria per quel prodotto
- Prezzo base del prodotto
- Valore libero suggerito

**Livello 3: Bundle**

Configurazioni specifiche di ogni bundle:

- Composizione (prodotti e quantita)
- Categorie ereditate
- Override di categoria per il bundle
- Prezzo bundle (opzionale)

**Livello 4: Transazione (Runtime)**

Scelte fatte dall'utente durante una vendita:

- Tag scelti per ogni categoria
- Valori liberi inseriti
- Prezzo finale calcolato

### Persistenza della configurazione

Tutte le configurazioni sono persistite in IndexedDB tramite tabelle Dexie:

- `categories` - categorie globali
- `tags` - tag di ogni categoria
- `products` - prodotto anagrafica
- `productCategories` - associazione categoria-prodotto
- `bundles` - bundle anagrafica
- `bundleComponents` - composizione del bundle
- `bundleOverrides` - personalizzazioni di categoria nel bundle

Le migrazioni Dexie devono gestire l'aggiunta di nuove colonne senza perdere dati storici.

### Interfaccia di configurazione

Sezione "Configurazione" o "Impostazioni" accessibile dal menu principale, con sottosezioni:

- **Categorie e tag:** CRUD per categorie e tag
- **Prodotti:** CRUD per prodotti e loro associazioni a categorie
- **Bundle:** CRUD per bundle
- **Default globali:** configurazione di default per categoria
- **Impostazioni workspace:** valuta, data system, preferenze UI

Ogni pagina di configurazione deve offrire:

- Vista elenco con ordinamento e filtro
- Dettaglio con modulo di modifica
- Pulsanti Aggiungi, Modifica, Elimina (logico), Ripristina (se applicabile)
- Validazioni in tempo reale
- Undo/Redo o almeno conferma prima di operazioni distruttive

### Validazione della configurazione

Prima di salvare una configurazione, il sistema deve validare:

1. Identificativi unici (non duplicati)
2. Integrità referenziale (nessun riferimento orfano)
3. Coerenza (es: un prodotto non puo usare una categoria disattivata)
4. Regole di business (es: prezzo non negativo)

Errori di validazione devono bloccare il salvataggio e mostrare messaggi chiari e azionabili.

## Architettura di theming e design token

L'interfaccia deve supportare temi multipli e una gerarchia di variabili CSS per minimizzare il hardcode di colori e stili nei componenti.

### Struttura di file

```
src/styles/
├── global/
│   ├── design-tokens.css      # Definizione variabili CSS globali
│   ├── typography.css          # Stili tipografici base (h1-h6, p, code)
│   ├── reset.css               # Reset e normalizzazione
│   └── common.css              # Classi utility e comuni
├── themes/
│   ├── light-theme.css         # Light Mode (default)
│   ├── dark-theme.css          # Dark Mode
│   ├── artist-theme.css        # Tema Artist
│   └── custom-theme.css        # Template per temi custom
└── components/
    └── [componenti senza hardcode colore]
```

### Variabili CSS globali

In `design-tokens.css`, definire variabili per:

- **Colore:** primari, secondari, stati, sfondo, bordi, testo
- **Tipografia:** font family, dimensioni, weight, line-height
- **Spaziatura:** scale di 4px (--space-1 = 4px, --space-4 = 16px)
- **Elevazione:** ombre a piu livelli
- **Border radius:** per angoli arrotondati coerenti

**Esempio:**
```css
:root {
  /* Colori primari */
  --color-primary-cyan: #0B8FA0;
  --color-primary-magenta: #C41D7F;
  
  /* Spaziatura */
  --space-4: 1rem;
  --space-6: 1.5rem;
  
  /* Tema */
  --theme-bg-primary: var(--color-bg-light);
  --theme-text-primary: var(--color-text-dark);
}
```

### Tema Light (default)

In `light-theme.css`, sovrascrivere le variabili di tema:

```css
:root,
[data-theme="light"] {
  --theme-bg-primary: #FFFFFF;
  --theme-text-primary: #2C2C2C;
  --theme-border: #DEE2E6;
}
```

### Tema Dark

In `dark-theme.css`:

```css
[data-theme="dark"] {
  --theme-bg-primary: #1E1E1E;
  --theme-text-primary: #E5E5E5;
  --theme-border: #404040;
}
```

### Tema Artist

In `artist-theme.css`, utilizzare la palette CMYK piena:

```css
[data-theme="artist"] {
  --theme-primary: #C41D7F;
  --theme-accent: #0B8FA0;
  --theme-highlight: #F5C614;
}
```

### Selezione e persistenza del tema

1. **Utente accede a Impostazioni > Tema**
2. **Sceglie tra:** Light, Dark, Artist, Segui sistema
3. **Salva in IndexedDB** (`settings.theme = 'dark'`)
4. **App applica** `document.documentElement.setAttribute('data-theme', 'dark')`
5. **CSS selector** `[data-theme="dark"]` attiva il tema

Inoltre, il browser `prefers-color-scheme` puo essere usato per default iniziale:

```javascript
// Detect preferenza di sistema
if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
  setTheme('dark');
}
```

### Linee guida per componenti

Ogni componente deve usare variabili CSS, mai hardcode:

**Vietato:**
```css
/* ❌ Hardcode */
.button {
  background-color: #0B8FA0;
  color: #FFFFFF;
}
```

**Consentito:**
```css
/* ✅ Variabili */
.button {
  background-color: var(--theme-primary);
  color: var(--theme-text-inverse);
}
```

### Supporto dark mode nel design

Quando si progetta un componente, considerare:

- Contrasto leggibile in light e dark
- Ombre che rimangono visibili (possono scomparire in dark se non regolate)
- Bordi che rimangono visibili (border-light puo scomparire su background scuro)
- Icone e immagini che potrebbero necessitare inversione o variante

## Sicurezza, affidabilita e limiti

- Nessun segreto o token deve essere incluso nel bundle o nei backup senza una decisione esplicita.
- L'app mostra la data dell'ultimo export e avverte che la cancellazione dei dati del browser puo eliminare il database locale.
- Le operazioni distruttive richiedono conferma e spiegano l'impatto sullo storico.
- Il contenuto degli allegati viene trattato come dato utente e non viene inviato in rete.
- Errori di persistenza, quota e import non devono lasciare dati parziali.
- Report e totali indicano se usano data dell'operazione, data di competenza o data del pagamento.

## Test e qualita

La copertura minima prevista comprende test domain per transizioni e totali, test dei repository e delle migrazioni Dexie, test di import/export con conflitti e allegati, test delle facade e test end-to-end dei flussi commissione, evento/vendita e avvio offline.

Ogni release deve verificare anche il build con base href di GitHub Pages, il refresh diretto di una route e la presenza del service worker in produzione.

## Evoluzione

Le regole di dominio, lo schema Dexie e il formato di backup sono contratti. Ogni modifica incompatibile richiede migrazione esplicita, test di compatibilita e aggiornamento della documentazione. Backend, autenticazione o sincronizzazione cloud sarebbero un'evoluzione architetturale separata e non un prerequisito implicito dell'app offline.
