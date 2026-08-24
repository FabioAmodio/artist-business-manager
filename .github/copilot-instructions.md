## Angular Coding Standards

Per tutti i nuovi componenti Angular:

- usare componenti standalone;
- usare file HTML esterni;
- usare file SCSS esterni;
- evitare `template` inline;
- evitare `styles` inline;
- mantenere componenti piccoli e focalizzati;
- utilizzare nomi coerenti con la struttura delle feature;
- non modificare la logica applicativa durante refactor strutturali.

Struttura obbligatoria:

```text
feature/
├── component-name.component.ts
├── component-name.component.html
└── component-name.component.scss
```

Eccezioni ammesse solo per componenti tecnici estremamente piccoli, prototipi temporanei o test. Ogni eccezione deve essere motivata nel contesto della modifica.
