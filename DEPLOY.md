# iFinance — Guia de Deploy

> Três formas de executar o projeto: local (IDE), Docker dev e produção automatizada.

---

## Pré-requisitos

| Ferramenta | Versão mínima | Instalação |
|---|---|---|
| Java | 25 | [Eclipse Temurin](https://adoptium.net) |
| Maven | via `mvnw` | incluído no repo |
| Node.js | 22 | [nodejs.org](https://nodejs.org) |
| pnpm | latest | `npm i -g pnpm` |
| Docker Desktop | 27+ | [docker.com](https://www.docker.com/products/docker-desktop) |
| Docker Compose | v2 (plugin) | incluído no Docker Desktop |
| PostgreSQL | 16 (ou via Docker) | apenas para modo local sem Docker |

---

## Modo 1 — Local (IDE / linha de comando)

**Quando usar:** desenvolvimento ativo, hot-reload do Spring DevTools, debug com breakpoints.

### 1.1 — Banco de dados

```bash
# Se não tiver PostgreSQL local, suba apenas o banco via Docker:
docker compose up db -d
```

Ou use um PostgreSQL já instalado:
```sql
CREATE DATABASE ifinance_dev;
CREATE USER ifinance WITH PASSWORD 'ifinance';
GRANT ALL PRIVILEGES ON DATABASE ifinance_dev TO ifinance;
```

### 1.2 — Variáveis de ambiente

```bash
# Na raiz do projeto:
cp .env.example ifinance_api/.env
# Edite ifinance_api/.env com suas credenciais Google OAuth2
```

As variáveis necessárias para o perfil local:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ifinance_dev
DB_USERNAME=postgres   # ou ifinance
DB_PASSWORD=1234       # ou a senha que criou
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
SERVER_PORT=8888       # opcional, padrão é 8888
```

### 1.3 — Backend

```bash
cd ifinance_api

# Compilar e iniciar (perfil local ativado por padrão)
./mvnw spring-boot:run

# Ou com variáveis explícitas:
./mvnw spring-boot:run \
  -Dspring-boot.run.arguments="--spring.profiles.active=local"
```

Serviço disponível em: `http://localhost:8888`
Swagger UI: `http://localhost:8888/swagger-ui.html`

### 1.4 — Frontend

```bash
cd ifinance

pnpm install        # primeira vez
pnpm dev            # inicia em http://localhost:7000
```

O Vite faz proxy das chamadas `/api/` → `localhost:8888` automaticamente (configurado em `vite.config.ts`).

---

## Modo 2 — Docker dev (stack completa containerizada)

**Quando usar:** testar integração frontend ↔ backend sem IDE, onboarding de colaboradores, reproduzir bugs de ambiente.

### 2.1 — Configurar variáveis

```bash
# Na raiz do projeto:
cp .env.example .env

# Preencha pelo menos:
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
# DB_USERNAME, DB_PASSWORD (padrão já funciona: ifinance/ifinance)
```

### 2.2 — Subir a stack

```bash
# Na raiz do projeto (onde está o docker-compose.yml):
docker compose --profile docker up --build
```

O `--build` reconstrói as imagens do backend e frontend a partir do código-fonte local.

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |
| Banco | localhost:5432 |

### 2.3 — Parar

```bash
docker compose --profile docker down
# Para remover volumes (reset completo do banco):
docker compose --profile docker down -v
```

### 2.4 — Logs e debug

```bash
# Ver logs em tempo real:
docker compose --profile docker logs -f backend

# Entrar no container do backend:
docker compose --profile docker exec backend sh
```

---

## Modo 3 — Produção (backend + banco na VPS, frontend na Vercel)

**Quando usar:** deploy real, sem domínio próprio. O **backend + PostgreSQL** rodam em containers Docker numa VPS (ex.: Oracle Cloud Free Tier), atrás de Nginx com HTTPS via Let's Encrypt (usando um subdomínio gratuito DuckDNS, já que não há domínio próprio). O **frontend** é publicado separadamente na **Vercel** (build estático, deploy automático a cada push, HTTPS incluso).

> Por que separar: o frontend não precisa de servidor próprio (é só HTML/JS estático) e a
> Vercel já resolve build, CDN e certificado de graça. Isso deixa a VPS livre só para o
> backend + banco, que são os únicos componentes com estado.

### 3.0 — Criar a VPS (Oracle Cloud Free Tier)

1. Console Oracle Cloud → **Compute → Instances → Create Instance**
2. Imagem: **Canonical Ubuntu** (22.04 ou 24.04)
3. Shape: **VM.Standard.A1.Flex** (ARM, Always Free) — recomendado **2 OCPU / 6–12 GB RAM**
   (dá folga para JVM + PostgreSQL rodando juntos). Se der erro de *"Out of host capacity"*,
   tente outro *Availability Domain* ou, como alternativa, **VM.Standard.E2.1.Micro** (AMD,
   sempre disponível, mas só 1 GB RAM — mais apertado).
4. Marque **"Assign a public IPv4 address"**
5. Em **Add SSH keys**, gere ou cole seu par de chaves — guarde a chave privada
6. Crie a instância e anote o **IP público**
7. Em **Networking → Virtual Cloud Network → Security Lists**, adicione *Ingress Rules*
   liberando as portas **80** (HTTP, para o desafio do Let's Encrypt) e **443** (HTTPS) para
   `0.0.0.0/0` — a porta 22 (SSH) já vem liberada por padrão
8. Dentro da instância, confirme que o firewall do SO não bloqueia (Ubuntu geralmente vem
   sem `ufw` ativo; se estiver ativo: `sudo ufw allow 80,443,22/tcp`)

### 3.1 — Domínio gratuito (DuckDNS)

Sem domínio próprio, HTTPS de verdade (exigido para OAuth2 e para o cookie de sessão
cross-domain — ver nota na seção 3.4) precisa de um hostname público. DuckDNS resolve isso
de graça:

1. Acesse https://www.duckdns.org e faça login (GitHub/Google)
2. Crie um subdomínio, ex.: `ifinance-api` → resultado: `ifinance-api.duckdns.org`
3. Cole o **IP público da instância** no campo do subdomínio e clique **update ip**
4. Confirme a propagação: `nslookup ifinance-api.duckdns.org`

A partir daqui, `ifinance-api.duckdns.org` é o hostname do backend.

### 3.2 — Preparar o servidor (uma vez)

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# (saia e reconecte via SSH para o grupo docker valer)

# 2. Criar diretório do projeto
sudo mkdir -p /opt/ifinance
sudo chown $USER:$USER /opt/ifinance

# 3. Criar .env com as variáveis de produção (ver 3.3 abaixo)
nano /opt/ifinance/.env

# 4. Adicionar a chave pública SSH do GitHub Actions (para deploy)
# (A chave privada correspondente vai no secret DEPLOY_SSH_KEY)
echo "ssh-ed25519 AAAA... github-actions" >> ~/.ssh/authorized_keys

# 5. Instalar Nginx + Certbot (reverse proxy com TLS)
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Configurar o Nginx (`/etc/nginx/sites-available/ifinance`):

```nginx
server {
    listen 80;
    server_name ifinance-api.duckdns.org;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/ifinance /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Emitir certificado TLS (Certbot detecta o server_name e reconfigura o Nginx sozinho)
sudo certbot --nginx -d ifinance-api.duckdns.org
```

O Certbot já agenda a renovação automática (`systemctl status certbot.timer`).

### 3.3 — Configurar o repositório GitHub

#### Secrets necessários

No repositório → **Settings → Secrets and variables → Actions**:

| Secret | Descrição |
|---|---|
| `DEPLOY_SSH_KEY` | Chave SSH privada para acessar o servidor |
| `DEPLOY_HOST` | IP ou hostname do servidor (ex: `ifinance-api.duckdns.org`) |
| `DEPLOY_USER` | Usuário SSH (ex: `ubuntu`) |
| `DEPLOY_PATH` | Caminho no servidor (ex: `/opt/ifinance`) |

#### Variables (não-secretas)

| Variable | Descrição |
|---|---|
| `PRODUCTION_URL` | URL do backend para health-check pós-deploy (ex: `https://ifinance-api.duckdns.org`) |

> `VITE_API_BASE_URL` não é mais configurada aqui — o build do frontend agora acontece na
> Vercel, que tem suas próprias variáveis de ambiente (ver seção 3.6).

#### .env do servidor (`/opt/ifinance/.env`)

```env
DB_NAME=ifinance
DB_USERNAME=ifinance
DB_PASSWORD=senha-forte-aqui
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
# Obrigatório em prod — sem fallback para {baseUrl}. Precisa ser IDÊNTICO ao
# URI de redirecionamento cadastrado no Google Console (ver seção OAuth2 abaixo).
GOOGLE_REDIRECT_URI=https://ifinance-api.duckdns.org/login/oauth2/code/google
# Origem do frontend na Vercel — preencha depois do primeiro deploy da Vercel (seção 3.6)
APP_CORS_ALLOWED_ORIGINS=https://seu-projeto.vercel.app
APP_FRONTEND_BASE_URL=https://seu-projeto.vercel.app
SERVER_PORT=8080
BACKEND_IMAGE=ghcr.io/SEU_USUARIO/ifinance-backend:latest
```

> A porta 8080 do backend é publicada apenas em `127.0.0.1` do servidor (ver
> `docker-compose.yml`) — ela não fica acessível diretamente pela internet.
> O Nginx configurado em 3.2 repassa `https://ifinance-api.duckdns.org` → `http://127.0.0.1:8080`.
> Só esse hop local é confiável para os cabeçalhos `X-Forwarded-*`
> (`server.tomcat.remoteip.internal-proxies`, configurável via `TRUSTED_PROXIES`).

### 3.4 — Fluxo CI/CD

```
git push origin main
        │
        ├─► CI Backend (.github/workflows/ci-backend.yml)
        │     compile → test → build JAR → docker build → push GHCR
        │
        ├─► CI Frontend (.github/workflows/ci-frontend.yml)
        │     type-check → lint → test  (deploy fica a cargo da Vercel, ver 3.6)
        │
        └─► Deploy (.github/workflows/deploy.yml)
              (aguarda CI Backend ✅ — só existe imagem de backend agora)
              SSH → docker compose pull → docker compose up -d
```

> Cookie de sessão cross-domain: como o frontend (Vercel) e o backend (DuckDNS) ficam em
> domínios diferentes, o cookie `JSESSIONID` precisa de `SameSite=None; Secure` para ser
> enviado nas chamadas da Vercel para a API — já configurado em `application-prod.yml`.
> Isso só funciona com HTTPS válido dos dois lados, por isso o Certbot em 3.2 é obrigatório.

### 3.5 — Deploy manual do backend

```bash
# Via GitHub Actions UI:
# Actions → Deploy — Produção → Run workflow

# Ou direto no servidor:
cd /opt/ifinance
docker compose --profile prod pull
docker compose --profile prod up -d --remove-orphans
```

### 3.6 — Frontend na Vercel

1. Acesse https://vercel.com → **Add New → Project** → importe o repositório GitHub
2. Em **Root Directory**, selecione `ifinance` (o monorepo tem backend e frontend juntos)
3. Framework preset: **Vite** (detectado automaticamente)
4. Build command: `pnpm build` · Output directory: `dist` · Install command: `pnpm install`
5. Em **Environment Variables**, adicione:
   | Nome | Valor |
   |---|---|
   | `VITE_API_BASE_URL` | `https://ifinance-api.duckdns.org` |
6. Deploy. A Vercel te dá uma URL, ex.: `https://ifinance-xyz.vercel.app`
7. Volte ao `.env` do servidor (3.3) e atualize `APP_CORS_ALLOWED_ORIGINS` e
   `APP_FRONTEND_BASE_URL` com essa URL exata, depois reinicie o backend:
   ```bash
   cd /opt/ifinance && docker compose --profile prod up -d --force-recreate backend-prod
   ```
8. A partir daqui, cada `git push origin main` faz a Vercel rebuildar e publicar o frontend
   automaticamente (integração nativa GitHub ↔ Vercel, sem passar pelo GitHub Actions).

### 3.7 — Verificar saúde em produção

```bash
curl https://ifinance-api.duckdns.org/actuator/health
# Esperado: {"status":"UP"}
```

Depois, abra a URL da Vercel no navegador, clique em "Entrar com Google" e confirme que o
login completa e volta autenticado — isso valida o fluxo OAuth2 + cookie cross-domain.

---

## Variáveis de ambiente — referência completa

| Variável | Perfil | Padrão | Obrigatória |
|---|---|---|---|
| `DB_HOST` | prod | — | sim |
| `DB_PORT` | prod | `5432` | não |
| `DB_NAME` | prod | — | sim |
| `DB_USERNAME` | docker/prod | `ifinance` | sim em prod |
| `DB_PASSWORD` | docker/prod | `ifinance` | sim em prod |
| `GOOGLE_CLIENT_ID` | todos | — | sim |
| `GOOGLE_CLIENT_SECRET` | todos | — | sim |
| `GOOGLE_REDIRECT_URI` | prod | — | **sim** (sem fallback; deploy falha se ausente) |
| `TRUSTED_PROXIES` | prod | `127\.0\.0\.1\|::1` | não (só altere se o reverse proxy não rodar em loopback) |
| `SERVER_PORT` | docker/prod | `8080` | não |
| `APP_CORS_ALLOWED_ORIGINS` | prod | — | **sim** (URL da Vercel) |
| `APP_FRONTEND_BASE_URL` | prod | — | **sim** (URL da Vercel — usada no redirect pós-login) |
| `VITE_API_BASE_URL` | build frontend (Vercel) | `""` | recomendado — configurada no dashboard da Vercel, não no GitHub |
| `BACKEND_IMAGE` | prod compose | `ghcr.io/.../ifinance-backend:latest` | não |

---

## Configuração de OAuth2 Google

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto → **APIs & Services → Credentials → OAuth 2.0 Client ID**
3. Tipo: **Web application**
4. Origens autorizadas:
   - Local: `http://localhost:8888`, `http://localhost:7000`
   - Docker dev: `http://localhost:8080`, `http://localhost:3000`
   - Prod: `https://ifinance-api.duckdns.org` (backend) e a URL da Vercel, ex.
     `https://ifinance-xyz.vercel.app` (frontend)
5. URIs de redirecionamento autorizados:
   - Local: `http://localhost:8888/login/oauth2/code/google`
   - Docker dev: `http://localhost:8080/login/oauth2/code/google`
   - Prod: `https://ifinance-api.duckdns.org/login/oauth2/code/google`
     — precisa ser **idêntico** ao valor de `GOOGLE_REDIRECT_URI` no `.env` do servidor.
     Em prod não há fallback automático baseado no host da requisição.

---

## Perfis Spring Boot

| Perfil | Ativação | Banco | SQL | Swagger |
|---|---|---|---|---|
| `local` | padrão (IDE) | `localhost:5432` | debug | habilitado |
| `docker` | compose docker | `db:5432` | off | habilitado |
| `prod` | compose prod | env vars | off | desabilitado |
| `test` | testes automáticos | Testcontainers | off | n/a |

---

## Troubleshooting

**Backend não inicia — `InvestmentRequestMapper` não encontrado**
→ Falha do MapStruct (annotation processor). Rode `./mvnw compile` primeiro.

**`GOOGLE_CLIENT_ID` não definido**
→ Verifique se o arquivo `.env` existe em `ifinance_api/` e foi carregado pelo Spring.

**Frontend mostra erros de rede**
→ Confirme que `VITE_API_BASE_URL` aponta para a URL correta do backend.

**Testcontainers falha no CI**
→ O runner do GitHub Actions tem Docker disponível. Se usar self-hosted runner, instale Docker.

**Container backend nunca fica healthy**
→ Verifique os logs: `docker compose logs backend`. O health check usa `/actuator/health`.
   O start_period é 60s — aguarde o Spring Boot subir completamente.
