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
/rsvp#<token-do-convite>
```

O fragmento é mantido no navegador e a credencial é enviada somente no header
`Authorization: Bearer`. Configure `VITE_API_BASE_URL` com a origem do backend, sem
incluir `/api/v1`.

## Qualidade

```bash
npm run lint
npm run build
```

## Imagem de produção e Railway

O `Dockerfile` gera o bundle com Node e o serve em uma imagem mínima do Caddy. O
servidor respeita a porta injetada em `PORT`, disponibiliza `GET /health`, aplica
fallback de SPA e envia headers básicos de segurança sem access logs.

As etapas para configurar os serviços e as variáveis no dashboard estão em
[`docs/railway.md`](docs/railway.md).
