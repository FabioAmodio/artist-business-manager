# Revisione architetturale post-bootstrap

> **Review storica precedente all'implementazione delle feature.** Le osservazioni su route placeholder, Dexie vuoto e assenza di repository descrivono lo stato iniziale e risultano chiuse o superate. Per lo stato corrente vedere `IMPLEMENTATION-STATUS.md`.

## Perimetro

La revisione confronta la struttura Angular attuale con:

- `docs/architecture/ARCHITECTURE.md`;
- `docs/architecture/DECISIONS.md`;
- `docs/business/DATA-MODEL.md`;
- `docs/business/WORKFLOWS.md`;
- `docs/business/TERMINOLOGY.md`;
- `docs/business/REPORTING-REQUIREMENTS.md`.

La revisione considera solo bootstrap, struttura e documentazione. Non introduce feature di business, schermate operative, modello dati completo o logica applicativa.

## Stato sintetico

| Area | Stato | Valutazione |
|---|---|---|
| Angular standalone | Conforme | Workspace Angular 22 con bootstrap standalone |
| Routing | Parzialmente conforme | Route presenti e lazy, ma tutte puntano a un placeholder condiviso |
| Shell applicativa | Parzialmente conforme | Header, sidebar, navigazione responsive e outlet presenti |
| Organizzazione layer | Parzialmente conforme | Cartelle iniziali presenti, ma application/infrastructure non ancora popolate |
| Dexie bootstrap | Parzialmente conforme | Database versionato e vuoto, nessuna tabella di dominio |
| IndexedDB strategy | Documentata | Non ancora verificabile su repository, migrazioni e gestione errori |
| PWA | Non conforme allo stato documentato | Mancano manifest applicativo e service worker Angular configurato |
| Servizi condivisi | Non conforme allo stato documentato | Esiste solo il provider del database; facade e servizi applicativi non esistono |
| Responsive/mobile first | Parzialmente conforme | Shell adattiva, ma non ancora verificata sulle feature e senza token responsive condivisi |
| Accessibilita | Parzialmente conforme | Semantica di base e aria-label presenti; mancano test e criteri globali verificabili |
| Dark mode | Predisposto a livello documentale | Non implementato, correttamente fuori dallo scope bootstrap |
| Cloud futuro | Conforme a livello documentale | La direzione e separata dal nucleo offline |

## Problemi rilevati

### P1 - PWA non configurata

`package.json` non include `@angular/service-worker` e `angular.json` non configura il service worker o un manifest applicativo. La documentazione descrive una PWA, ma il progetto corrente distribuisce soltanto una normale applicazione Angular.

**Rischio:** il requisito offline della shell, l'installabilita e la gestione degli aggiornamenti non sono verificabili in produzione.

**Raccomandazione:** aggiungere la configurazione PWA in una modifica dedicata, con manifest, icone, service worker, strategie di cache e verifica su build di produzione. Non introdurre la sincronizzazione dati nel service worker.

### P1 - Nessun confine applicativo implementato

Esistono `core/persistence`, `domain/shared` e `features/placeholder`, ma non esistono ancora facade, use case service, contratti repository o adapter separati. Il bootstrap Dexie viene iniettato direttamente tramite `AppDatabase`.

**Rischio:** le future feature potrebbero accedere direttamente a Dexie o concentrare regole di dominio nei componenti, violando i layer documentati.

**Raccomandazione:** prima della prima feature reale, definire i contratti minimi di domain e application e un adapter infrastructure, senza modellare ancora tutte le entita.

### P1 - Database vuoto senza verifica di readiness/errori

`AppDatabase` apre un database Dexie con `stores({})`, ma non espone uno stato Signals di readiness, quota, errore di apertura o versione incompatibile. La proprietà `placeholder` e solo un tipo dichiarato e non una tabella reale.

**Rischio:** l'app puo fallire in modo non guidato su browser privato, quota esaurita, IndexedDB non disponibile o cambi di versione tra tab.

**Raccomandazione:** introdurre un servizio di bootstrap/readiness e testare gli errori infrastrutturali prima di aggiungere tabelle di dominio.

### P2 - Routing ancora dimostrativo

Le route `dashboard`, `works`, `events`, `catalog`, `finance` e `data` esistono e sono lazy, ma caricano lo stesso `PlaceholderPage`. Non esistono route figlie o confini feature reali.

**Rischio:** la navigazione puo mascherare l'assenza di composizione per feature e rendere difficile definire layout specifici senza rifattorizzare.

**Raccomandazione:** mantenere il placeholder fino all'avvio delle feature, quindi sostituirlo progressivamente con route feature-locali e facade dedicate. Non creare schermate operative nello scaffold.

### P2 - Responsive non ancora dimostrato sulle feature

La shell usa una griglia desktop e una navigazione orizzontale su viewport strette. Non esistono ancora dashboard, vendite, commissioni, clienti, scadenze o catalogo da verificare su smartphone e tablet.

**Rischio:** la prima feature reale potrebbe richiedere una riprogettazione se nasce come tabella desktop o se le azioni rapide non sono previste nel contratto application.

**Raccomandazione:** adottare mobile first come criterio di accettazione per ogni feature: layout a una colonna, target touch, azione primaria, stato vuoto/errore, filtri comprimibili e passaggio a pannelli o tabella solo quando lo spazio lo permette.

### P2 - Offline UX incompleta

La shell mostra un'etichetta statica `Dati locali`, ma non esiste ancora un servizio che distingua online/offline, database pronto, ultimo export, aggiornamento PWA e indisponibilita di una futura funzione cloud.

**Rischio:** l'utente potrebbe interpretare un'indicazione visiva come conferma che il salvataggio locale sia riuscito.

**Raccomandazione:** definire stati UX distinti per rete, persistenza locale e aggiornamento applicativo prima di implementare i comandi delle feature.

### P3 - Font esterno in conflitto con offline first

`src/styles.css` importa font da Google Fonts. In assenza di rete, il font puo non essere disponibile; inoltre la shell dipende da una risorsa esterna non inclusa nel bundle.

**Rischio:** resa visiva non deterministica offline e richiesta di rete non necessaria.

**Raccomandazione:** usare font locali o una strategia di asset versionati e verificare la resa senza rete. La scelta deve restare coerente con il requisito PWA.

### P3 - Accessibilita e tema non formalizzati nei contratti UI

La shell usa landmark e un'etichetta accessibile per il brand, ma non esistono ancora regole condivise per focus, contrasto, annunci di errori, riduzione movimento, dimensioni touch e dark mode.

**Rischio:** ogni feature potrebbe introdurre soluzioni diverse e non verificabili.

**Raccomandazione:** aggiungere una checklist UI condivisa e test automatici/manuali per tastiera, contrasto, viewport e preferenze di contrasto/tema.

## Conformita ai requisiti architetturali

### Conforme

- Angular standalone e bootstrap con `bootstrapApplication`;
- router Angular e route lazy con redirect iniziale;
- shell separata dal contenuto tramite `router-outlet`;
- Dexie confinato a `core/persistence`;
- database locale senza tabelle di business;
- tipi condivisi minimi in `domain/shared`;
- documentazione di layer, import/export, allegati, Dashboard e Work futuro;
- definizioni di Party, Opportunity, Tag e WorkType allineate alla terminologia;
- responsive e modalita fiera definite come vincoli architetturali, non come feature gia implementate.

### Parzialmente conforme

- la cartella prevista per `application` non e ancora presente nel workspace effettivo;
- la cartella `infrastructure` e rappresentata solo dal bootstrap persistence;
- Signals sono usati dai tipi e dalla documentazione, ma non esiste ancora stato applicativo reale;
- la shell e responsive, ma non e ancora mobile first verificata su workflow reali;
- accessibilita e dark mode sono requisiti documentati, non funzionalita implementate;
- il routing e strutturale, non ancora organizzato per feature concrete.

### Non conforme

- configurazione PWA assente nel progetto corrente;
- servizi applicativi e repository non ancora presenti;
- readiness e gestione errori IndexedDB non ancora esposte alla shell;
- verifica GitHub Pages non ancora possibile senza build/deploy e configurazione del base path.

## Miglioramenti consigliati

1. Stabilire una base UI condivisa mobile first prima della prima feature: token, focus, target touch, breakpoint contenutistici, stati vuoti e feedback di persistenza.
2. Completare il bootstrap PWA in modo isolato, testando shell, manifest, cache e aggiornamento offline.
3. Introdurre un servizio di stato dell'applicazione per database, rete, ultimo backup e aggiornamento PWA.
4. Definire i contratti repository e facade prima di modellare il primo aggregate di business.
5. Sostituire la dipendenza Google Fonts con asset locali o verificare esplicitamente il fallback offline.
6. Conservare `Party` come anagrafica unica e introdurre `Opportunity`, `Tag`, `WorkType` e `Work` solo attraverso decisioni documentate e migrazioni compatibili.
7. Verificare il comportamento della shell su smartphone, tablet e desktop in CI o in una checklist di release.

## Modifiche consigliate, ordinate per fase

### Prima della prima feature

- decidere e configurare la strategia PWA;
- stabilire contratti di bootstrap e stato IndexedDB;
- aggiungere convenzioni UI per responsive, accessibilita, touch e tema;
- eliminare o localizzare la dipendenza font esterna;
- mantenere le route placeholder senza aggiungere logica business.

### Durante la prima feature

- introdurre una facade application e un repository per il solo aggregate coinvolto;
- testare il flusso completo dal comando UI alla persistenza;
- verificare la stessa feature su tre classi di viewport;
- garantire che la modalita fiera usi gli stessi casi d'uso della vista completa.

### Prima del modello completo

- confermare le ambiguita dell'Excel su `Tipo`, `Giorno`, `Coupon/Bancomat`, `Rimborso` e righe `Vendite`;
- definire la prima migrazione Dexie solo dopo la conferma del modello concettuale;
- formalizzare import/export e allegati con test di integrita;
- mantenere la futura sincronizzazione cloud come adapter separato.

## Decisioni proposte

1. **PWA come requisito di bootstrap di produzione:** configurarla prima del deploy, ma non aggiungere ancora funzionalita business.
2. **AppState locale esplicito:** rappresentare separatamente readiness IndexedDB, stato rete, aggiornamento PWA e ultimo backup.
3. **UI contract mobile first:** ogni futura feature deve supportare smartphone, tablet e desktop con la stessa semantica e casi d'uso.
4. **Repository boundary obbligatorio:** nessuna feature puo importare direttamente Dexie.
5. **Party come direzione anagrafica:** mantenere un soggetto unico e ruoli contestuali; non duplicare Cliente, Committente, Editore e Fornitore.
6. **Opportunity prima del Work:** una richiesta non accettata resta opportunita; solo un incarico accettato diventa Work o una sua specializzazione.
7. **Work unificato differito:** valutare l'unificazione di commissione ed editoriale dopo aver osservato i primi casi reali, senza anticipare il modello fisico.
8. **Cloud fuori dal nucleo:** ogni futura sincronizzazione deve essere un adapter opzionale con gestione esplicita di identita e conflitti.

## Impatto sul progetto

L'architettura attuale e una base valida per iniziare, ma non e ancora pronta per dichiarare completati PWA, offline UX o servizi applicativi. Le criticita P1 vanno risolte prima di implementare feature con dati reali; le P2 possono essere affrontate insieme alla prima feature, purché siano criteri di accettazione; le P3 migliorano robustezza e coerenza e non richiedono il modello dati completo.

La revisione non richiede di riscrivere la shell o il routing. Richiede di consolidare i contratti infrastrutturali e UI prima che le feature introducano dipendenze difficili da rimuovere.
