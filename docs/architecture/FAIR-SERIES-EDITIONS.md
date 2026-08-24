# FairSeries e FairEdition

## Modello

Una manifestazione ricorrente e modellata con due livelli:

```text
FairSeries
  |
  +-- FairEdition 2024
  +-- FairEdition 2025
  +-- FairEdition 2026
```

`FairSeries` rappresenta l'identita stabile dell'evento, ad esempio Alecomics o Lucca Comics. `FairEdition` rappresenta una partecipazione concreta, con propria edizione, date, luogo, costi, risultati e attivita.

La cardinalita e `FairSeries 1 : 0..* FairEdition`. L'anno e un attributo descrittivo derivato dalla data o memorizzato per ricerca; non e l'identita dell'edizione.

## FairSeries

Attributi:

- `id`;
- `name`;
- `organizerName`;
- `organizerContact`;
- `organizerEmail`;
- `organizerPhone`;
- `website`;
- `defaultLocation`;
- `notes`;
- `createdAt`, `updatedAt`, `deletedAt`.

I dati dell'organizzatore e del luogo predefinito sono riutilizzabili dalle edizioni successive, ma l'edizione conserva uno snapshot del nome e il proprio luogo.

## FairEdition

Attributi:

- `id`;
- `fairSeriesId`;
- `edition`;
- `year` opzionale di compatibilita;
- `name`;
- `startDate`;
- `endDate`;
- `location`;
- `locationNotes`;
- `notes`;
- `expectedBudget`;
- `standCost`;
- `reimbursement`;
- `hotelCost`;
- `travelCost`;
- `otherCosts`;
- `standPaid`;
- `travelPaid`;
- `hotelPaid`;
- `createdAt`, `updatedAt`, `deletedAt`.

Costi, Operazioni, contatti, task e prenotazioni si collegano all'edizione, mai direttamente alla serie. Le statistiche per serie aggregano le edizioni.

I campi economici aggregati sono accettati in V1 per coerenza con l'Excel storico. Sono temporanei e dovranno evolvere verso `FairCost`, `Booking`, `Incasso` e `Spesa` collegati alla FairEdition.

## Compatibilita con Fair

Il precedente tipo `Fair` e ora un alias compatibile di `FairEdition`. Le API temporanee `FairService.list/create/update/delete` rimangono disponibili e operano sulle edizioni. Il nuovo codice deve usare `IFairSeriesRepository` e `IFairEditionRepository`.

## Migrazione Dexie

La versione 3 aggiunge:

- `fairSeries`;
- `fairEditions`, indicizzata per `fairSeriesId`, anno, date e metadati;
- mantenimento temporaneo della collection legacy `fairs`.

Per ogni record legacy `Fair`:

1. viene creata una `FairSeries` con lo stesso id del record;
2. viene creata una `FairEdition` con lo stesso id;
3. `fairSeriesId` viene impostato allo stesso id;
4. `year` viene calcolato dai primi quattro caratteri di `startDate`;
5. nome, luogo, note e metadati vengono copiati;
6. `deletedAt` viene preservato.

L'identita storica dell'edizione non cambia. La migrazione e additive e deve essere seguita da verifica/export prima della futura rimozione di `fairs`.

## Statistiche

### Edizione

Filtrare per `fairEditionId` per ottenere risultati di una partecipazione: vendite, commissioni, costi, incassi, margine, prodotti, task e contatti.

### Serie

Raggruppare per `fairSeriesId` per confrontare anni, trend, medie, costi, ricavi e performance delle partecipazioni. Le metriche devono dichiarare periodo, valuta, criterio di attribuzione e record sorgente.

## Entita pianificate

### FairTask

Task operativo legato a una `FairEdition`: titolo, descrizione, scadenza, stato, priorita e note. Esempi: pagare lo stand, inviare materiale, prenotare hotel o confermare presenza.

### ContactLog

Comunicazione legata a una `FairEdition`, con data, canale (`email`, `telefono`, `whatsapp`, `messenger`, `altro`) e note. Non sostituisce Opportunity o Operation.

### Reservation

Prenotazione di hotel, viaggio, parcheggio o altro. Resta un tipo di `Operation`; i dati specifici potranno includere provider, costo, riferimento e scadenza di cancellazione.

## Stato roadmap

- MVP: `FairSeries`, `FairEdition`, repository separati, migrazione additive e gestione base delle edizioni;
- Post-MVP: `FairTask`, `ContactLog`, Reservation con dati specifici, preparazione organizzativa avanzata e statistiche aggregate.
