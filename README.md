# Joeleeli Frontend

Interface pública para confirmação de presença dos convidados.

## Requisitos

- Node.js 20 ou superior
- npm

## Configuração

```bash
cp .env.example .env
npm install
npm run dev
```

A aplicação fica disponível em `http://localhost:5173`. Acesse um convite em:

```text
/rsvp/<token-do-convite>
```

Configure `VITE_API_BASE_URL` com a origem do backend, sem incluir `/api/v1`.

## Qualidade

```bash
npm run lint
npm run build
```
