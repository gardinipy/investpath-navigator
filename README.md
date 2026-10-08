# FinançasPro

Aplicação web para registrar transações, acompanhar o orçamento e simular investimentos.

## Requisitos

- Node.js 18 ou superior
- npm

## Como executar

```sh
npm install
npm run dev
```

O servidor local sobe em `http://localhost:8080`.

## Scripts

- `npm run dev` — ambiente de desenvolvimento
- `npm run build` — build de produção
- `npm run preview` — visualiza o build
- `npm test` — testes unitários

## Importação de extrato

Na página **Transações**, é possível importar arquivos CSV, OFX/QFX, QIF e PDF exportados pelo internet banking. CSV e OFX costumam ser os formatos mais precisos.
