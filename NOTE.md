## Esempio con Approccio Code First

- Gli adapter definiscono le OpenAPI (generate dal codice a runtime) tramite schemi Zod (usati per validare le request / response).
- Il client condivide con gli adapter le route delle OpenAPI (e quindi i tipi e gli schemi runtime): non viene generato codice né tipi TypeScript.
- La validazione dell'adapter avviene indipendentemente da quella del dominio.
- La validazione del dominio avviene indipendentemente da quella dell'adapter.
- La validazione del dominio non usa Zod (ma è concesso).
- Il design delle OpenAPI può procedere indipendentemente da quello del dominio.
- L'adapter _può_ eventualmente condividere delle invarianti con il dominio (es. la regex del codice fiscale), ma non è obbligatorio;
  al netto di casi particolari, è meglio se non lo fa, perché così è certo che se il dominio cambia, l'adapter non ne risente.
- L'input dello use case è un semplice DTO: questo permette di non dover scrivere logiche complesse (wrapper) per convertire
  i dati validati dall'adapter in oggetti del dominio. L'obiettivo, nel design dei parametri per gli use-case, è massimizzare
  la developer experience per i caller (adapter), non quindi avere una validazione "strict" che avviene al loro interno.
- Use case e adapter sono privi di asserzioni sui tipi, la maggior parte dei quali vengono inferiti automaticamente.
- Vengono impiegati i meccanismi builtin del framework http per validare i parametri di path, query e header.
- I tipi Error personalizzati utilizzano la property `name` per identificare il tipo; questo evita che venga
  stampato un errore generico "Error: ..." quando viene lanciato un errore custom

## Contro di Qualsiasi Approccio Code First

- se si sceglie un client diverso da quello fornito dal framework, deve supportare lo stesso formato per lo schema delle route
- l'espressività delle openapi è limitata dalla bontà del framework utilizzato
- è possibile che parti della validazioni siano duplicate

## Esempio di approccio API First

Nella scrittura dall'adapter il SWE implementa:

- il mapping tra i dati già validati (automaticamente) dall'adapter nel formato che si aspetta lo use case
- il mapping tra i dati dallo use case e quelli che si aspettano le OpenAPI (con response validate a compile time)
- la chiamata allo use-case

Vantaggi:

- Chi scrive l'adapter non deve preoccuparsi di cosa e come fa lo use case, ma solo di come mappare i dati in ingresso e in uscita.
- Gli input sono aderenti alle OpenAPI con un check a runtime per le request e a compile time per le response.
- Il dominio non deve preoccuparsi di come sono strutturati i dati in ingresso e in uscita nell'adapter
- La logica implementata nell'adapter non richiede ragionamenti particolari (es. "devo usare uno degli schemi già disponibili? su quali campi ù
  esattamente?"), ma è solo un mapping tra dati già validati e quello che si aspetta lo use case. Questo permette ai coding agent di generare
  l'adapter in modo più efficace, senza dover ragionare su logiche complesse o discrezionali che richiedono ulteriore contesto.

Nota: la soluzione proposta in letteratura per controllare che un input che è accettato dall'adapter sia coerente
con le aspettative della logica business, è quella di implementare dei test che partono dall'adapter e arrivano al dominio.
Questo è imprescindibile in qualsiasi scenario, considerando che le logiche interne del dominio sono inerentemente
più complesse di quelle dell'adapter (es. potrebbero coinvolgere chiamate ad altri servizi, validazione sulla semantica,
accesso a layer di persistenza, etc).
