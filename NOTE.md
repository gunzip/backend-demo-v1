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
  la developer experience per i caller (adapter), non quindi avere una validazione "strict".
- Use case e adapter sono privi di asserzioni sui tipi, la maggior parte dei quali vengono inferiti automaticamente.
- Vengono impiegati i meccanismi builtin del framework http per validare i parametri di path, query e header.
- I tipi Error personalizzati utilizzano la property `name` per identificare il tipo; questo evita che venga
  stampato un errore generico "Error: ..." quando viene lanciato un errore custom

## Contro

- l'espressività delle openapi è limitata dalla bontà del framework utilizzato
- è possibile che parti della validazioni siano duplicate

