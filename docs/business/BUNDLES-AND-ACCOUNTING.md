# Bundle e contabilizzazione

## Scopo

Questo documento descrive l'architettura dei bundle, la logica di contabilizzazione delle vendite di bundle e le entita correlate. Definisce inoltre come i dati economici sono registrati e come sono predisposti per future logiche di ripartizione.

## Concetto di bundle

### Definizione

Un bundle e un prodotto virtuale composto da una o piu istanze di prodotti reali, venduto come singola unita commerciale.

**Esempio A:**
```
Bundle: "Sketch + Fumetto"
Composizione:
  - 1x Prodotto "Sketch"
  - 1x Prodotto "Fumetto"
Prezzo: €50 (opzionale, altrimenti somma dei componenti)
```

**Esempio B:**
```
Bundle: "Artist Starter Pack"
Composizione:
  - 1x Prodotto "Sketchbook"
  - 2x Prodotto "Print A4"
Prezzo: €45 (sconto rispetto alla somma)
```

### Proprieta principali

Un bundle ha le seguenti proprieta:

- **Identita:** ID univoco nel catalogo
- **Nome:** descrizione dell'offerta
- **Descrizione:** note aggiuntive
- **Composizione:** lista di (Prodotto, Quantita)
- **Prezzo:** opzionale; se non specificato, calcolato dalla somma dei prezzi base dei componenti
- **Categorie:** ereditate dai prodotti componenti (vedere "Eredita di categorie")
- **Override:** personalizzazioni di categoria specifiche del bundle
- **Stato:** attivo/inattivo
- **Timestamp:** createdAt, updatedAt, archivedAt (se eliminato)

### Differenza da prodotto ordinario

Un bundle NON e un prodotto nel senso tradizionale:

- Non e soggetto a magazzino fisico se i componenti sono virtuali
- La sua disponibilita dipende dalla disponibilita dei componenti
- Non ha un costo unitario proprio (e virtuale)
- Il suo prezzo puo essere differente dalla somma (sconto o premium)

Un bundle SI e un'entita commerciale:

- Puo essere venduto come qualsiasi altro prodotto
- Ha un'identita distinta nel catalogo
- Ha categorie e configurazioni proprie
- Genera ricavi registrabili

## Eredita di categorie nel bundle

### Logica di eredita

Un bundle eredita automaticamente tutte le categorie utilizzate dai prodotti che lo compongono.

**Processo:**

1. Bundle "X" contiene prodotti A, B, C
2. Prodotto A utilizza categorie: {Formato, Tecnica}
3. Prodotto B utilizza categorie: {Formato, Tecnica}
4. Prodotto C utilizza categorie: {Tecnica}
5. Bundle X eredita categorie: {Formato, Tecnica} (unione, non duplicazione)

### Consolidamento di categorie duplicate

Se due prodotti in un bundle usano la stessa categoria con modalita diverse, la categoria nel bundle adotta la modalita piu permissiva:

| Prodotto A | Prodotto B | Bundle |
|---|---|---|
| Formato (singola) | Formato (singola) | Formato (singola) |
| Formato (singola) | Formato (multipla) | Formato (multipla) |
| Tecnica (multipla) | Tecnica (multipla) | Tecnica (multipla) |

Se la modalita e differente, la modalita multipla "vince" (piu flessibile).

### Tag ereditate

I tag all'interno di una categoria ereditata sono l'unione dei tag disponibili nei prodotti:

```
Prodotto A, Categoria Formato: {A3, A4, A5}
Prodotto B, Categoria Formato: {A4, A5, Altro}

Bundle eredita:
Categoria Formato: {A3, A4, A5, Altro}
```

I tag comuni mantengono una singola identita; tag unici da ogni prodotto sono tutti disponibili nel bundle.

### Modalita di selezione nel bundle

Per ogni categoria ereditata, la modalita di selezione nel bundle e:

1. Se la categoria ha modalita coerente in tutti i prodotti: quella modalita
2. Se la categoria ha modalita mista: multipla (piu permissiva)
3. Se la categoria e presente in un solo prodotto: la modalita di quel prodotto

## Override di bundle

Un bundle puo personalizzare il comportamento di una categoria ereditata, definendo override espliciti.

### Tipo di override

#### Override di default

```
Bundle: "Artist Pack"
Categoria: Formato (ereditata da Sketch)
Override: Default = "Altro" (invece di "A4")
Conseguenza: quando l'utente vende il bundle, "Altro" e preselezionato per Formato
```

#### Override di valore libero precompilato

```
Bundle: "Custom Illustration"
Categoria: Formato
Tag: Altro (consente campo libero)
Override: Valore libero precompilato = "17x24 cm"
Conseguenza: campo libero per "Dimensioni personalizzate" ha gia "17x24 cm"
```

#### Override di configurazione

```
Bundle: "Pro Artist Package"
Categoria: Tecnica (multipla)
Override: Tag obbligatori = {Digitale, Post-processing}
Conseguenza: Digitale e Post-processing sono pre-selezionati e non deselectabili
```

### Ereditazione di override

Gli override sono specifici del bundle e non influenzano i prodotti componenti.

**Scenario:**
```
Prodotto "Sketch": Categoria Formato, default "A4"
Bundle "Sketch + Print": Ereditato Formato
Override bundle: Formato, default "A3"

Conseguenza:
- Sketch venduto singolarmente: default "A4"
- Sketch inside il bundle: default "A3" per questa vendita
```

## Gerarchia di risoluzione per default nel bundle

Quando l'utente vende un bundle e non ha scelto un tag per una categoria, il sistema risolve il default applicando questa gerarchia:

1. **Override esplicito del bundle** (se definito per quella categoria)
2. **Default del prodotto** (se il bundle contiene un SOLO prodotto con quella categoria)
3. **Default della categoria** (se definito globalmente)
4. **Nessun default** (l'utente deve scegliere)

### Esempio di applicazione

**Configurazione:**
```
Categoria Formato: default globale "A4"
Categoria Tecnica: nessun default globale

Prodotto Sketch: 
  - Categoria Formato, default override "A5"
  - Categoria Tecnica, nessun override

Prodotto Fumetto:
  - Categoria Tecnica, nessun override

Bundle "Sketch + Fumetto":
  - Override Formato = "Altro"
  - Nessun override Tecnica
```

**Applicazione:**

| Categoria | Risoluzione | Risultato |
|---|---|---|
| Formato nel bundle | Override bundle > default prodotto > default globale > nessuno | **Altro** (override bundle vince) |
| Tecnica nel bundle | Override bundle (nessuno) > default prodotto (nessuno per entrambi) > default globale (nessuno) > nessuno | **Nessun default** (l'utente sceglie) |

**Scenario alternativo (bundle senza override Formato):**

```
Bundle "Sketch + Fumetto" senza override
Categoria Formato: risoluzione = "A5" (default del prodotto Sketch, unico con quella categoria)
```

## Contabilizzazione delle vendite di bundle

### Registrazione della vendita

Una vendita di bundle registra i seguenti dati:

```
{
  id: "SALE_123",
  type: "bundle",
  bundleId: "BUNDLE_45",
  bundleName: "Sketch + Fumetto",
  quantity: 1,
  date: "2026-08-23",
  channel: "Fiera",
  customer: "ClientX",
  totalRevenue: 50.00,    // €50 total
  paymentMethod: "Card",
  configuration: {
    "Formato": { tag: "A4", freeValue: null },
    "Tecnica": { tags: ["Matita", "Acquerello"], freeValues: [] }
  },
  components: [
    { productId: "PROD_1", productName: "Sketch", quantity: 1 },
    { productId: "PROD_2", productName: "Fumetto", quantity: 1 }
  ],
  status: "completed"
}
```

### Incremento dei contatori dei prodotti componenti

Quando una vendita di bundle viene registrata e completata, ogni prodotto componente incrementa i suoi contatori:

```
Prodotto "Sketch":
  - sales_count += 1
  - quantity_sold += 1
  - total_revenue += X (X dipende dalla logica di ripartizione, vedere sotto)

Prodotto "Fumetto":
  - sales_count += 1
  - quantity_sold += 1
  - total_revenue += Y (Y dipende dalla logica di ripartizione, vedere sotto)
```

**Regola:** Indipendentemente dalla logica di ripartizione economica (X + Y possono uguagliare il ricavo totale o essere diversi), i contatori di quantita e numero di vendite sono sempre incrementati.

### Ripartizione economica (da decidere)

La logica di ripartizione del ricavo totale del bundle (€50) tra i componenti (Sketch + Fumetto) richiede una decisione progettuale. Opzioni:

#### Opzione A: Proporzionale al prezzo base

```
Prezzo base Sketch: €20
Prezzo base Fumetto: €30
Totale: €50
Ricavo bundle: €50

Sketch riceve: €50 × (€20 / €50) = €20
Fumetto riceve: €50 × (€30 / €50) = €30
```

Vantaggi:
- Rispecchia il valore relativo di ogni componente
- Simmetrico rispetto ai prezzi base

Svantaggi:
- Piu complesso da implementare
- Dipende dai prezzi base (se un prezzo cambia, la ripartizione storica non cambia)

#### Opzione B: Uguale per tutti i componenti

```
Ricavo bundle: €50
Numero di componenti: 2
Ricavo per componente: €50 / 2 = €25 ciascuno
```

Vantaggi:
- Semplice da implementare
- Equo per bundle simmetrici

Svantaggi:
- Non riflette il valore relativo
- Unfair per bundle asimmetrici (1x €100 + 1x €1)

#### Opzione C: Configurabile per bundle

```
Bundle "Sketch + Fumetto", revenue split:
  Sketch: 40%
  Fumetto: 60%

Ricavo €50:
  Sketch: €50 × 0.4 = €20
  Fumetto: €50 × 0.6 = €30
```

Vantaggi:
- Massima flessibilita
- Consente strategie commerciali specifiche

Svantaggi:
- Richiede configurazione per ogni bundle
- Piu complessita UI

#### Opzione D: Non ripartito, solo ricavo totale

```
Bundle "Sketch + Fumetto", ricavo: €50

Registrazione economica:
  - Bundle come entita: +€50
  - Componenti: statistiche di vendita (count, quantity) incrementate, ma revenue_contribution = 0

Report mostrano:
  - Fatturato Sketch: include solo vendite dirette di Sketch
  - Fatturato da bundle: registrato separatamente

Contatore "Sketch totale": include sia vendite dirette che contributi da bundle
```

Vantaggi:
- Trasparenza: chiarezza tra vendita diretta e bundle
- Semplice implementazione

Svantaggi:
- Fatturato per prodotto potrebbe essere fuorviante
- Analisi per prodotto piu complessa

### Decisione raccomandata (temporanea)

Per MVP (Minimum Viable Product), **Opzione D: Non ripartito** e raccomandata perche:

1. Minimizza la complessita iniziale
2. Mantiene la trasparenza
3. Non ostacola future implementazioni di Opzioni A-C
4. Consente raccogliere dati reali per decidere quale strategia e piu utile

La decisione finale sara presa in fase di design della feature, consultando i dati di utilizzo e i feedback dei tester.

## Dati storici e audit

### Fotografia della configurazione

Ogni vendita di bundle registra una fotografia della configurazione al momento della vendita:

```
sale: {
  bundleSnapshot: {
    bundleId: "BUNDLE_45",
    bundleName: "Sketch + Fumetto",
    bundlePrice: 50.00,
    componentsSnapshot: [
      { productId: "PROD_1", productName: "Sketch", quantity: 1, price: 20.00 },
      { productId: "PROD_2", productName: "Fumetto", quantity: 1, price: 30.00 }
    ],
    categoriesSnapshot: {
      "Formato": { mode: "single", tags: ["A3", "A4", "A5", "Altro"], default: "A4" },
      "Tecnica": { mode: "multiple", tags: ["Matita", "China", "Acquerello"], default: null }
    }
  }
}
```

Se il bundle o i componenti cambiano dopo la vendita, i dati storici rimangono invariati. Questo consente di ricostruire esattamente come era configurato il bundle al momento della vendita.

### Audit trail

Ogni cambio di configurazione del bundle deve registrare:

```
{
  timestamp: "2026-08-23T14:30:00Z",
  bundleId: "BUNDLE_45",
  action: "update",
  changedFields: ["components.0.quantity"],
  oldValue: [{ productId: "PROD_1", quantity: 1 }],
  newValue: [{ productId: "PROD_1", quantity: 2 }],
  userId: "USER_X"
}
```

L'audit trail consente di tracciare storicamente come era il bundle e quando e stato modificato.

## Report e analitiche

### Report di vendita per prodotto

Il report di vendita per prodotto deve distinguere tra:

1. **Vendite dirette:** il prodotto e stato venduto singolarmente
2. **Vendite da bundle:** il prodotto e incluso in un bundle venduto
3. **Totale:** somma di 1 e 2

Esempio di report:

```
Prodotto: Sketch

Periodo: Gen-Ago 2026

Vendite dirette:       15 unita, €300
Vendite da bundle:     10 unita, €? (dipende da logica di ripartizione)
Totale vendite:        25 unita, €300+?

Numero di transazioni: 22 (15 dirette + 7 bundle)
```

### Report di bundle

Report specifico per bundle che mostra:

- Numero di bundle venduti
- Ricavo totale
- Categorie piu scelte
- Composizioni richieste (quali combinazioni di tag sono state scelte)

### Report economico

Report che aggrega entrate per origine:

- Vendite di prodotti diretti
- Vendite di bundle (come entita singola, se logica D scelta)
- Commissioni
- Altri ricavi

## Architettura di database

### Tabelle Dexie

```javascript
// Tabella Bundle
db.table('bundles', {
  keyPath: 'id',
  indexes: [
    'status',          // per filtrare bundle attivi/inattivi
    'createdAt',       // per cronologia
    'name'             // per ricerca
  ]
})

// Tabella BundleComponent (molti-a-molti)
db.table('bundleComponents', {
  keyPath: ['bundleId', 'productId'],
  indexes: [
    'bundleId',        // per recuperare componenti di un bundle
    'productId'        // per recuperare bundle che contengono un prodotto
  ]
})

// Tabella BundleCategory (eredita + override)
db.table('bundleCategories', {
  keyPath: ['bundleId', 'categoryId'],
  indexes: [
    'bundleId',        // per recuperare categorie di un bundle
    'categoryId'
  ]
})

// Tabella BundleOverride (override di categoria)
db.table('bundleOverrides', {
  keyPath: ['bundleId', 'categoryId'],
  indexes: [
    'bundleId'
  ]
})

// Estensione di SalesLine (riga di vendita)
// Nuovi campi:
// - isBundleComponent: boolean
// - bundleSaleId: string (riferimento a vendita bundle se parte di bundle)
// - saleType: 'direct' | 'bundleComponent'
```

### Logica di recupero

**Quando si vende un bundle:**

1. Recupera il bundle da `bundles` by ID
2. Recupera componenti da `bundleComponents` where bundleId = X
3. Recupera categorie ereditate da `bundleCategories` where bundleId = X
4. Recupera override da `bundleOverrides` where bundleId = X
5. Recupera categoria globale e tag da tabella `categories` per ogni categoria ereditate
6. Costruisci la configurazione presentata all'utente (applica gerarchia di risoluzione)

**Dopo la vendita:**

1. Crea record di vendita con type = "bundle"
2. Per ogni componente del bundle:
   a. Crea riga di vendita con `saleType = 'bundleComponent'`, `bundleSaleId = VENDITA_BUNDLE_ID`
   b. Incrementa contatori del prodotto

## Evoluzione futura

### Bundle annidati

Consentire che un bundle contenga altri bundle (non solo prodotti base).

**Prerequisiti:** Logica ricorsiva di eredita categorie, contabilizzazione a cascata.

### Pricing dinamico

Calcolo del prezzo del bundle basato su una formula (es: somma con sconto del 10%).

**Prerequisiti:** Formula configurabile, valutazione runtime.

### A/B testing di bundle

Creare varianti di bundle per testare diverse composizioni e prezzi.

### Report di redditibilita

Analizzare il margine di profitto per bundle (prezzo - costo di componenti).

Richiede integrazione con costi di prodotto.

## Glossario di questo documento

- **Bundle:** prodotto virtuale composto da piu prodotti reali
- **Componente:** prodotto incluso in un bundle
- **Eredita di categorie:** il bundle acquista categorie dai componenti
- **Override:** personalizzazione di categoria specifica del bundle
- **Contabilizzazione:** processo di registrazione di vendite e incremento di contatori
- **Ripartizione economica:** logica di distribuzione del ricavo del bundle tra componenti
- **Fotografia:** snapshot di configurazione al momento della vendita
- **Audit trail:** log storico di modifiche
