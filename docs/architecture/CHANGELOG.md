# Changelog

Questo documento traccia tutti gli aggiornamenti e le nuove funzionalita introdotte nella documentazione e nella architettura di Artist Business Manager.

## [2.0.0] - 2026-08-23

### Aggiunto

#### Nuovo: Sistema categorie e tag configurabile

L'applicazione introduce un sistema flessibile per gestire varianti e opzioni di prodotto senza modifiche di codice.

- **Categorie:** raggruppamenti configurabili (Formato, Tecnica, Colore, ecc.)
- **Tag:** opzioni concrete all'interno di categorie (A3, A4, Matita, China, ecc.)
- **Modalita di selezione:** singola (esclusiva) o multipla (OR logico)
- **Definizione da UI:** utente crea e modifica categorie/tag senza interventi tecnici
- **Persistenza:** tutte le configurazioni salvate in IndexedDB

Documento di riferimento: `docs/business/FUNCTIONAL-REQUIREMENTS.md` (sez. "Sistema categorie e tag")

#### Nuovo: Modificatori di prezzo

I tag possono influenzare il prezzo finale tramite modificatori configurabili.

- **Percentuale:** aggiunge/sottrae % al prezzo base (es: A3 +50%)
- **Valore fisso:** aggiunge/sottrae importo in minima unita valuta (es: Copertina rigida +€10)
- **Formula di calcolo:** documentata e trasparente
- **Ordine di applicazione:** percentuali prima, poi fissi
- **Preview interattivo:** UI mostra effetto su prezzo in tempo reale

Documento di riferimento: `docs/business/FUNCTIONAL-REQUIREMENTS.md` (sez. "Modificatori di prezzo")

#### Nuovo: Sistema di default e override

Gerarchia di risoluzione per determinare valore predefinito di una categoria.

- **Default categoria:** globale, per tutte le vendite
- **Override prodotto:** specifica di un prodotto, sovrascrive default categoria
- **Override bundle:** specifica di un bundle, sovrascrive override prodotto
- **Gerarchia:** esplicita e documentata
- **Retroattivo:** applicato solo a nuove vendite

Documento di riferimento: `docs/business/FUNCTIONAL-REQUIREMENTS.md` (sez. "Default di categoria e override di prodotto")

#### Nuovo: Campi liberi

I tag possono consentire inserimento di testo libero personalizzato.

- **Abilitazione per tag:** flag "consenti campo libero"
- **Etichetta e placeholder personalizzabili:** guidance per utente
- **Livello prodotto:** valore suggerito per ridurre inserimento ripetitivo
- **Validazioni future:** struttura predisposta per regex e regole custom

Documento di riferimento: `docs/business/FUNCTIONAL-REQUIREMENTS.md` (sez. "Campi liberi")

#### Nuovo: Associazione categoria-prodotto

Ogni prodotto dichiara quali categorie usa (nessuna categoria e valida).

- **Associazione esplicita:** prodotto usa solo categorie dichiarate
- **Ordinamento personalizzato:** ordine di presentazione durante la vendita
- **Override locali:** default diverso dal globale per ogni prodotto
- **Gestione UI:** facilita aggiunta/rimozione/ordinamento categorie

Documento di riferimento: `docs/business/FUNCTIONAL-REQUIREMENTS.md` (sez. "Associazione categorie ai prodotti")

#### Nuovo: Bundle (prodotti virtuali)

Offerta commerciale composta da piu prodotti reali, venduta come singola unita.

- **Composizione:** lista di prodotti con quantita
- **Prezzo:** opzionale (altrimenti somma componenti)
- **Eredita categorie:** automatica dai componenti
- **Override personalizzati:** possibilita di personalizzare default per bundle
- **Vendita singola:** registrata come una transazione, ma contribuisce a statistiche componenti

Documento di riferimento: `docs/business/BUNDLES-AND-ACCOUNTING.md` (sez. "Concetto di bundle")

#### Nuovo: Contabilizzazione bundle

Logica di registrazione vendite di bundle e incremento contatori prodotti componenti.

- **Registrazione atomica:** vendita bundle + incremento componenti in transazione
- **Fotografia della configurazione:** snapshot di categorie/tag al momento della vendita
- **Audit trail:** traccia storica di ogni vendita
- **Ripartizione economica:** quattro opzioni future (proporzionale, uguale, configurabile, non ripartito)
- **Report trasparenti:** distinguono vendite dirette da vendite via bundle

Documento di riferimento: `docs/business/BUNDLES-AND-ACCOUNTING.md` (sez. "Contabilizzazione delle vendite di bundle")

#### Nuovo: Design System CMYK-ispirato

Interfaccia colorata, creativa e professionale, con palette ispirata ai colori di stampa CMYK.

- **Palette primaria:** Cyan (#0B8FA0), Magenta (#C41D7F), Yellow (#F5C614), Black (#2C2C2C)
- **Colori secondari:** varianti desaturate e professionali
- **Colori di stato:** Success, Warning, Error, Info
- **Obiettivi:** colorata, creativa, professionale, leggibile, equilibrata, non infantile, non minimale

Documento di riferimento: `docs/architecture/DESIGN-SYSTEM.md` (sez. "Palette di colori")

#### Nuovo: Design token centralizzati

Variabili CSS per colori, tipografia, spaziatura, elevazione e border-radius.

- **Token globali:** definiti una volta, usati ovunque
- **Nessun hardcode nei componenti:** solo riferimenti a variabili
- **Scalabilita:** facilita aggiunta di nuovi temi
- **Accessibilita:** token di stato ben definiti

Documento di riferimento: `docs/architecture/DESIGN-SYSTEM.md` (sez. "Design token")

#### Nuovo: Sistema di theming

L'applicazione supporta temi multipli tramite variabili CSS e selettore `[data-theme]`.

- **Light Mode:** tema chiaro, default, professionale
- **Dark Mode:** tema scuro, riduce affaticamento visivo
- **Artist Theme:** tema vibrant e creativo, palette CMYK piena
- **Selezione utente:** in Impostazioni > Tema
- **Persistenza:** preferenza salvata in IndexedDB
- **Preferenza di sistema:** possibilita di seguire `prefers-color-scheme`

Documento di riferimento: `docs/architecture/DESIGN-SYSTEM.md` (sez. "Theming")

#### Nuovo: Favicon e branding

Icona identificativa che rappresenta "pennello che dipinge una griglia".

- **Simbolismo:** Creativita (pennello) + Ordine (griglia)
- **Stile:** Flat moderno con accent CMYK
- **Varianti:** favicon, logo, icona PWA, monochrome
- **Utilizzo:** definito e documentato

Documento di riferimento: `docs/architecture/DESIGN-SYSTEM.md` (sez. "Favicon e branding")

### Modificato

#### DATA-MODEL.md

Esteso il modello dati con nuove entita e relazioni.

**Entita aggiunte:**
- `Categoria`: raggruppamento configurabile di tag
- `Tag`: opzione concreta di una categoria
- `Modificatore di prezzo`: configurazione numerica di influenza su prezzo
- `Associazione Categoria-Prodotto`: legame esplicito categoria-prodotto
- `Valore libero per categoria e prodotto`: configurazione di campo libero
- `Bundle`: prodotto virtuale composto da prodotti reali
- `Contabilizzazione Bundle`: logica di registrazione vendite bundle

**Tabella di cardinalita:** aggiornata con nuove relazioni (categoria-tag, prodotto-categoria, bundle-prodotto, ecc.)

**Aggregati:** aggiunti aggregati per Categoria, Configurazione categorie e Bundle

**Gerarchie di risoluzione:** documentate le gerarchie di default categoria vs override prodotto vs override bundle

**Value object:** aggiunti PriceModifier, CategorySelectionMode, CategoryDefault, ProductCategoryOverride, BundleOverride

Documento di riferimento: `docs/business/DATA-MODEL.md` (sez. aggiornate: "Entita e attributi", "Value object", "Relazioni e cardinalita", "Aggregati", "Gerarchie di risoluzione")

#### TERMINOLOGY.md

Aggiunta sezione "Catalogo e configurazione" con nuovi termini definiti.

**Termini aggiunti:**
- Categoria
- Tag
- Modificatore di prezzo
- Associazione Categoria-Prodotto
- Default di categoria vs override di prodotto
- Campo libero
- Bundle
- Eredita di categorie nel bundle
- Override di bundle
- Contabilizzazione del bundle

**Confini obbligatori:** aggiornati con nuovi confini (categoria vs tag, bundle, ecc.)

Documento di riferimento: `docs/business/TERMINOLOGY.md` (sez. "Catalogo e configurazione" e "Confini obbligatori")

#### ARCHITECTURE.md

Aggiunte due nuove sezioni architetturali.

**Sezione "Architettura di configurabilita":**
- Livelli di configurazione (globale, prodotto, bundle, transazione)
- Persistenza della configurazione in IndexedDB
- Interfaccia di configurazione
- Validazione della configurazione

**Sezione "Architettura di theming e design token":**
- Struttura di file CSS
- Definizione di variabili CSS globali
- Tema Light, Dark, Artist
- Selezione e persistenza del tema
- Linee guida per componenti

Documento di riferimento: `docs/architecture/ARCHITECTURE.md` (sez. "Architettura di configurabilita" e "Architettura di theming e design token")

### Creato

#### FUNCTIONAL-REQUIREMENTS.md

Documento completo di requisiti funzionali che copre:

- Requisiti generali
- Sistema categorie e tag
- Modificatori di prezzo
- Default e override
- Campi liberi
- Associazione categorie ai prodotti
- Bundle
- Contabilizzazione bundle
- Configurabilita
- Casi d'uso (8 UC principali con flussi detailed)
- Dati di progetto esemplari

**Linee guida:**
- Identificativi con prefisso (R.GEN.001 per requisiti generali, R.CAT.001 per categorie, ecc.)
- Descrizione di ogni requisito con precondizioni, flusso e postcondizioni
- Esempi concreti per facilitare comprensione
- Link incrociati con TERMINOLOGY.md e DATA-MODEL.md

Documento di riferimento: `docs/business/FUNCTIONAL-REQUIREMENTS.md`

#### DESIGN-SYSTEM.md

Documento completo di design system che copre:

- Obiettivi e principi del design
- Palette di colori (primari, secondari, stato, sfondo)
- Design token (colore, tipografia, spaziatura, elevazione, border-radius)
- Architettura di theming (Light, Dark, Artist)
- Componenti e pattern UI (tipografia, bottoni, form, card, modal, navigazione)
- Linee guida UX (accessibilita, touch-friendly, responsive, feedback)
- Favicon e branding
- Stili globali e evoluzioni future

**Tabelle di riferimento:**
- Palette colori con hex, RGB, CMYK
- Token CSS per ogni categoria
- Linee guida tipografia (heading, paragrafo, line-height)
- Pattern UI con classi e stati

Documento di riferimento: `docs/architecture/DESIGN-SYSTEM.md`

#### BUNDLES-AND-ACCOUNTING.md

Documento specializzato su bundle e logica di contabilizzazione che copre:

- Concetto e proprieta di bundle
- Eredita di categorie nel bundle (con consolidamento)
- Override di bundle (default, valore libero precompilato)
- Gerarchia di risoluzione per default nel bundle
- Registrazione della vendita di bundle
- Incremento dei contatori dei prodotti componenti
- Ripartizione economica (4 opzioni future)
- Dati storici e audit trail
- Report e analitiche
- Architettura di database Dexie
- Evoluzione futura (bundle annidati, pricing dinamico, A/B testing)
- Glossario

**Diagrammi e esempi:**
- Tabelle di eredita di modalita
- Esempi di gerarchia di risoluzione
- Screenshot di strutture dati

Documento di riferimento: `docs/business/BUNDLES-AND-ACCOUNTING.md`

#### CONFIG-ARCHITECTURE.md

Documento tecnico dettagliato su architettura di configurazione che copre:

- Principi architetturali
- Modello dati di configurazione (8 tabelle Dexie)
- Flussi di configurazione (6 FC principali con logica e validazione)
- Calcolo dei default a runtime (algoritmo con pseudocodice)
- Calcolo del prezzo a runtime (algoritmo con pseudocodice)
- Validazione della configurazione
- Esportazione e importazione della configurazione
- Future evoluzioni (versioning, template, pricing dinamico)

**Interfacce TypeScript:**
- Ogni entita ha interfaccia completa con commenti sui campi
- Algoritmi scritti in pseudocodice/JavaScript per chiarezza

Documento di riferimento: `docs/architecture/CONFIG-ARCHITECTURE.md`

#### CHANGELOG.md

Questo documento. Traccia tutti gli aggiornamenti introdotti nella versione 2.0.0.

Documento di riferimento: `docs/architecture/CHANGELOG.md`

## Decisioni architetturali importanti

### D.001: Ripartizione economica non implementata in MVP

La logica di ripartizione del ricavo di bundle tra componenti e posticipata a futura iterazione.

**Opzioni evaluate:** quattro strategie (proporzionale, uguale, configurabile, non ripartito)

**Decisione:** MVP implementa "Opzione D: Non ripartito" per minimizzare complessita

**Consequenza:** fatturato bundle registrato separatamente, statistiche di vendita dei componenti sempre incrementate

**Revisione:** dopo raccolta dati, scegliere strategia definitiva

Riferimento: `docs/business/BUNDLES-AND-ACCOUNTING.md` (sez. "Ripartizione economica")

### D.002: Tema Light come default iniziale

Il tema chiaro e predefinito, supportati Dark e Artist come alternative.

**Motivo:** compatibilita con uffici, studi, ambienti ben illuminati

**Scalabilita:** architettura CSS consente aggiunta di temi senza modifiche di codice

**Preferenza di sistema:** app puo rilevare `prefers-color-scheme` per default future

Riferimento: `docs/architecture/DESIGN-SYSTEM.md` (sez. "Theming")

### D.003: Configurazione completamente gestibile via UI

Nessun file JSON, nessun intervento tecnico per definire categorie, tag, bundle.

**Implicazione:** UI di configurazione e fondamentale, deve essere intuitiva e completa

**Validazione:** rigorosa sia lato UI che lato database

**Export/import:** configurazione e syncronizzabile tramite export

Riferimento: `docs/business/FUNCTIONAL-REQUIREMENTS.md` (sez. "Configurabilita")

### D.004: Categorie ereditate nel bundle, non copiate

Un bundle non ha una copia statica delle categorie: le eredita dinamicamente dai componenti.

**Vantaggio:** cambio di categoria nel prodotto si riflette nel bundle

**Svantaggio:** complessita di calcolo a runtime

**Garanzia:** fotografia della configurazione salvata con ogni vendita

Riferimento: `docs/business/BUNDLES-AND-ACCOUNTING.md` (sez. "Eredita di categorie nel bundle")

## Impatto sullo sviluppo

### Impatto su modello dati

- 8 nuove tabelle Dexie (categories, tags, productCategories, bundles, bundleComponents, bundleCategories, bundleOverrides, configurationHistory)
- Estensione di tabelle esistenti (products, salesLines)
- Indici per query efficienti (status, categoryId, productId, ecc.)
- Migrazioni Dexie per upgrade schema

### Impatto su layer domain

- Nuove entita: Category, Tag, Bundle, PriceModifier
- Nuove regole di business: validazione default, calcolo prezzo, eredita categorie
- Nuovi repository: CategoryRepository, TagRepository, BundleRepository
- Nuovi query contract: getCategoriesForProduct(), getBundleCategoriesFor(), ecc.

### Impatto su layer application

- Nuove facade: CategoryConfigurationFacade, BundleConfigurationFacade
- Nuovi servizi: PricingService (calcolo prezzo), ConfigurationService (gestione config)
- Nuove feature: Configurazione/Categorie, Configurazione/Bundle
- Nuovi case d'uso: creazione categoria, associazione categoria, creazione bundle, ecc.

### Impatto su layer UI

- Nuove pagine: Impostazioni > Categorie, Impostazioni > Configurazione
- Nuove sezioni: Catalogo > Bundle
- Estensione di pagine: Vendite (presentazione categorie/tag), Catalogo > Prodotti (associazione categorie)
- Nuovo sistema di theming: CSS variables, [data-theme] selector, SettingsService per persistenza tema

### Impatto su test

- Test domain: validazione default, calcolo prezzo, eredita categorie
- Test repository: CRUD di categoria, tag, bundle, migrazioni Dexie
- Test facade: case d'uso di configurazione, binding con UI
- Test end-to-end: flusso completo di configurazione e vendita con categorie/bundle
- Test UI: presentazione categorie durante vendita, selezione tag, preview prezzo

## Compatibilita e migrazione

### Versione precedente

Versione 1.x non aveva sistema di categorie/tag/bundle configurabili.

### Percorso di migrazione

1. Export dati versione 1.x
2. Conversione prodotti semplici a prodotti con categorie (migrazione esplicita)
3. Import dati convertiti in versione 2.0.0
4. Modifica UI di configurazione per completare associazioni categorie (se necessario)

### Dati storici

Vendite storiche della versione 1.x rimangono immutate. Se prodotti sono stati modificati (ora hanno categorie), i report possono mostrare discrepanze tra design del prodotto e dati storici. La documentazione deve chiarire questa possibilita.

## Note sul documento

### Struttura documentazione aggiornata

```
docs/
├── business/
│   ├── DATA-MODEL.md                    (MODIFICATO)
│   ├── TERMINOLOGY.md                   (MODIFICATO)
│   ├── FUNCTIONAL-REQUIREMENTS.md       (NUOVO)
│   ├── BUNDLES-AND-ACCOUNTING.md        (NUOVO)
│   └── ... (altri doc)
└── architecture/
    ├── ARCHITECTURE.md                  (MODIFICATO)
    ├── DESIGN-SYSTEM.md                 (NUOVO)
    ├── CONFIG-ARCHITECTURE.md           (NUOVO)
    ├── CHANGELOG.md                     (QUESTO FILE)
    └── ... (altri doc)
```

### Come leggere i documenti

1. **Inizio:** leggere `TERMINOLOGY.md` per comprendere concetti base
2. **Requisiti:** leggere `FUNCTIONAL-REQUIREMENTS.md` per dettagli funzionali
3. **Architettura:** leggere `DATA-MODEL.md` e `CONFIG-ARCHITECTURE.md` per design tecnico
4. **Design:** leggere `DESIGN-SYSTEM.md` per interfaccia e theming
5. **Bundle:** leggere `BUNDLES-AND-ACCOUNTING.md` per logica specifica

Riferimenti incrociati tra documenti sono forniti ovunque.

### Punti di decisione futura

Alcuni punti rimangono aperti per future decisioni:

- [ ] **Ripartizione economica di bundle:** quale strategia implementare? (Proporzionale, Uguale, Configurabile, Non ripartito)
- [ ] **Tema di default in dark mode:** dovrebbe app preferire dark mode se `prefers-color-scheme: dark`?
- [ ] **Validazioni avanzate:** supportare regole condizionali tra categorie (es: "se Tecnica=Digitale, allora Formato=Altro")?
- [ ] **Bundle annidati:** consentire bundle contenere altri bundle?
- [ ] **Pricing dinamico:** supportare formule di prezzo parametriche?
- [ ] **Esportazione configurazione:** offrire export/import della sola configurazione (senza dati di vendita)?

Ogni decisione deve essere documentata in questo file o in DECISIONS.md.

## Revisioni future

### Versione 2.1.0 (Pianificato)

- Implementazione di UI per configurazione
- Test coverage completo
- Gestione errori e edge case
- Documentazione di UX/UI patterns

### Versione 2.2.0 (Pianificato)

- Ripartizione economica di bundle (decisione + implementazione)
- Template di configurazione predefiniti
- Duplicazione facile di categoria/tag/bundle

### Versione 3.0.0 (Futuro)

- Sincronizzazione cloud e multi-device (richiede backend)
- Condivisione di configurazione tra utenti
- Autenticazione e autorizzazione
- API aperta per integrazioni
