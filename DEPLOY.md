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

## Modo 3 — Produção automatizada (CI/CD + Docker)

**Quando usar:** deploy em servidor VPS/cloud. As imagens são pré-construídas pelo GitHub Actions e publicadas no GitHub Container Registry (GHCR).

### 3.1 — Configurar o repositório GitHub

#### Secrets necessários

No repositório → **Settings → Secrets and variables → Actions**:

| Secret | Descrição |
|---|---|
| `DEPLOY_SSH_KEY` | Chave SSH privada para acessar o servidor |
| `DEPLOY_HOST` | IP ou hostname do servidor (ex: `123.45.67.89`) |
| `DEPLOY_USER` | Usuário SSH (ex: `ubuntu`, `deploy`) |
| `DEPLOY_PATH` | Caminho no servidor (ex: `/opt/ifinance`) |

#### Variables (não-secretas)

| Variable | Descrição |
|---|---|
| `VITE_API_BASE_URL` | URL pública do backend (ex: `https://api.ifinance.seudominio.com`) |
| `PRODUCTION_URL` | URL base da API para health-check pós-deploy |

#### Secrets do servidor (Google OAuth e banco)

No servidor, em `/opt/ifinance/.env`:
```env
DB_NAME=ifinance
DB_USERNAME=ifinance
DB_PASSWORD=senha-forte-aqui
GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret
SERVER_PORT=8080
BACKEND_IMAGE=ghcr.io/SEU_USUARIO/ifinance-backend:latest
FRONTEND_IMAGE=ghcr.io/SEU_USUARIO/ifinance-frontend:latest
```

### 3.2 — Preparar o servidor (uma vez)

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 2. Criar diretório do projeto
sudo mkdir -p /opt/ifinance
sudo chown $USER:$USER /opt/ifinance

# 3. Criar .env com as variáveis de produção
nano /opt/ifinance/.env

# 4. Adicionar a chave pública SSH do GitHub Actions (para deploy)
# (A chave privada correspondente vai no secret DEPLOY_SSH_KEY)
echo "ssh-ed25519 AAAA... github-actions" >> ~/.ssh/authorized_keys
```

### 3.3 — Fluxo CI/CD

```
git push origin main
        │
        ├─► CI Backend (.github/workflows/ci-backend.yml)
        │     compile → test → build JAR → docker build → push GHCR
        │
        ├─► CI Frontend (.github/workflows/ci-frontend.yml)
        │     type-check → lint → test → build → docker build → push GHCR
        │
        └─► Deploy (.github/workflows/deploy.yml)
              (aguarda CI Backend E CI Frontend ✅)
              SSH → docker compose pull → docker compose up -d
```

### 3.4 — Deploy manual

```bash
# Via GitHub Actions UI:
# Actions → Deploy — Produção → Run workflow

# Ou direto no servidor:
cd /opt/ifinance
docker compose --profile prod pull
docker compose --profile prod up -d --remove-orphans
```

### 3.5 — Verificar saúde em produção

```bash
curl https://api.ifinance.seudominio.com/actuator/health
# Esperado: {"status":"UP"}
```

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
| `SERVER_PORT` | docker/prod | `8080` | não |
| `VITE_API_BASE_URL` | build frontend | `""` | recomendado |
| `BACKEND_IMAGE` | prod compose | `ghcr.io/.../ifinance-backend:latest` | não |
| `FRONTEND_IMAGE` | prod compose | `ghcr.io/.../ifinance-frontend:latest` | não |

---

## Configuração de OAuth2 Google

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um projeto → **APIs & Services → Credentials → OAuth 2.0 Client ID**
3. Tipo: **Web application**
4. Origens autorizadas:
   - Local: `http://localhost:8888`, `http://localhost:7000`
   - Docker dev: `http://localhost:8080`, `http://localhost:3000`
   - Prod: `https://api.ifinance.seudominio.com`, `https://ifinance.seudominio.com`
5. URIs de redirecionamento autorizados:
   - Local: `http://localhost:8888/login/oauth2/code/google`
   - Docker/prod: `http://localhost:8080/login/oauth2/code/google` ou `https://api.../login/oauth2/code/google`

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
