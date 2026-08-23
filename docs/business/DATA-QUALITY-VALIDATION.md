# Validazione e qualita dei dati

## Principio

Le validazioni sono regole di dominio riutilizzabili, non controlli sparsi nei componenti UI. La UI mostra gli esiti; il dominio decide severita, messaggio e campi coinvolti.

La prima implementazione concreta e `domain/rules/fair-validation.ts`. Non e un framework generico: usa un contratto piccolo condivisibile da future regole di Operation, Client, Product e Bundle.

Ogni controllo ha una severita:

- `ERROR`: impedisce il salvataggio;
- `WARNING`: consente il salvataggio dopo attenzione o conferma esplicita;
- `INFO`: suggerimento non bloccante.

Il comportamento deve poter essere configurato in futuro: attivazione/disattivazione della regola, promozione da `WARNING` a `ERROR`, messaggi e soglie personalizzabili.

## Controlli FairEdition

### ERROR: coerenza date

`endDate` deve essere maggiore o uguale a `startDate`. Se la data fine e precedente alla data inizio:

- evidenziare entrambi i campi;
- mostrare: **La data di fine non puo essere precedente alla data di inizio.**;
- impedire il salvataggio.

### WARNING: duplicato

Verificare una `FairEdition` con stesso `fairSeriesId` e stessa etichetta `edition`, ignorando maiuscole/minuscole e l'edizione in modifica. Mostrare la fiera coinvolta e chiedere conferma esplicita prima del salvataggio.

### WARNING: sovrapposizione date

Due edizioni si sovrappongono quando:

`existing.startDate <= candidate.endDate` e `candidate.startDate <= existing.endDate`

La sovrapposizione non blocca il salvataggio. Il warning deve elencare le edizioni coinvolte per distinguere errore di inserimento, conflitto organizzativo o partecipazione contemporanea a eventi diversi.

### WARNING: edizione e date

Se l'etichetta `edition` contiene un anno a quattro cifre e `startDate` appartiene a un anno diverso, mostrare un warning. Esempio:

> L'edizione sembra riferirsi al 2026 ma le date appartengono al 2027. Verificare i dati inseriti.

Se dall'etichetta non e ricavabile un anno, il controllo non viene eseguito. Il warning non blocca il salvataggio.

### WARNING: dati incompleti

Dati opzionali mancanti possono essere salvati, ma l'elemento deve risultare incompleto o da verificare nelle viste successive. I campi obbligatori minimi restano soggetti alla validazione del form.

## Contratto tecnico

Un controllo restituisce un elenco di issue:

```typescript
interface ValidationIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  code: string;
  message: string;
  fields?: readonly string[];
  relatedEntityIds?: readonly string[];
}
```

Il salvataggio segue questa regola:

1. eseguire tutte le validazioni;
2. se esiste un `ERROR`, non salvare;
3. se esistono `WARNING`, richiedere conferma esplicita;
4. dopo la conferma, salvare senza eliminare i warning dallo storico di validazione;
5. conservare gli identificativi delle entita coinvolte quando il warning e relazionale.

## Estensione ad altre entita

Lo stesso meccanismo verra applicato progressivamente a:

- Operazioni e commissioni;
- Clienti e Clienti soft;
- Prodotti e Bundle;
- costi e movimenti economici;
- importazioni storiche.

Le regole devono rimanere indipendenti da Angular, IndexedDB e dal componente che le presenta.
