# Design System

## Obiettivi e principi

### Obiettivi

L'interfaccia di Artist Business Manager deve essere:

- **Colorata:** utiliza una palette ricca e professionale che rispecchia il mondo creativo
- **Creativa:** inspira fiducia negli artisti attraverso un design moderno e accattivante
- **Professionale:** comunica competenza, affidabilita e solidita gestionale
- **Leggibile:** garantisce chiarezza, contrasto e accessibilita per tutti gli utenti
- **Equilibrata:** bilancia elementi visuali, spazi bianchi e densita informativa
- **Non infantile:** evita eccessive semplicificazioni o patronage
- **Non eccessivamente minimale:** fornisce visual feedback e guida chiara all'utente

### Target

- Artisti e illustratori
- Fumettisti e autori grafici
- Piccoli editori e autori indipendenti
- Creativi indipendenti e professionisti

## Palette di colori

### Ispirazione CMYK

La palette e ispirata ai colori di stampa CMYK (Cyan, Magenta, Yellow, Black), desaturati e professionalizzati per creare un'identita visiva moderna e coerente con il mondo creativo.

### Colori primari

Questi colori formano la base dell'identita di marca e vengono usati per azioni primarie, accenti e evidenziazioni.

| Nome | Hex | RGB | CMYK | Uso |
|---|---|---|---|---|
| Artist Cyan | #0B8FA0 | 11, 143, 160 | 93%, 11%, 0%, 37% | Azioni primarie, accenti principali |
| Artist Magenta | #C41D7F | 196, 29, 127 | 0%, 85%, 35%, 23% | Accenti secondari, evidenziazioni |
| Artist Yellow | #F5C614 | 245, 198, 20 | 0%, 19%, 92%, 4% | Avvertenze, successi, highlight |
| Artist Black | #2C2C2C | 44, 44, 44 | 0%, 0%, 0%, 83% | Testo principale, bordi, ombre |

### Colori secondari

Varianti desaturate e professionali per contesti specifici.

| Nome | Hex | RGB | CMYK | Uso |
|---|---|---|---|---|
| Cyan Light | #5DCEDB | 93, 206, 219 | 58%, 6%, 0%, 14% | Hover, background secondario |
| Cyan Pale | #E0F5F7 | 224, 245, 247 | 9%, 1%, 0%, 3% | Background leggero |
| Magenta Light | #E85BA8 | 232, 91, 168 | 0%, 61%, 28%, 9% | Hover secondario |
| Magenta Pale | #F9E5F1 | 249, 229, 241 | 0%, 8%, 3%, 2% | Background leggero |
| Yellow Dark | #D4A600 | 212, 166, 0 | 0%, 22%, 100%, 17% | Testo su yellow, accenti scuri |
| Yellow Pale | #FEF9E7 | 254, 249, 231 | 0%, 2%, 9%, 0% | Background, area focus |

### Colori di stato

Per comunicare chiaramente lo stato delle operazioni e dei dati.

| Nome | Hex | Significato |
|---|---|---|
| Success Green | #28A745 | Completamento, success, operazione positiva |
| Warning Orange | #FFC107 | Avvertenza, attenzione, azione richiesta |
| Error Red | #DC3545 | Errore, impossibilita, azione vietata |
| Info Blue | #17A2B8 | Informazione, suggerimento, nota |
| Neutral Gray | #6C757D | Stato neutrale, testo secondario, disabled |

### Colori di sfondo e bordi

| Nome | Hex | Uso |
|---|---|---|
| White | #FFFFFF | Background principale, card, modal |
| Light Gray | #F8F9FA | Background secondario, sezioni |
| Border Gray | #DEE2E6 | Bordi, separatori, divisori |
| Dark Gray | #495057 | Testo secondario, placeholder |
| Black | #000000 | Overlay, shadow, maximum contrast |

## Design tokens

I design token definiscono valori riutilizzabili per colori, tipografia, spaziatura, elevazione e altri attributi di stile.

### Token di colore

```css
/* Primari */
--color-primary-cyan: #0B8FA0;
--color-primary-magenta: #C41D7F;
--color-primary-yellow: #F5C614;
--color-primary-black: #2C2C2C;

/* Secondari */
--color-secondary-cyan-light: #5DCEDB;
--color-secondary-cyan-pale: #E0F5F7;
--color-secondary-magenta-light: #E85BA8;
--color-secondary-magenta-pale: #F9E5F1;
--color-secondary-yellow-dark: #D4A600;
--color-secondary-yellow-pale: #FEF9E7;

/* Stati */
--color-state-success: #28A745;
--color-state-warning: #FFC107;
--color-state-error: #DC3545;
--color-state-info: #17A2B8;
--color-state-neutral: #6C757D;

/* Sfondi */
--color-bg-primary: #FFFFFF;
--color-bg-secondary: #F8F9FA;
--color-bg-overlay: rgba(0, 0, 0, 0.5);

/* Bordi */
--color-border-light: #DEE2E6;
--color-border-medium: #CED4DA;
--color-border-dark: #ADB5BD;

/* Testo */
--color-text-primary: #2C2C2C;
--color-text-secondary: #6C757D;
--color-text-tertiary: #999999;
--color-text-disabled: #CCCCCC;
--color-text-inverse: #FFFFFF;
```

### Token di tipografia

```css
/* Font stack */
--font-family-primary: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
--font-family-code: "Monaco", "Menlo", "Ubuntu Mono", monospace;

/* Dimensioni */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */
--font-size-2xl: 1.5rem;    /* 24px */
--font-size-3xl: 1.875rem;  /* 30px */
--font-size-4xl: 2.25rem;   /* 36px */

/* Line height */
--line-height-tight: 1.2;
--line-height-normal: 1.5;
--line-height-relaxed: 1.75;

/* Font weight */
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Token di spaziatura

Basata su una scala di 4px (facilita allineamento e scalabilita).

```css
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
```

### Token di elevazione (shadow)

Per creare profondita e gerarchia visiva.

```css
/* Ombre */
--shadow-none: none;
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);

/* Elevazione */
--elevation-ground: 0;
--elevation-1: 1px;
--elevation-2: 2px;
--elevation-3: 4px;
--elevation-4: 8px;
--elevation-5: 16px;
```

### Token di border radius

Per coerenza negli angoli arrotondati.

```css
--radius-none: 0;
--radius-xs: 2px;
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 999px;
```

## Theming

L'applicazione deve supportare facilmente temi multipli attraverso variabili CSS e una struttura scalabile.

### Architettura di theming

```
styles/
  ├── global/
  │   ├── design-tokens.css        (token di base)
  │   ├── typography.css            (stili tipografici globali)
  │   ├── reset.css                 (reset e normalizzazione)
  │   └── common.css                (classi comuni, utilities)
  ├── themes/
  │   ├── light-theme.css           (Light Mode - default)
  │   ├── dark-theme.css            (Dark Mode)
  │   ├── artist-theme.css          (Tema Artist, vibrant)
  │   └── custom-theme.css          (Template per temi personalizzati)
  └── components/
      └── [nessun hardcode colore, usa variabili]
```

### Light Mode (default)

Tema chiaro, professionale e facile da leggere. Adatto per uffici, studi e ambienti ben illuminati.

Variabili principali:
```css
:root {
  --theme-bg-primary: #FFFFFF;
  --theme-bg-secondary: #F8F9FA;
  --theme-text-primary: #2C2C2C;
  --theme-text-secondary: #6C757D;
  --theme-border: #DEE2E6;
  --theme-primary: #0B8FA0;
  --theme-primary-hover: #5DCEDB;
  --theme-primary-active: #0A7280;
}
```

### Dark Mode

Tema scuro, riduce l'affaticamento visivo in ambienti con poca luce.

Variabili principali:
```css
[data-theme="dark"] {
  --theme-bg-primary: #1E1E1E;
  --theme-bg-secondary: #2D2D2D;
  --theme-text-primary: #E5E5E5;
  --theme-text-secondary: #B0B0B0;
  --theme-border: #404040;
  --theme-primary: #5DCEDB;
  --theme-primary-hover: #7FD8E0;
  --theme-primary-active: #0B8FA0;
}
```

### Artist Theme

Tema vibrant e creativo, ispirato alla palette CMYK piena.

Variabili principali:
```css
[data-theme="artist"] {
  --theme-bg-primary: #FAFAF8;
  --theme-bg-secondary: #F0F0EE;
  --theme-text-primary: #1A1A1A;
  --theme-text-secondary: #555555;
  --theme-border: #D5D5D0;
  --theme-primary: #C41D7F;
  --theme-primary-hover: #E85BA8;
  --theme-primary-active: #A01662;
  --theme-accent: #0B8FA0;
  --theme-accent-hover: #5DCEDB;
}
```

### Selezione tema

L'applicazione deve permettere all'utente di scegliere il tema preferito in "Impostazioni > Tema":

- Light (default)
- Dark
- Artist
- Segui preferenze di sistema (prefers-color-scheme)
- Temi personalizzati (future)

## Componenti e pattern UI

### Tipografia

#### Heading

- **H1 (36px):** Titolo principale, titolo pagina
- **H2 (30px):** Titolo sezione principale
- **H3 (24px):** Sottosezione, card title
- **H4 (20px):** Label importante, campo form
- **H5 (18px):** Label standard
- **H6 (16px):** Label secondaria

Tutti gli heading usano `--font-weight-semibold` (600) di default.

#### Paragrafo

- **Body (16px):** Testo principale
- **Small (14px):** Testo secondario, note, helper text
- **Tiny (12px):** Placeholder, hint, label form
- **Code (14px):** Codice, identificativi tecnici

#### Linea di base

Tutti i testi usano `line-height: --line-height-normal` (1.5) per leggibilita.

### Bottoni

**Classi principali:**
- `.btn-primary`: Azione primaria, colore cyan
- `.btn-secondary`: Azione secondaria, border magenta
- `.btn-success`: Azione positiva, colore verde
- `.btn-danger`: Azione distruttiva, colore rosso
- `.btn-neutral`: Azione neutra, colore grigio

**Dimensioni:**
- `.btn-sm`: 32px height, font-size 14px
- `.btn-md`: 40px height, font-size 16px (default)
- `.btn-lg`: 48px height, font-size 18px

**Stati:**
- `:hover`: Colore piu chiaro, shadow md
- `:active`: Colore piu scuro, shadow none
- `:disabled`: Opacita 0.5, cursor not-allowed

### Form

**Input e textarea:**
- Border: `--border-light`, spessore 1px
- Border radius: `--radius-sm`
- Padding: `--space-3` verticale, `--space-4` orizzontale
- Focus: border-color `--theme-primary`, shadow `0 0 0 3px rgba(theme-primary, 0.1)`
- Placeholder: colore `--text-tertiary`

**Label:**
- Font-weight: `--font-weight-semibold`
- Font-size: `--font-size-sm`
- Margin-bottom: `--space-2`
- Colore: `--text-primary`

**Validazione:**
- Errore: border-color `--color-state-error`, icona error
- Successo: border-color `--color-state-success`, icona checkmark
- Warning: border-color `--color-state-warning`, icona warning

### Card

- Background: `--theme-bg-primary`
- Border: 1px `--theme-border`
- Border-radius: `--radius-md`
- Padding: `--space-6`
- Shadow: `--shadow-sm`
- Hover: shadow `--shadow-md`, border-color `--theme-primary`

### Modal e dialog

- Overlay: `--color-bg-overlay`
- Background: `--theme-bg-primary`
- Border-radius: `--radius-lg`
- Padding: `--space-8`
- Shadow: `--shadow-xl`

### Navigazione

#### Sidebar (desktop)

- Width: 280px
- Background: `--theme-bg-secondary`
- Border-right: 1px `--theme-border`
- Link attivo: background `--theme-primary`, text `--text-inverse`
- Link hover: background `--theme-primary-hover` (light), text `--text-primary`

#### Top navigation

- Height: 64px
- Background: `--theme-bg-primary`
- Border-bottom: 1px `--theme-border`
- Logo area: 280px (sincronizzato con sidebar)

#### Mobile navigation

- Tab bar bottom
- Height: 56px
- Background: `--theme-bg-primary`
- Border-top: 1px `--theme-border`
- Icon: 24px
- Label: `--font-size-xs`

## Linee guida UX

### Accessibilita

- Contrasto minimo WCAG AA per tutti i testi (4.5:1 per testo normale, 3:1 per testo grande)
- Navigazione da tastiera completa (Tab, Enter, Escape)
- Nomi accessibili per tutte le icone e i controlli
- Ordine di focus logico e visibile
- Messaggi di errore annunciabili per screen reader
- Colore non e l'unico modo per comunicare stato

### Touch-friendly

Target minimo: 44x44px per elementi interattivi su mobile.

Spaziatura tra bottoni: minimo `--space-3` per evitare tap accidentali.

Azioni primarie: sempre raggiungibili con una mano, nella parte inferiore dello schermo su mobile.

### Responsive

Breakpoint principali:
- **Smartphone:** < 640px (una colonna, navigazione mobile)
- **Tablet:** 640px - 1024px (una o due colonne)
- **Desktop:** >= 1024px (sidebar + contenuto, multi-colonna)

Contenuto si adatta fluidamente; nessun "salto" di layout ai breakpoint.

### Feedback immediato

- Feedback visivo su ogni azione (hover, active, loading, success, error)
- Toast notification per operazioni in background
- Loading spinner durante operazioni lunghe
- Conferme solo per azioni distruttive (delete, reset)

## Favicon e branding

### Concetto: "Brush painting a grid"

L'icona identificativa e un pennello che dipinge una griglia, simboleggiando:

- **Pennello:** il lato artistico, creativo, la mano dell'artista
- **Griglia:** il lato organizzativo, gestionale, l'ordine

Insieme comunicano: **Creativita + Ordine + Gestione**

### Esecuzione visiva

Stile: **Flat moderno con accent di colore CMYK**

Componenti:
1. **Griglia di base:** 4x4 o 5x5 quadrati, linee sottili in `--color-primary-black`
2. **Pennello:** sovraposto diagonalmente (45°), handle in legno naturale (#8B6F47), punta in setola con sfumatura
3. **Tratto di colore:** il pennello sta dipingendo uno dei quadrati della griglia, con colore `--color-primary-cyan`, `--color-primary-magenta`, o `--color-primary-yellow`
4. **Equilibrio:** pennello e griglia non si sovrappongono completamente; griglia rimane riconoscibile

### Varianti

- **Favicon (16x16, 32x32):** versione semplificata, solo essenziale
- **Logo (128x128+):** versione completa con dettagli
- **Icona app (192x192):** versione per manifest, contorno con ombra per leggibilita
- **Versione monochrome:** per dark mode, in `--color-text-inverse`

### Utilizzo

- Favicon nel `<head>` del documento
- Logo nella top navigation o sidebar
- Icona in manifest.webmanifest per PWA
- Non modificare proporzioni, colori o rotazione senza revisione di brand

## Stili globali

### Reset e normalizzazione

- `reset.css`: Reset standard (margin, padding, border-box, ecc.)
- `typography.css`: Stili base per p, h1-h6, ul, ol, a, code
- `common.css`: Classi utility comuni (`.text-primary`, `.bg-secondary`, `.shadow-md`, `.rounded-lg`, ecc.)

### Variabili CSS globali

Tutti i token di colore, tipografia, spaziatura, shadow e radius devono essere definiti come variabili CSS in `design-tokens.css` e referenziati nei componenti. **Nessun hardcode di colori nei componenti.**

### Breakpoint media query

```css
@media (max-width: 639px) { /* Smartphone */ }
@media (min-width: 640px) and (max-width: 1023px) { /* Tablet */ }
@media (min-width: 1024px) { /* Desktop */ }
```

### Evoluzioni future

- Custom color picker per personalizzazione di brand
- Generatore di tema automatico (input colore primario → palette completa)
- Dark mode automatico tramite `prefers-color-scheme`
- Temi per tipologia di artista (illustratore vs fumettista vs editore)
