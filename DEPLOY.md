# iFinance (Frontend) — Guia de Deploy

> Este repositório contém **apenas o frontend** (Vue 3 + Vite). O backend (Spring Boot +
> PostgreSQL) vive em [dev-willem/ifinance_api](https://github.com/dev-willem/ifinance_api),
> com seu próprio guia de deploy.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Instalação |
|---|---|---|
| Node.js | 22 | [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm i -g pnpm` |

---

## Modo 1 — Local

```bash
pnpm install        # primeira vez
pnpm dev            # inicia em http://localhost:7000
```

O Vite faz proxy das chamadas `/api/`, `/oauth2/`, `/login/`, `/logout` para o backend
(configurado em `vite.config.ts`, padrão `http://localhost:8888`). Para apontar pra outro
backend (ex.: rodando em Docker na porta 8080, ou já publicado):

```bash
VITE_DEV_BACKEND_URL=http://localhost:8080 pnpm dev
```

Suba o backend separadamente a partir do repo
[dev-willem/ifinance_api](https://github.com/dev-willem/ifinance_api) (ver o `DEPLOY.md` dele).

---

## Modo 2 — Build de produção local

```bash
pnpm build          # gera dist/
pnpm preview        # serve o build localmente para conferência
```

`VITE_API_BASE_URL` (env var, ou `.env.production`) define a URL do backend usada no bundle
final — em produção deve apontar para a URL pública do backend (ver Modo 3).

---

## Modo 3 — Produção (Vercel)

**Quando usar:** deploy real. Este frontend é publicado como build estático na Vercel —
grátis, com CDN, HTTPS automático e deploy a cada push. O backend roda à parte, numa VPS
(ver [dev-willem/ifinance_api/DEPLOY.md](https://github.com/dev-willem/ifinance_api/blob/main/DEPLOY.md)).

### 3.1 — Importar o projeto na Vercel

1. https://vercel.com → **Add New → Project** → importe este repositório GitHub
2. Framework preset: **Vite** (detectado automaticamente)
3. Build command: `pnpm build` · Output directory: `dist` · Install command: `pnpm install`
4. Em **Environment Variables**, adicione:

   | Nome | Valor |
   |---|---|
   | `VITE_API_BASE_URL` | URL pública do backend, ex.: `https://ifinance-api.duckdns.org` |

5. Deploy. A Vercel te dá uma URL, ex.: `https://ifinance-xyz.vercel.app`

### 3.2 — Fechar o laço com o backend

O backend precisa saber a URL exata da Vercel para:
- **CORS** (`APP_CORS_ALLOWED_ORIGINS`) — senão as chamadas da API são bloqueadas pelo navegador
- **Redirect pós-login** (`APP_FRONTEND_BASE_URL`) — pra onde o OAuth2 manda o usuário de volta
- **Google Console** — a URL da Vercel precisa estar nas *origens autorizadas* do client OAuth2

Atualize essas três coisas com a URL da Vercel (ver `DEPLOY.md` do repo do backend, seções
3.3 e OAuth2) e reinicie o backend.

> **Por que isso importa:** frontend (Vercel) e backend (VPS) ficam em domínios diferentes,
> então o cookie de sessão (`JSESSIONID`) só é enviado nas chamadas cross-domain porque o
> backend usa `SameSite=None; Secure` — o que exige HTTPS válido dos dois lados e as origens
> configuradas corretamente. Sem isso, o login completa mas a sessão não "gruda".

### 3.3 — Deploys seguintes

Cada `git push origin main` faz a Vercel rebuildar e publicar automaticamente (integração
nativa GitHub ↔ Vercel — não passa pelo GitHub Actions). O CI deste repo
(`.github/workflows/ci-frontend.yml`) roda type-check, lint e testes como gate de qualidade,
mas não faz o deploy.

### 3.4 — Verificar

Abra a URL da Vercel, clique em "Entrar com Google" e confirme que o login completa e volta
autenticado. Se a sessão não persistir, revise a seção 3.2 (CORS / cookie cross-domain).

---

## Troubleshooting

**Erros de rede / CORS no console do navegador**
→ Confirme que `VITE_API_BASE_URL` (Vercel) aponta pro backend certo, e que
  `APP_CORS_ALLOWED_ORIGINS` no backend bate **exatamente** com a URL da Vercel (sem barra final).

**Login com Google completa mas a UI mostra deslogado**
→ Cookie de sessão não persistiu cross-domain. Veja a seção 3.2 — precisa de HTTPS válido
  nos dois lados e `same-site: none` no backend (já configurado lá por padrão).

**Build falha na Vercel por causa de type-check/lint**
→ Rode `pnpm type-check` e `pnpm lint` localmente antes do push; o CI (`ci-frontend.yml`)
  roda os mesmos checks e falha primeiro, mais rápido que esperar o deploy da Vercel.
