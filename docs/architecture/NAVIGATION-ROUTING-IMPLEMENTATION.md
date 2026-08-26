# Navigazione Responsiva e Routing su GitHub Pages

## Panoramica

Questo documento descrive le soluzioni implementate per:
1. **Routing su GitHub Pages:** Permettere deep-link diretti a qualsiasi rotta senza errori 404
2. **Navigazione responsiva:** Menu intelligente che si adatta a diverse dimensioni di schermo

## Problema 1: Routing su GitHub Pages

### Il Problema

Quando un utente tenta di accedere direttamente a un URL come:
```
https://username.github.io/artist-business-manager/dashboard
```

GitHub Pages restituisce un errore 404 perché:
1. GitHub Pages serve solo file statici
2. Non esiste un file fisico `/dashboard.html`
3. L'app Angular dovrebbe essere caricata da `index.html` e gestire il routing lato client

### La Soluzione: SPA Redirect Pattern

La soluzione utilizza il pattern classico di redirect SPA per GitHub Pages:

#### Step 1: 404.html come Entry Point

Quando GitHub Pages non trova un file, serve automaticamente `public/404.html`.

**File:** `public/404.html`

Il file esegue un script JavaScript che:
1. Intercetta la richiesta 404
2. Estrae il percorso richiesto (es: `/dashboard`)
3. Redirige l'utente a `index.html` con il percorso memorizzato come query parameter
4. L'app Angular recupera il percorso e naviga di conseguenza

```javascript
// Pseudo-codice del flusso:
// 1. Utente accede a /artist-business-manager/dashboard
// 2. GitHub Pages ritorna 404.html
// 3. 404.html redirige a /?redirect=/dashboard
// 4. index.html viene caricato
// 5. App Angular naviga a /dashboard
```

#### Step 2: App Component Intercetta il Redirect

**File:** `src/app/app.ts`

L'App component controlla i query params all'avvio:

```typescript
export class App {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {
    // Controlla se c'è un parametro 'redirect' (da 404.html)
    effect(() => {
      const queryParams = this.route.snapshot.queryParams;
      if (queryParams['redirect']) {
        const redirectPath = queryParams['redirect'];
        // Naviga al percorso originariamente richiesto
        this.router.navigateByUrl(redirectPath);
      }
    });
  }
}
```

### Come Funziona

1. **Utente accede a:** `https://username.github.io/artist-business-manager/dashboard`
2. **GitHub Pages:**
   - Cerca il file `/artist-business-manager/dashboard`
   - Non lo trova
   - Serve `404.html`
3. **404.html Script:**
   - Estrae il percorso richiesto: `/dashboard`
   - Redirige il browser a: `/?redirect=%2Fdashboard` (URL-encoded)
4. **Browser naviga a:** `https://username.github.io/artist-business-manager/?redirect=%2Fdashboard`
5. **GitHub Pages serve:** `index.html`
6. **App Angular:**
   - Parte dalla route root
   - Legge il query param `redirect`
   - Naviga automaticamente a `/dashboard`

### Vantaggi di Questa Soluzione

✅ **Semplice:** Non richiede modifiche al server (GitHub Pages)
✅ **Affidabile:** Funziona con tutti i client
✅ **Compatibile:** Non interferisce con il routing interno
✅ **Performante:** Non causa redirect a catena
✅ **Mantiene i params:** Query string e hash originali sono preservati

### Alternative Considerate

| Approccio | Pro | Contro | Usato |
|---|---|---|---|
| **Hash Routing** (`#/dashboard`) | Funziona subito con GH Pages | Non è REST-friendly, cambia URL | ❌ |
| **404.html Redirect** | Mantiene URL REST, funziona sempre | Richiede 404.html | ✅ Scelto |
| **Base-href Fix** | Semplice configurazione | Non risolve il problema 404 | ❌ |

## Problema 2: Navigazione Responsiva

### Il Problema

L'app ha una sidebar con 11 voci di navigazione:
- Dashboard
- Lavori
- Clienti
- Fornitori
- Acquisti
- Eventi
- Vendite
- Prodotti
- Finanza
- Scadenze
- Impostazioni

Su schermi piccoli/medi, non tutte le voci entrano nello spazio disponibile:
- Testo viene tagliato
- Scroll orizzontale indesiderato
- Esperienza UX compromessa

### La Soluzione: ResponsiveNavComponent

#### Architettura

**1. Navigation Configuration**

**File:** `src/app/core/navigation/app-navigation-config.ts`

Definisce centralizzata di tutte le voci di navigazione:

```typescript
export interface NavigationItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

export const APP_NAVIGATION_ITEMS: NavigationItem[] = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/works', label: 'Lavori', icon: '✓' },
  // ... altre voci
];
```

**Vantaggi:**
- Singola fonte di verità per tutte le rotte
- Facile aggiungere/rimuovere/modificare voci
- Configurazione separata dalla presentazione

**2. ResponsiveNavComponent**

**File:** `src/app/core/navigation/responsive-nav.component.ts`

Componente standalone che gestisce:
- Visualizzazione dei menu item
- Calcolo dinamico degli item visibili
- Menu "Più" (hamburger) per item in eccesso
- Gestione dello stato attivo
- Accessibilità e navigazione da tastiera

**Funzionalità principali:**

```typescript
// Calcola quanti item stanno nello spazio disponibile
calculateVisibleItems(): void {
  // Mostra tutti gli item se c'è spazio
  // Nasconde il resto nel menu "Più"
}

// Segnale per tracciare se il menu "Più" è aperto
moreMenuOpen = signal(false);

// Computed: solo gli item visibili
visibleItems: Signal<NavigationItem[]> = computed(() => {
  return this.navigationItems.slice(0, this.visibleCount());
});

// Computed: ci sono altri item?
hasMoreItems: Signal<boolean> = computed(() => {
  return this.visibleCount() < this.navigationItems.length;
});
```

**Behavior:**

| Viewport | Comportamento |
|---|---|
| Desktop (≥700px) | Tutti gli item visibili nella sidebar |
| Tablet (500-699px) | Item che entrano visibili, resto nel menu "Più" |
| Mobile (<500px) | Menu "Più" diventa hamburger fullscreen |

#### Template

Il componente mostra:

1. **Main Navigation Bar**
   - Mostra solo `visibleItems()`
   - Ogni item con icona e label
   - Active state con `routerLinkActive`

2. **"Più" Button** (se `hasMoreItems()`)
   - Icona "⋯"
   - Label "Altro"
   - Simile a un menu item
   - Highlight quando menu è aperto

3. **More Menu Dropdown**
   - Mostra TUTTI gli item (sia visibili che nascosti)
   - Header con titolo e pulsante chiudi
   - Scroll se necessario
   - Items cliccabili, menu si chiude automaticamente
   - Active state evidenziato

#### Styling

**Tema di Colore:**
```css
/* Usa variabili di tema globali */
--color-text-primary: testo principale
--color-surface-tertiary: background hover
--color-accent: colore di evidenza (active)
--color-border: bordi
```

**Animazioni:**
- Slide-up per menu dropdown (0.2s)
- Hover effect su items
- Focus visible per accessibilità

**Responsive:**
```css
/* Desktop: mostra tutto */
@media (min-width: 700px) {
  .sidebar-nav { display: flex; }
  .nav-more-menu { display: none; }
}

/* Mobile: mostra solo "Più" menu */
@media (max-width: 699px) {
  .sidebar-nav { display: none; }
  .nav-more-menu { position: fixed; bottom: 0; }
}
```

#### Accessibilità

Il componente implementa le migliori pratiche WCAG:

1. **Attributi ARIA:**
   - `aria-label` per ogni elemento
   - `aria-expanded` sul bottone "Più"
   - `role="menu"` sul dropdown
   - `role="menuitem"` sugli item del menu

2. **Navigazione da Tastiera:**
   - Tab funziona correttamente
   - Enter/Space attiva i link
   - Escape chiude il menu (se implementato)
   - Focus è visibile (outline 2px)

3. **Screen Reader:**
   - Tutti i bottoni hanno label
   - Menu è annunciato come menu
   - Active state è indicato

### Integrazione nell'App

**1. Configurazione Navigation**

Nel componente App, il ResponsiveNavComponent è importato:

```typescript
@Component({
  imports: [
    RouterLink, RouterLinkActive, RouterOutlet,
    ResponsiveNavComponent, // ← Nuovo componente
  ],
  // ...
})
```

**2. Utilizzo nel Template**

```html
<aside class="sidebar">
  <p class="nav-label">Workspace</p>
  <app-responsive-nav></app-responsive-nav>
  <!-- resto del sidebar -->
</aside>
```

**3. CSS Aggiornato**

In `app.css`:
- Stili per compatibilità con ResponsiveNavComponent
- Media query per adattamento mobile
- Nasconde la versione vecchia su mobile
- Preserva layout desktop

### Comportamento Desiderato (Riassunto)

| Requisito | Implementazione |
|---|---|
| 1. Su desktop tutti visibili | ✅ Tutti gli item mostrati in sidebar |
| 2. Small screen: solo quelli che entrano | ✅ `visibleItems()` calcolato dinamicamente |
| 3. Eccedenti in menu "Altro" | ✅ Menu "Più" con list di tutti gli item |
| 4. Menu "Altro" mostra elenco completo | ✅ Mostra tutti gli item, inclusi visibili |
| 5. Voce attiva evidenziata | ✅ `routerLinkActive="active"` in ambo i posti |
| 6. Evitare scroll orizzontale | ✅ Nessun overflow-x, items nascosti dinamicamente |
| 7. Accessibilità e tastiera | ✅ ARIA, focus visible, keyboard nav |

## File Modificati

### 1. public/404.html
- **Cosa:** Script di redirect SPA per GitHub Pages
- **Motivo:** Permettere deep-link diretti
- **Come:** Intercetta 404, redirige a index.html con query param

### 2. src/app/app.ts
- **Cosa:** Gestisce il redirect dal 404.html
- **Motivo:** Naviga al percorso originariamente richiesto
- **Come:** Effect che controlla query params e naviga

### 3. src/app/app.html
- **Cosa:** Sostituisce navbar hardcoded con componente responsivo
- **Motivo:** Usare la nuova architettura di navigazione
- **Come:** `<app-responsive-nav></app-responsive-nav>`

### 4. src/app/app.css
- **Cosa:** Aggiunge stili per il menu responsivo
- **Motivo:** Supportare il nuovo comportamento su mobile
- **Come:** Media query e classe nasconde nav standard su mobile

### 5. src/app/core/navigation/app-navigation-config.ts (NEW)
- **Cosa:** Configurazione centralizzata delle voci di navigazione
- **Motivo:** Singola fonte di verità
- **Come:** Array di NavigationItem esportato

### 6. src/app/core/navigation/responsive-nav.component.ts (NEW)
- **Cosa:** Componente responsive della navigazione
- **Motivo:** Gestire dinamicamente gli item visibili
- **Come:** Signal per tracciare stato e item visibili

## Testing

### Test del Routing

1. **Deep Link Diretto:**
   ```bash
   # Accedi a questa URL direttamente (non tramite navigazione)
   https://username.github.io/artist-business-manager/dashboard
   # Dovrebbe navigare a dashboard senza errore 404
   ```

2. **Altre Rotte:**
   ```bash
   /works, /clients, /events, /sales, /catalog, /finance, /deadlines, /settings
   # Tutte dovrebbero funzionare via deep-link
   ```

3. **Query Params e Hash:**
   ```bash
   # Con query params
   https://username.github.io/artist-business-manager/works?id=123&name=test
   
   # Con hash
   https://username.github.io/artist-business-manager/sales#section
   ```

### Test della Navigazione Responsiva

1. **Desktop (≥700px):**
   - [ ] Tutti i 9 item visibili nella sidebar
   - [ ] Nessun menu "Più"
   - [ ] Click su item naviga correttamente
   - [ ] Active state evidenziato

2. **Tablet (500-699px):**
   - [ ] Alcuni item visibili, alcuni nascosti
   - [ ] Menu "Più" presente e funzionante
   - [ ] Click su "Più" apre/chiude il menu
   - [ ] Menu mostra tutti gli item
   - [ ] Active state corretto in entrambi i posti

3. **Mobile (<500px):**
   - [ ] Sidebar non visibile (solo "Più" come hamburger)
   - [ ] Menu "Più" apre fullscreen dal basso
   - [ ] Scroll funziona nel menu se necessario
   - [ ] Click su item naviga e chiude menu
   - [ ] Nessuno scroll orizzontale

4. **Accessibilità:**
   - [ ] Tab funziona correttamente
   - [ ] Focus è visibile su tutti gli elementi
   - [ ] Screen reader annuncia correttamente
   - [ ] Escape chiude il menu (se implementato)

## Performance

### Considerazioni

1. **ResizeObserver:** Attualmente usa `setTimeout` per calcolare gli item visibili
   - **Alternativa:** Usare `ResizeObserver` per precisione
   - **Trade-off:** Complessità vs. Perfezionamento

2. **Signals:** Usa Angular Signals per reattività
   - **Pro:** Performance, no zone.js overhead
   - **Con:** Richiede Angular 18+

3. **Lazy Loading:** Component è standalone
   - **Pro:** Can be imported on-demand
   - **Con:** Non è lazy-loaded per ora

## Evoluzioni Future

1. **Collapsible Sidebar:** Bottone per collapsare/espandere sidebar
2. **Dark Mode:** Già predisposto per design system
3. **Custom Navigation Items:** Da app configuration
4. **Keyboard Shortcuts:** Per jump rapido tra sezioni
5. **Breadcrumb:** Mostrare percorso attuale
6. **Search Navigation:** Ricerca rapida tra voci

## Troubleshooting

### Il routing non funziona su GitHub Pages

**Causa:** 404.html non è configurato correttamente
**Soluzione:** Verificare:
```bash
ls public/404.html  # File esiste?
grep "redirect" public/404.html  # Script è presente?
```

### Il menu "Più" non appare

**Causa:** `hasMoreItems()` è sempre false
**Soluzione:** Verificare:
```typescript
// Controllare visibleCount nel browser console
// Dovrebbe essere < 9
```

### Items non sono evidenziati come attivi

**Causa:** `routerLinkActive` non è sincronizzato
**Soluzione:** Verificare:
```typescript
// Paths in config matches routes esattamente
// Es: `/dashboard` non `dashboard`
```

## Conclusione

La soluzione implementa due miglioramenti chiave:

1. ✅ **Routing GitHub Pages:** Permette deep-link diretti senza 404
2. ✅ **Navigazione Responsiva:** Menu intelligente che si adatta allo schermo

Entrambe mantengono accessibilità, performance e UX di qualità.
