# Deploy na Railway

Este guia prepara o projeto, mas não cria recursos nem realiza deploy. No dashboard
da Railway, crie um único projeto com exatamente três serviços:

- `backend`, conectado ao repositório `reicoastdev/back-joeleeli`;
- `frontend`, conectado ao repositório `reicoastdev/front-joeleeli`;
- `Postgres`, criado pelo template oficial da Railway.

Não crie Redis, worker, cron, volume de mídia, Nginx ou outro serviço neste
incremento.

## 1. Serviço Postgres

No projeto, use **New > Database > Add PostgreSQL**. Mantenha o serviço privado; o
backend acessará sua `DATABASE_URL` por referência entre serviços.

## 2. Serviço backend

Conecte o repositório do backend. O `railway.json` seleciona seu `Dockerfile`, roda
migrations antes do release e usa `/api/v1/health/` como healthcheck. Configure:

```text
DJANGO_SETTINGS_MODULE=config.settings.production
DJANGO_SECRET_KEY=<GERAR_UM_SEGREDO_FORTE_E_EXCLUSIVO>
DJANGO_DEBUG=False
DATABASE_URL=${{Postgres.DATABASE_URL}}
DJANGO_ALLOWED_HOSTS=${{backend.RAILWAY_PUBLIC_DOMAIN}}
CORS_ALLOWED_ORIGINS=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
CSRF_TRUSTED_ORIGINS=https://${{frontend.RAILWAY_PUBLIC_DOMAIN}}
```

Gere um domínio público em **Settings > Networking > Public Networking**. O backend
aceita os domínios público e privado injetados pela Railway e o host dedicado do
healthcheck, sem wildcard.

## 3. Serviço frontend

Conecte este repositório ao serviço `frontend`. O `railway.json` seleciona o
`Dockerfile` e verifica `GET /health`. Configure antes do build:

```text
VITE_API_BASE_URL=https://${{backend.RAILWAY_PUBLIC_DOMAIN}}
```

Variáveis `VITE_*` são incorporadas ao bundle no build; alterá-las exige redeploy.
Gere um domínio público para o frontend. O Caddy escuta `PORT`, serve `/app/dist`,
comprime com gzip, faz fallback de SPA e não habilita access logs.

O link público tem a forma `https://<frontend>/rsvp#TOKEN`. O fragmento permanece
no navegador; não é persistido em storage, cookie ou query string. A API recebe a
credencial exclusivamente pelo header `Authorization: Bearer` na rota fixa
`/api/v1/public/rsvp/`.

## 4. Primeiro deploy e validação

Depois de revisar as variáveis, faça o deploy. A etapa pre-deploy do backend executa:

```text
uv run --no-sync python manage.py migrate --noinput
```

Valide no domínio público:

- `GET https://<backend>/api/v1/health/` retorna `{"status":"ok"}`;
- `/admin/` do backend carrega CSS e JavaScript sem 404;
- `GET https://<frontend>/health` retorna 200;
- atualizar diretamente `https://<frontend>/rsvp#TOKEN` mantém a SPA;
- a chamada RSVP usa a rota fixa, contém o header Bearer e não expõe o token no path
  ou nos logs.

## 5. Domínios customizados

Ao trocar os domínios Railway por domínios próprios:

1. cadastre os novos domínios em cada serviço;
2. altere `VITE_API_BASE_URL` para o domínio definitivo do backend;
3. altere `CORS_ALLOWED_ORIGINS` e `CSRF_TRUSTED_ORIGINS` para o domínio definitivo
   do frontend;
4. se necessário, inclua o domínio do backend em `DJANGO_ALLOWED_HOSTS`;
5. faça redeploy de ambos os serviços e repita os healthchecks.

Separe múltiplas origens ou hosts por vírgula, sem usar `*`.
