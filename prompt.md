Crea un nuovo progetto nella directory api-first/api che consiste in

1. uno script typescript che genera un server hono che usa zod validator:
   https://github.com/honojs/middleware/tree/main/packages/zod-validator

il server deve venir generato partendo dalle route generate con il comando
npx @apical-ts/craft generate -i openapi.yaml -o ./generated --routes

le route contengono gli schemi zod, i path http e i metodi
per ogni operation definita nello yaml delle openapi specs

2. il server generato tramite un task di nx che esegue lo script typescript

3. un task di nx per eseguire il server

4. un task di nx per buildare il server usando tsup

Crea inoltre il rispettivo client generato con

npx @apical-ts/craft generate -i openapi.yaml -o ./generated --client
nella directory api-first/client
e i rispettivi task di nx per buildare il client usando tsup

il file openapi.yaml è già presente nella dir api-first

aggiorna in README.md del progetto
