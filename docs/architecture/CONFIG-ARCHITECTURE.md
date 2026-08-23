# Architettura di configurazione

## Scopo

Questo documento descrive l'architettura tecnica del sistema di configurazione dell'applicazione. Definisce come categorie, tag, prodotti, bundle e prezzi sono gestiti, persistiti, validati e utilizzati a runtime.

## Principi architetturali

- **Configurabilita senza codice:** l'utente configura tutto via UI, nessun codice o file JSON
- **Persistenza locale:** tutte le configurazioni in IndexedDB, sincronizzabili via export/import
- **Immutabilita storica:** le vendite mantengono la configurazione al momento della transazione
- **Minima complessita iniziale:** design scalabile per future evoluzioni
- **Validazione rigorosa:** errori di configurazione rilevati immediatamente
- **Tracciabilita:** audit trail di ogni cambio di configurazione

## Modello dati di configurazione

### Tabella: Categories

Rappresenta le categorie globali disponibili.

```typescript
interface Category {
  id: string;                    // Univoco, generato da app
  name: string;                  // Obbligatorio, unico
  description?: string;          // Opzionale
  mode: 'single' | 'multiple';   // Modalita selezione
  ordering: number;              // Ordinamento globale
  status: 'active' | 'inactive'; // Stato
  globalDefault?: string;        // ID del tag predefinito (opzionale)
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
  archivedAt?: string;           // Se eliminato
}
```

### Tabella: Tags

Rappresenta le opzioni di ogni categoria.

```typescript
interface Tag {
  id: string;                       // Univoco
  categoryId: string;               // Riferimento a Category (FK)
  name: string;                     // Obbligatorio, unico dentro la categoria
  description?: string;
  ordering: number;
  status: 'active' | 'inactive';
  
  // Configurazione di prezzo
  priceModifier?: {
    type: 'percentage' | 'fixed';   // Tipo modificatore
    value: number;                  // % o importo in minima unita
    currency?: string;              // ISO 4217, solo se type='fixed'
  };
  
  // Supporto campo libero
  allowFreeText: boolean;           // Flag abilitazione
  freeTextLabel?: string;           // Etichetta campo (es. "Dimensioni personalizzate")
  freeTextPlaceholder?: string;     // Placeholder (es. "es. 17x24 cm")
  
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

### Tabella: Products

Anagrafica dei prodotti (gia esistente, estesa).

```typescript
interface Product {
  id: string;
  name: string;
  description?: string;
  basePrice: number;               // Prezzo base in minima unita valuta
  sku?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  // + altri campi gia esistenti
}
```

### Tabella: ProductCategories

Associazione categoria-prodotto. Tabella di relazione che consente anche override locali.

```typescript
interface ProductCategory {
  id: string;
  productId: string;               // Riferimento a Product (FK)
  categoryId: string;              // Riferimento a Category (FK)
  ordering: number;                // Ordinamento nel prodotto
  status: 'active' | 'inactive';
  
  // Override locale del default
  productDefault?: string;         // ID del tag predefinito per questo prodotto
                                   // Se definito, sovrascrive Category.globalDefault
  
  // Valore libero suggerito (a livello prodotto)
  suggestedFreeValue?: string;    // Valore precompilato (es. "17x24 cm")
  
  createdAt: string;
  updatedAt: string;
}
```

### Tabella: Bundles

Rappresenta bundle virtuali.

```typescript
interface Bundle {
  id: string;
  name: string;
  description?: string;
  
  // Composizione
  components: Array<{
    productId: string;             // Riferimento a Product
    quantity: number;              // Quantita (default 1)
  }>;
  
  // Prezzo
  bundlePrice?: number;            // Se non definito, somma dei componenti
  calculateAsBundlePrice: boolean; // Flag: usa prezzo bundle o somma componenti
  
  // Categorie (calcolate/ereditate)
  categories: string[];            // Array di categoryId (unione dai componenti)
  
  status: 'active' | 'inactive';
  
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
}
```

### Tabella: BundleOverrides

Override di bundle per categoria.

```typescript
interface BundleOverride {
  id: string;
  bundleId: string;                // Riferimento a Bundle (FK)
  categoryId: string;              // Riferimento a Category (FK)
  
  // Override di default
  bundleDefault?: string;          // ID del tag predefinito per questo bundle
  
  // Valore libero precompilato
  precompiledFreeValue?: string;   // Valore suggerito/precompilato
  
  // Configurazione di obbligatorietà (futuro)
  // requiredTags?: string[];         // Tag che devono essere selezionati
  // forbiddenTags?: string[];        // Tag che non possono essere selezionati
  
  createdAt: string;
  updatedAt: string;
}
```

### Tabella: ConfigurationHistory (Audit trail)

Traccia ogni modificazione della configurazione.

```typescript
interface ConfigurationHistory {
  id: string;
  timestamp: string;               // ISO 8601
  userId: string;                  // Se autenticazione futura
  
  entityType: 'Category' | 'Tag' | 'Product' | 'Bundle' | 'ProductCategory';
  entityId: string;
  
  action: 'create' | 'update' | 'delete' | 'archive';
  
  // Snapshot before
  before?: any;                    // Oggetto prima della modifica
  
  // Snapshot after
  after?: any;                     // Oggetto dopo della modifica
  
  // Descrizione leggibile
  description: string;             // Es. "Categoria 'Formato' creata"
}
```

## Flussi di configurazione

### FC.001: Creazione di una categoria

**UI:**
1. Utente accede a "Impostazioni > Categorie > Nuova categoria"
2. Form: nome (required), descrizione, mode (singola/multipla), ordering
3. Submit

**Logic:**
1. Validazione lato client: nome non vuoto, unico
2. Generazione ID: `CAT_${timestamp}_${random}`
3. Creazione record in `categories` table
4. Inserimento in `ConfigurationHistory` con action='create'
5. UI aggiorna lista categorie

**Validazioni:**
- Nome non vuoto e < 100 caratteri
- Mode valido (enum)
- Nessun duplicato di nome (case-insensitive)

**Postcondizioni:**
- La categoria esiste ed e attiva
- Nessun tag ancora (vuota)
- Nessun prodotto ancora associato

### FC.002: Creazione di un tag

**UI:**
1. Utente accede a "Impostazioni > Categorie > [Categoria] > Nuovi tag"
2. Form: nome, descrizione, ordering, [priceModifier], [allowFreeText, freeTextLabel, placeholder]
3. Submit

**Logic:**
1. Validazione: nome non vuoto e unico dentro la categoria
2. Se allowFreeText=true: freeTextLabel e freeTextPlaceholder sono required
3. Se priceModifier: valore numerico e tipo valido (percentage/fixed)
4. Creazione record in `tags` table
5. Inserimento in `ConfigurationHistory`

**Validazioni:**
- Nome < 100 caratteri
- Nessun duplicato di nome dentro la categoria
- Se allowFreeText: label < 50 caratteri
- Se priceModifier type='percentage': -999 < value < 999
- Se priceModifier type='fixed': value puo essere negativo, ma reasonable (-10000 < value < 10000)

**Postcondizioni:**
- Il tag esiste e puo essere scelto durante le vendite
- Se allowFreeText: campo libero e disponibile durante la vendita

### FC.003: Associazione di categoria a prodotto

**UI:**
1. Utente accede a "Catalogo > Prodotti > [Prodotto] > Configurazione"
2. Visualizza: categorie gia associate, categorie disponibili
3. Clicca "Aggiungi categoria" e seleziona una categoria non ancora associata
4. Per ogni categoria, opzionalmente: imposta productDefault e suggestedFreeValue
5. Drag-and-drop per ordinamento
6. Submit

**Logic:**
1. Validazione: nessun duplicato (productId + categoryId)
2. Se productDefault specificato: validare che esista un tag con quel ID nella categoria
3. Creazione record in `productCategories` table
4. Inserimento in `ConfigurationHistory`
5. Se il prodotto e usato in bundle: ricalcolare categorie ereditate del bundle

**Postcondizioni:**
- La categoria e disponibile durante la vendita del prodotto
- Ordinamento e visibile nella UI
- Se productDefault definito: verra usato come default durante la vendita

### FC.004: Creazione di un bundle

**UI:**
1. Utente accede a "Catalogo > Bundle > Nuovo"
2. Form: nome, descrizione, [bundlePrice], selezionare componenti
3. Per ogni componente: prodotto + quantita
4. UI mostra automaticamente categorie ereditate
5. Opzionalmente: definire override per alcune categorie
6. Submit

**Logic:**
1. Validazione: nome non vuoto, almeno un componente
2. Validazione: prodotti componenti devono essere attivi
3. Calcolo categorie ereditate:
   a. Iterare su ogni componente
   b. Recuperare categorie associate (da `productCategories`)
   c. Unire in lista unica (nessun duplicato)
   d. Per ogni categoria duplicata: scegliere mode piu permissivo (multipla > singola)
4. Creazione record in `bundles` table
5. Per ogni override specificato: creazione record in `bundleOverrides`
6. Inserimento in `ConfigurationHistory`

**Validazioni:**
- Nome < 100 caratteri
- Almeno un componente
- Quantita > 0
- bundlePrice >= 0 (se specificato)
- Override categories devono essere nelle ereditate

**Postcondizioni:**
- Bundle creato, attivo e pronto per la vendita
- Categorie ereditate calcolate e salvate
- Override (se definiti) pronti a essere applicati a runtime

### FC.005: Modifica di una categoria

**UI:**
1. Utente accede a "Impostazioni > Categorie > [Categoria]"
2. Form pre-compilato con valori attuali
3. Modifica e submit

**Logic:**
1. Validazione: nome (se modificato) deve rimanere unico
2. Se mode cambiato: avvertenza che prodotti/bundle potrebbero richiedere revisione
3. Se globalDefault cambiato: avvertenza che default locali rimangono
4. Snapshot before della categoria
5. Aggiornamento del record in `categories`
6. Inserimento in `ConfigurationHistory` con before/after
7. Se modo cambiato: invalidare cache di bundle che usano questa categoria

**Conseguenze:**
- Prodotti che usano questa categoria vedono il nuovo mode
- Vendite future rispettano il nuovo mode
- Vendite storiche non cambiano

### FC.006: Disattivazione di una categoria

**UI:**
1. Utente accede a "Impostazioni > Categorie > [Categoria]"
2. Cambia status da "active" a "inactive"
3. Submit

**Logic:**
1. Avvertenza: mostrare quanti prodotti e bundle usano questa categoria
2. Se confermato: status -> 'inactive'
3. Aggiornamento in `categories`
4. Inserimento in `ConfigurationHistory`

**Conseguenze:**
- La categoria non e piu disponibile in "Aggiungi categoria per prodotto"
- Prodotti/bundle che la usano non la presentano piu durante la vendita
- Vendite storiche non cambiano

## Calcolo dei default a runtime

### Algoritmo di risoluzione: Prodotto

Quando l'utente vende un prodotto e non ha scelto un tag per una categoria:

```javascript
function resolveDefaultForSale(productId, categoryId, db) {
  // 1. Controllare override prodotto
  const productCategory = await db.productCategories
    .where({ productId, categoryId, status: 'active' })
    .first();
  
  if (productCategory?.productDefault) {
    const tag = await db.tags.get(productCategory.productDefault);
    if (tag?.status === 'active') {
      return tag.id;  // Use product override
    }
  }
  
  // 2. Controllare default categoria
  const category = await db.categories.get(categoryId);
  if (category?.globalDefault) {
    const tag = await db.tags.get(category.globalDefault);
    if (tag?.status === 'active') {
      return tag.id;  // Use category default
    }
  }
  
  // 3. Nessun default
  return null;
}
```

### Algoritmo di risoluzione: Bundle

Quando l'utente vende un bundle e non ha scelto un tag per una categoria:

```javascript
function resolveBundleDefaultForSale(bundleId, categoryId, db) {
  // 1. Override esplicito del bundle
  const bundleOverride = await db.bundleOverrides
    .where({ bundleId, categoryId })
    .first();
  
  if (bundleOverride?.bundleDefault) {
    const tag = await db.tags.get(bundleOverride.bundleDefault);
    if (tag?.status === 'active') {
      return tag.id;  // Use bundle override
    }
  }
  
  // 2. Se il bundle contiene UN SOLO prodotto con questa categoria
  const bundle = await db.bundles.get(bundleId);
  const componentsWithCategory = await Promise.all(
    bundle.components.map(async (comp) => {
      const pc = await db.productCategories
        .where({ productId: comp.productId, categoryId, status: 'active' })
        .first();
      return pc;
    })
  );
  
  if (componentsWithCategory.length === 1 && componentsWithCategory[0]) {
    // Un solo componente ha questa categoria
    const productDefault = componentsWithCategory[0].productDefault;
    if (productDefault) {
      const tag = await db.tags.get(productDefault);
      if (tag?.status === 'active') {
        return tag.id;  // Use product default (unico)
      }
    }
  }
  
  // 3. Default categoria globale
  const category = await db.categories.get(categoryId);
  if (category?.globalDefault) {
    const tag = await db.tags.get(category.globalDefault);
    if (tag?.status === 'active') {
      return tag.id;  // Use category default
    }
  }
  
  // 4. Nessun default
  return null;
}
```

## Calcolo del prezzo a runtime

### Algoritmo di calcolo prezzo finale

Quando l'utente salva una riga di vendita, il prezzo finale e calcolato:

```javascript
function calculateSaleLinePrice(
  basePrice: number,
  selectedTagIds: string[],
  freeTextValues: { [categoryId: string]: string },
  db: Dexie
): number {
  let pricePercentageMultiplier = 1.0;
  let priceFixedAddition = 0;
  
  // Recuperare i tag
  const selectedTags = await Promise.all(
    selectedTagIds.map(id => db.tags.get(id))
  );
  
  // Iterare sui tag selezionati
  for (const tag of selectedTags) {
    if (!tag?.priceModifier) continue;
    
    if (tag.priceModifier.type === 'percentage') {
      // Percentuale: moltiplicare
      const percentageValue = tag.priceModifier.value;  // Es: +50 per +50%
      pricePercentageMultiplier *= (1 + percentageValue / 100);
    } else if (tag.priceModifier.type === 'fixed') {
      // Valore fisso: sommare
      priceFixedAddition += tag.priceModifier.value;
    }
  }
  
  // Calcolo finale
  let finalPrice = (basePrice * pricePercentageMultiplier) + priceFixedAddition;
  
  // Arrotondamento alla minima unita della valuta
  finalPrice = Math.round(finalPrice);
  
  // Non puo essere negativo
  if (finalPrice < 0) finalPrice = 0;
  
  return finalPrice;
}
```

**Esempio di applicazione:**
```
basePrice = 100
Tag 1: percentage +50% -> multiplier = 1.50
Tag 2: percentage -10% -> multiplier = 1.50 * 0.90 = 1.35
Tag 3: fixed +1000 (€10) -> addition = +1000

finalPrice = (100 * 1.35) + 1000 = 135 + 10 = 145
```

## Validazione della configurazione

### Validazione al salvataggio

Ogni operazione CRUD sulla configurazione deve passare queste validazioni:

1. **Unicita:** nessun duplicato di identificativi o nomi (dove richiesto)
2. **Integrità referenziale:** nessun FK orfano
   - productDefault deve referenziare un tag della categoria
   - categoryId in productCategories deve referenziare una categoria esistente
3. **Coerenza logica:**
   - Un prodotto non puo usare una categoria se la categoria e inactive (new)
   - Un bundle non puo contenere un prodotto inactive (new)
4. **Range di valori:**
   - Prezzi >= 0
   - Percentuali tra -999 e +999
   - Nomi non vuoti, < 100 caratteri
5. **Coerenza di bundle:** se bundle contiene un prodotto, e il prodotto viene eliminato, il bundle deve essere aggiornato o segnalato come incoerente

### Validazione prima dell'uso (runtime)

Prima di presentare categorie/tag all'utente durante una vendita:

1. Controllare che il prodotto/bundle sia active
2. Controllare che la categoria sia active
3. Controllare che i tag siano active
4. Mostrare solo tag active nella UI

## Esportazione e importazione della configurazione

### Export

Un export completo include:

```javascript
{
  "version": "2.0",
  "schemaVersion": "1.0",
  "exportDate": "2026-08-23T14:30:00Z",
  "data": {
    "categories": [...],
    "tags": [...],
    "products": [...],
    "productCategories": [...],
    "bundles": [...],
    "bundleOverrides": [...]
  }
}
```

Nota: `configurationHistory` non e esportato per privacy (traccia utente).

### Import

L'import deve:

1. Validare schema e versione
2. Validare ogni entita
3. Rilevare conflitti (es: categoria con stesso nome gia esiste)
4. Mostrare anteprima e opzioni di conflitto (replace, skip, merge)
5. Se confermato, importare in transazione atomica
6. Ricalcolare derivati (categorie ereditate di bundle)

## Future evoluzioni

### Versioning di configurazione

Consentire utente di salvare/caricare "snapshot" di configurazione e tornare a una versione precedente.

### Duplicazione di entita

Consentire duplicazione di categoria/tag/bundle con nome suggerito e possibilita di modificare prima del salvataggio.

### Template di configurazione

Offrire template predefiniti (es. "Artista illustratore", "Fumettista", "Editore") che pre-popola categorie/tag/bundle comuni.

### Condivisione di configurazione

Se autenticazione futura: condividere configurazione con altri utenti o team.

### Validazioni avanzate

Definire regole di validazione custom (es: "se tecnica='Digitale' allora formato deve essere 'Altro'").

### Pricing dinamico

Supportare formule di prezzo più complesse (es: prezzo per fascia di quantita).
