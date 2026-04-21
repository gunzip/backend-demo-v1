- approccio code first: i validatori dell'adapter definiscono le openapi
  (generate dal codice a runtime)
- il client condivide le route (e quindi i tipi) con l'adapter e non viene
  quindi generato dalle specifiche
- la validazione dell'adapter avviene indipendentemente da quella del dominio
- il dominio effettua una sua validazione, totalmente indipendente da quella
  dell'adapter; nell'esempio non usa zod (ma potrebbe)
- l'adapter _può_ eventualmente condividere delle invarianti con il dominio (es.
  la regex del codice fiscale), ma non è obbligatorio; al netto di casi
  particolari, meglio se non lo fa, perché così è certo che se il dominio
  cambia, l'adapter non ne risente e non è necessario aggiornarlo
- l'input dello use case non contiene logica di validazione: questo permette di
  non dover scrivere logiche complesse per convertire i dati validati
  dall'adapter in oggetti del dominio
- non servono type assertion nello use case o nell'adapter
- non servono wrapper per convertire i dati validati dall'adapter in oggetti del
  dominio, perché l'input dello use case è un semplice DTO
- i tipi Error custom utilizzano la property `name` per identificare il tipo di errore; questo evita che venga
  stampato un errore generico "Error: ..." quando viene lanciato un errore custom
