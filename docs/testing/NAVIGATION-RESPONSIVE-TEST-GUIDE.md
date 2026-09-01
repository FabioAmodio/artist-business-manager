# Guida ai Test: Navigazione Responsiva e Routing GitHub Pages

> **Piano di test storico della prima shell.** I casi sul routing GitHub Pages restano utili; matrici con Finanza, 9/11 voci o hamburger devono essere reinterpretate usando le 12 voci correnti, la sidebar da 700 px e la action bar mobile. Fonte: `src/app/core/navigation/app-navigation-config.ts`.

## Sommario dei Test

Questa guida fornisce una procedura completa per testare:
1. ✅ Routing su GitHub Pages (deep-link)
2. ✅ Navigazione responsiva su varie risoluzioni
3. ✅ Accessibilità e navigazione da tastiera
4. ✅ Comportamento dello stato attivo
5. ✅ Menu "Altro" (Hamburger)

---

## Parte 1: Test del Routing GitHub Pages

### Prerequisiti

- [ ] Progetto deployato su GitHub Pages
- [ ] Indirizzo: `https://username.github.io/artist-business-manager/`
- [ ] Browser con supporto JavaScript

### Test 1.1: Deep-Link alla Dashboard

**Procedura:**

1. Apri una finestra del browser
2. Copia e incolla l'URL direttamente:
   ```
   https://username.github.io/artist-business-manager/dashboard
   ```
3. Premi Enter

**Risultato Atteso:**

- ✅ La pagina carica senza errore 404
- ✅ Viene visualizzata la Dashboard
- ✅ L'URL rimane `/dashboard` (no query params visibili)
- ✅ Il caricamento è quasi istantaneo (< 1 secondo)

**Cosa Succede Dietro le Quinte:**

```
1. Browser: GET /artist-business-manager/dashboard
2. GitHub Pages: Risorsa non trovata → serve 404.html
3. 404.html script:
   - Estrae: /dashboard
   - Redirige: /?redirect=%2Fdashboard
4. Browser: GET /artist-business-manager/?redirect=%2Fdashboard
5. GitHub Pages: Serve index.html
6. App Angular:
   - Legge: redirect = %2Fdashboard
   - Chiama: router.navigateByUrl('/dashboard')
   - Naviga a /dashboard
7. Utente vede: Dashboard caricata
```

### Test 1.2: Deep-Link su Tutti i Percorsi

**Procedura:**

Ripeti il Test 1.1 per ogni rotta:

| Rotta | URL | Note |
|-------|-----|------|
| Dashboard | `/dashboard` | Esatto (exact: true) |
| Lavori | `/works` | Test con inventory |
| Clienti | `/clients` | Test con lista |
| Fornitori | `/suppliers` | Test con lista |
| Acquisti | `/purchases` | Test con lista |
| Eventi | `/events` | Test calendario |
| Vendite | `/sales` | Test storico |
| Prodotti | `/catalog` | Test con lista |
| Finanza | `/finance` | Test report |
| Scadenze | `/deadlines` | Test calendar |
| Impostazioni | `/settings` | Test config |

**Risultato Atteso:**

- ✅ Ogni URL naviga alla pagina corretta
- ✅ Nessun errore 404
- ✅ URL rimane pulita (senza query params)

### Test 1.3: Deep-Link con Query Parameters

**Procedura:**

1. Accedi a:
   ```
   https://username.github.io/artist-business-manager/sales?year=2024&month=3
   ```
2. Verifica che i parametri vengano preservati

**Risultato Atteso:**

- ✅ Naviga a `/sales`
- ✅ I query params `?year=2024&month=3` rimangono nell'URL
- ✅ L'app può accedervi via `ActivatedRoute.queryParams`

### Test 1.4: Deep-Link con Hash Fragment

**Procedura:**

1. Accedi a:
   ```
   https://username.github.io/artist-business-manager/catalog#materials
   ```
2. Verifica che l'hash sia preservato

**Risultato Atteso:**

- ✅ Naviga a `/catalog`
- ✅ L'hash `#materials` rimane
- ✅ La pagina scrolls verso l'elemento se esiste

### Test 1.5: Stabilità Dopo Reload

**Procedura:**

1. Naviga a:
   ```
   https://username.github.io/artist-business-manager/works
   ```
2. Premi F5 per fare reload della pagina
3. Aspetta il caricamento

**Risultato Atteso:**

- ✅ La pagina rimane su `/works` dopo il reload
- ✅ Nessuna perdita di stato (se l'app ne gestisce)

---

## Parte 2: Test della Navigazione Responsive

### Prerequisiti

- [ ] Progetto in esecuzione localmente (npm start)
- [ ] Accedi a: `http://localhost:4200`
- [ ] Strumenti di sviluppo del browser aperti (F12)

### Test 2.1: Visualizzazione Desktop (≥1024px)

**Setup:**

1. Apri DevTools (F12)
2. Clicca su "Toggle Device Toolbar" (Ctrl+Shift+M)
3. Imposta la risoluzione a: **1920x1080** (Desktop)

**Procedura:**

1. Osserva la sidebar sinistra
2. Scorri il mouse sopra i menu item
3. Clicca su diversi menu item

**Risultato Atteso:**

- ✅ Sidebar è visibile sulla sinistra
- ✅ Tutti i 9 menu item sono visibili:
  - 📊 Dashboard
  - ✓ Lavori
  - 👥 Clienti
  - 📅 Eventi
  - 💰 Vendite
   - 📦 Prodotti
  - 💳 Finanza
  - ⏰ Scadenze
  - ⚙ Impostazioni
- ✅ Nessun menu "Più" (Altro) è visibile
- ✅ Hover effect: background cambia leggermente
- ✅ Click su item naviga alla pagina

### Test 2.2: Visualizzazione Tablet (640px - 1023px)

**Setup:**

1. DevTools aperto
2. Imposta risoluzione a: **768x1024** (Tablet Portrait)

**Procedura:**

1. Osserva la sidebar
2. Conta quanti item sono visibili
3. Cerca il bottone "Più" (hamburger icon ⋯)
4. Clicca su "Più"

**Risultato Atteso:**

- ✅ Sidebar è ancora visibile
- ✅ Alcuni item sono nascosti (non tutti i 9 fit)
- ✅ Bottone "Più" è visibile
- ⚠️ Nota il numero di item visibili
- ✅ Click su "Più" apre un dropdown menu
- ✅ Il dropdown mostra TUTTI i 9 item (anche duplicati)
- ✅ Icona della barra di scorrimento è visibile se necessario
- ✅ Click su item nel menu naviga e chiude il menu

### Test 2.3: Visualizzazione Mobile (<640px)

**Setup:**

1. DevTools aperto
2. Imposta risoluzione a: **390x844** (iPhone SE)

**Procedura:**

1. Osserva la sidebar/header
2. Verifica il posizionamento del menu "Più"
3. Clicca su "Più"
4. Osserva come si apre il menu

**Risultato Atteso:**

- ✅ Sidebar è nascosta o minimizzata
- ✅ Solo il bottone "Più" è visibile (o nel header)
- ✅ Click su "Più" apre un menu fullscreen dal basso
- ✅ Menu occupa ~70% della viewport
- ✅ Header "Altre opzioni" con pulsante chiudi
- ✅ Tutti i 9 item sono nel menu
- ✅ Scroll funziona se necessario
- ✅ Click su item naviga e menu si chiude automaticamente
- ✅ Pulsante "✕" chiude il menu

### Test 2.4: Ridimensionamento Finestra

**Procedura:**

1. DevTools aperto con Device Toolbar
2. Inizia a 1920px (Desktop)
3. Trascina il margine sinistro del browser verso destra per ridurre la larghezza
4. Osserva il comportamento a 1024px, 768px, 640px, 390px

**Risultato Atteso:**

- ✅ A 1024px: Tutti gli item visibili
- ✅ A 768px: Alcuni nascosti, menu "Più" appare
- ✅ A 640px: Menu "Più" è prominente
- ✅ A 390px: Menu "Più" domina, sidebar nascosta
- ✅ Transizioni smooth (no salti improvvisi)

### Test 2.5: Comportamento After Navigation

**Procedura:**

1. Su mobile (390px)
2. Clicca su "Più" → Menu apre
3. Clicca su "Lavori"
4. Osserva: menu si chiude? Navigazione avviene?

**Risultato Atteso:**

- ✅ Menu si chiude automaticamente
- ✅ Navigazione a `/works` avviene
- ✅ Pagina Lavori viene caricata
- ✅ Nessun errore in console

---

## Parte 3: Test della Navigazione da Tastiera

### Prerequisiti

- [ ] Progetto in esecuzione localmente
- [ ] Strumenti di sviluppo aperti (Console pulita)
- [ ] Nessun mouse usato in questa sezione

### Test 3.1: Tab Navigation - Desktop

**Setup:**

1. Risoluzione: 1920x1080
2. Clicca sul logo "AB" in alto a sinistra
3. Premi **Tab** ripetutamente

**Procedura:**

1. Osserva quale elemento riceve il focus
2. Nota l'ordine di focus

**Risultato Atteso:**

- ✅ Focus inizia dal logo "AB"
- ✅ Si muove a "Tema" button
- ✅ Si muove ai menu item della sidebar (uno per uno)
- ✅ Ogni elemento ha un outline chiaro (focus-visible)
- ✅ L'ordine è logico e prevedibile

### Test 3.2: Tab Navigation - Mobile con Menu Aperto

**Setup:**

1. Risoluzione: 390x844
2. Premi **Tab** fino a raggiungere il bottone "Più"
3. Premi **Enter** per aprire il menu

**Procedura:**

1. Continua a premere **Tab**
2. Osserva il focus dentro il menu

**Risultato Atteso:**

- ✅ Focus è sul bottone "Più" (evidenziato)
- ✅ Premi Enter → Menu apre
- ✅ Focus si sposta al primo item del menu
- ✅ Tab itera attraverso tutti gli item
- ✅ Tab dopo l'ultimo item torna al bottone chiudi
- ✅ Tab dopo chiudi esce dal menu

### Test 3.3: Enter/Space per Navigare

**Procedure:**

1. Desktop: Tab fino a raggiungere "Lavori"
2. Premi **Enter** (o **Space**)
3. Osserva la navigazione

**Risultato Atteso:**

- ✅ Navigazione a `/works` avviene
- ✅ URL cambia
- ✅ Pagina Lavori carica

### Test 3.4: Escape per Chiudere Menu

**Setup:**

1. Mobile: Apri il menu "Più"
2. Premi **Escape**

**Risultato Atteso:**

- ✅ Menu si chiude
- ⚠️ Se non implementato: Nessun comportamento (accettabile per MVP)

---

## Parte 4: Test dello Stato Attivo

### Prerequisiti

- [ ] Progetto in esecuzione localmente
- [ ] Console browser aperta

### Test 4.1: Active State - Desktop

**Procedura:**

1. Risoluzione: 1920x1080
2. Clicca su "Lavori"
3. Osserva la sidebar

**Risultato Atteso:**

- ✅ "Lavori" menu item è evidenziato
- ✅ Background è più scuro (var(--color-surface-tertiary))
- ✅ Bordo sinistro è colorato (var(--color-accent))
- ✅ Font è più bold (font-weight: semibold)
- ✅ Gli altri item NON sono evidenziati

### Test 4.2: Active State - Menu "Più" Desktop

**Procedura:**

1. Risoluzione: 768x1024
2. Alcuni item sono nascosti nel menu "Più"
3. Clicca su "Più" → Menu apre
4. Osserva l'item attualmente attivo

**Risultato Atteso:**

- ✅ L'item attivo nella sidebar è evidenziato
- ✅ Lo STESSO item nel menu "Più" è ANCHE evidenziato
- ✅ Entrambi hanno active styling
- ✅ È chiaro quale pagina è attuale

### Test 4.3: Active State - Navigazione

**Procedura:**

1. Sei su "Lavori" (è active)
2. Clicca su "Clienti"
3. Aspetta il caricamento della pagina
4. Osserva

**Risultato Atteso:**

- ✅ "Lavori" non è più evidenziato
- ✅ "Clienti" è ora evidenziato
- ✅ Transizione è smooth (no flash)

### Test 4.4: Active State - Dashboard (Exact: true)

**Procedura:**

1. Naviga a `/dashboard`
2. Osserva il menu

**Risultato Atteso:**

- ✅ Solo "Dashboard" è evidenziato
- ✅ Gli altri item NON sono evidenziati
- ⚠️ Nota: Dashboard ha `exact: true` perché la home page

**Procedura 2:**

1. Naviga a `/works`
2. Clicca su Dashboard nel menu
3. Torna a `/dashboard`

**Risultato Atteso:**

- ✅ Dashboard rimane evidenziato
- ✅ Nessun effetto collaterale da altri item

---

## Parte 5: Test del Menu "Altro"

### Prerequisiti

- [ ] Progetto in esecuzione localmente
- [ ] Tablet resolution (768px)

### Test 5.1: Bottone "Più" - Presenza

**Procedura:**

1. Risoluzione: 768x1024
2. Osserva la sidebar

**Risultato Atteso:**

- ✅ Bottone "Più" è visibile
- ✅ Ha icona "⋯" 
- ✅ Ha label "Altro"
- ✅ È posizionato in basso nella sidebar (o dopo gli item visibili)

### Test 5.2: Bottone "Più" - Styling

**Procedura:**

1. Hover sul bottone "Più"
2. Osserva il colore

**Risultato Atteso:**

- ✅ Background cambia (hover effect)
- ✅ Transizione smooth (0.2s)
- ✅ Colore coerente con design system

### Test 5.3: Menu "Più" - Apertura

**Procedura:**

1. Clicca su "Più"
2. Osserva il menu

**Risultato Atteso:**

- ✅ Menu appare con animazione slide-up (0.2s)
- ✅ Menu è posizionato sotto il bottone "Più"
- ✅ Menu ha border e shadow
- ✅ Menu ha header "Altre opzioni"

### Test 5.4: Menu "Più" - Contenuto

**Procedura:**

1. Menu è aperto
2. Conta gli item

**Risultato Atteso:**

- ✅ Ci sono 9 item (tutti)
- ✅ Inclusi gli item già visibili nella sidebar
- ✅ Inclusa l'item attualmente attiva
- ✅ Item attiva ha styling active

### Test 5.5: Menu "Più" - Chiusura

**Procedura:**

1. Menu è aperto
2. Clicca su uno degli item

**Risultato Atteso:**

- ✅ Menu si chiude
- ✅ Navigazione avviene
- ✅ Nessun rimbalzo (no flicker)

**Procedura 2:**

1. Menu è aperto
2. Clicca sul pulsante "✕"

**Risultato Atteso:**

- ✅ Menu si chiude
- ✅ Nessuna navigazione
- ✅ Rimani sulla pagina attuale

### Test 5.6: Menu "Più" - Scroll

**Setup:**

1. Risoluzione: 300x600 (molto piccolo)
2. Apri il menu "Più"

**Procedura:**

1. Se il menu non entra completamente, prova a scrollare

**Risultato Atteso:**

- ✅ Se necessario, scroll funziona
- ⚠️ Se tutti gli item fit: Nessun scroll bar (accettabile)

---

## Parte 6: Test di Accessibilità

### Prerequisiti

- [ ] Browser con screen reader (NVDA, JAWS, VoiceOver)
- [ ] Oppure: Axe DevTools per accessibility audit
- [ ] Progetto in esecuzione

### Test 6.1: ARIA Labels

**Procedura:**

1. Usa browser DevTools → Inspector
2. Seleziona il bottone "Più"
3. Osserva gli attributi ARIA

**Risultato Atteso:**

- ✅ aria-label="Mostra altri elementi di navigazione"
- ✅ aria-haspopup="menu"
- ✅ aria-expanded="true" o "false"

### Test 6.2: Screen Reader - Menu

**Procedura:**

1. Attiva screen reader
2. Naviga al bottone "Più"
3. Ascolta l'annuncio

**Risultato Atteso:**

- ✅ Screen reader annuncia: "Mostra altri elementi di navigazione, menu button"
- ✅ Quando è aperto: "espanso" o "aria-expanded true"

### Test 6.3: Focus Visible

**Procedura:**

1. Usa Tab per navigare
2. Osserva ogni elemento

**Risultato Atteso:**

- ✅ Ogni elemento ha outline visibile (2px) quando ha focus
- ✅ Outline è color `var(--color-accent)` (visibile)
- ✅ Contrasto è sufficiente (WCAG AA)

### Test 6.4: Axe DevTools Audit

**Procedura:**

1. Installa Axe DevTools Extension
2. Apri DevTools
3. Click su "Scan ALL of my page"
4. Osserva i risultati

**Risultato Atteso:**

- ✅ No "Critical" issues
- ✅ No "Serious" issues
- ✅ "Minor" issues accettabili (es: best practices)

---

## Parte 7: Test di Performance

### Prerequisiti

- [ ] Progetto in esecuzione
- [ ] DevTools aperto su Network tab
- [ ] Throttling: Fast 3G (Simulate slow network)

### Test 7.1: Initial Load

**Procedura:**

1. Vai a http://localhost:4200
2. Osserva il tempo di caricamento

**Risultato Atteso:**

- ✅ Pagina carica in < 3 secondi (con throttling)
- ✅ Nessun blocco di rendering
- ✅ Menu è interattivo subito

### Test 7.2: Navigation Performance

**Procedura:**

1. Sei su Dashboard
2. Clicca su "Lavori"
3. Osserva il tempo di transizione

**Risultato Atteso:**

- ✅ Transizione in < 500ms
- ✅ Nessun "layout shift" visibile
- ✅ Menu rimane interattivo

### Test 7.3: Bundle Size

**Procedura:**

1. Esegui: `npm run build`
2. Osserva l'output della build

**Risultato Atteso:**

- ✅ bundle.js: < 150 kB (con gzip)
- ⚠️ Nota: CSS bundle potrebbe essere leggermente più grande

---

## Test Checklist - Completamento

Copia questa checklist per tracciare i progressi:

### Routing (Sezione 1)
- [ ] Test 1.1: Deep-link Dashboard
- [ ] Test 1.2: Deep-link su tutti i percorsi
- [ ] Test 1.3: Deep-link con query parameters
- [ ] Test 1.4: Deep-link con hash
- [ ] Test 1.5: Stabilità dopo reload

### Responsive (Sezione 2)
- [ ] Test 2.1: Desktop view
- [ ] Test 2.2: Tablet view
- [ ] Test 2.3: Mobile view
- [ ] Test 2.4: Window resizing
- [ ] Test 2.5: After navigation behavior

### Tastiera (Sezione 3)
- [ ] Test 3.1: Tab navigation desktop
- [ ] Test 3.2: Tab navigation mobile
- [ ] Test 3.3: Enter/Space navigation
- [ ] Test 3.4: Escape per chiudere (optional)

### Stato Attivo (Sezione 4)
- [ ] Test 4.1: Active state desktop
- [ ] Test 4.2: Active state in "Più" menu
- [ ] Test 4.3: Active state dopo navigazione
- [ ] Test 4.4: Active state dashboard (exact)

### Menu "Altro" (Sezione 5)
- [ ] Test 5.1: Bottone "Più" presente
- [ ] Test 5.2: Bottone "Più" styling
- [ ] Test 5.3: Menu apertura
- [ ] Test 5.4: Menu contenuto
- [ ] Test 5.5: Menu chiusura
- [ ] Test 5.6: Menu scroll

### Accessibilità (Sezione 6)
- [ ] Test 6.1: ARIA labels
- [ ] Test 6.2: Screen reader
- [ ] Test 6.3: Focus visible
- [ ] Test 6.4: Axe audit

### Performance (Sezione 7)
- [ ] Test 7.1: Initial load
- [ ] Test 7.2: Navigation
- [ ] Test 7.3: Bundle size

---

## Debugging

### Se il routing non funziona localmente

**Problema:** Deep-link su localhost funziona, ma non su GitHub Pages

**Diagnosi:**
```javascript
// In console del browser:
// Su localhost:
window.location.pathname // /dashboard

// Su GitHub Pages:
window.location.pathname // /artist-business-manager/dashboard
```

**Soluzione:** Verificare che `angular.json` abbia:
```json
"outputPath": "dist/...",
"baseHref": "/artist-business-manager/",
"deployUrl": "/artist-business-manager/"
```

### Se il menu "Più" non appare

**Problema:** Bottone "Più" non è visibile anche su risoluzioni piccole

**Diagnosi:**
```typescript
// In component TypeScript:
console.log(this.visibleCount()); // Deve essere < 9
console.log(this.hasMoreItems()); // Deve essere true
```

**Soluzione:** Verificare `calculateVisibleItems()` e breakpoint di 700px

### Se items non sono evidenziati correttamente

**Problema:** Active state non funziona

**Diagnosi:**
```html
<!-- Verificare routerLinkActive -->
<a routerLink="/dashboard" routerLinkActive="active">
  <!-- Deve avere classe "active" quando percorso corrisponde -->
</a>
```

**Soluzione:** Verificare che i path in `app-navigation-config.ts` corrispondano esattamente a `app.routes.ts`

---

## Conclusione

Questa guida completa fornisce una procedura sistematica per testare:
✅ Routing su GitHub Pages
✅ Navigazione responsiva
✅ Accessibilità
✅ Performance

Completare tutti i test garantisce un'esperienza utente di qualità.
