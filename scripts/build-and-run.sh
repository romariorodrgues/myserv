#!/usr/bin/env bash
set -euo pipefail

# =========================================
# MyServ — Build, DB & Start (dev/prod)
# =========================================
# Uso:
#   bash scripts/build-and-run.sh                 # dev: install, migrate dev, seed, build
#   bash scripts/build-and-run.sh --prod          # prod: install (ci/frozen), migrate deploy, seed, build
#   bash scripts/build-and-run.sh --start         # após build, inicia o app (dev usa next dev; prod usa next start)
#   Opções:
#     --no-install    pula install
#     --no-seed       não roda seed
#     --skip-build    pula next build
#     --prod          fluxo produção
#     --start         sobe o servidor no final (PORT respeitada se setada)
#     --pm2           usa PM2 para gerenciar o processo
#     --pm2-name=NAME nome do processo no PM2 (default: myserv)
#     --pm2-instances=N número de instâncias (ex.: 1, 2, 4, 0=max)
#     --pm2-watch     ativa watch no PM2 (útil em dev)
#     --pm2-save      salva a lista no PM2 (pm2 save)
#     -h|--help       mostra este cabeçalho

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Ensure local binaries (next, prisma, tsx) are on PATH
export PATH="$ROOT_DIR/node_modules/.bin:$PATH"

log()   { echo -e "\033[1;36m[MyServ]\033[0m $*"; }
warn()  { echo -e "\033[1;33m[WARN]\033[0m $*"; }
error() { echo -e "\033[1;31m[ERROR]\033[0m $*"; }

trap 'error "Falha em alguma etapa. Veja o log acima."' ERR

# ---------------- Flags ----------------
PROD=false
DO_INSTALL=true
DO_BUILD=true
DO_START=false
DO_SEED=true

# PM2 options
USE_PM2=false
PM2_NAME="myserv"
PM2_INSTANCES=1
PM2_WATCH=false
PM2_SAVE=false

for arg in "${@:-}"; do
  case "$arg" in
    --prod)         PROD=true ;;
    --no-install)   DO_INSTALL=false ;;
    --skip-build)   DO_BUILD=false ;;
    --start)        DO_START=true ;;
    --no-seed)      DO_SEED=false ;;
    --pm2)          USE_PM2=true ;;
    --pm2-name=*)       PM2_NAME="${arg#*=}" ;;
    --pm2-instances=*)  PM2_INSTANCES="${arg#*=}" ;;
    --pm2-watch)        PM2_WATCH=true ;;
    --pm2-save)         PM2_SAVE=true ;;
    -h|--help) sed -n '3,40p' "$0"; exit 0 ;;
    *) warn "Flag desconhecida: $arg" ;;
  esac
done

# -------------- Node / nvm -------------
if [[ -f ".nvmrc" ]]; then
  # Try to load nvm from standard location
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    export NVM_DIR="$HOME/.nvm"
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
  fi
  if command -v nvm >/dev/null 2>&1; then
    log "Usando Node de .nvmrc via nvm"
    nvm install
    nvm use
  else
    warn "'.nvmrc' encontrado mas 'nvm' não está disponível."
  fi
fi
node -v >/dev/null || { error "Node não instalado."; exit 1; }

# ------- Package manager detect --------
if command -v pnpm >/dev/null 2>&1; then PM=pnpm
elif command -v yarn >/dev/null 2>&1; then PM=yarn
elif command -v bun  >/dev/null 2>&1; then PM=bun
else PM=npm; fi
log "Package manager: $PM"

[[ -f "package.json" ]] || { error "package.json não encontrado em $(pwd)"; exit 1; }

# ---------------- Env ------------------
# Choose env file to source for commands that require DB/Secrets
ENV_FILE=""
if [[ ${PROD} == true ]]; then
  for f in .env.production.local .env.production .env; do
    [[ -f "$f" ]] && { ENV_FILE="$f"; break; }
  done
else
  for f in .env.local .env; do
    [[ -f "$f" ]] && { ENV_FILE="$f"; break; }
  done
fi

if [[ -z "$ENV_FILE" && -f ".env.example" ]]; then
  log "Criando .env a partir de .env.example (ajuste valores conforme necessário)"
  cp .env.example .env
  ENV_FILE=.env
fi

if [[ -n "$ENV_FILE" ]]; then
  log "Carregando variáveis de ambiente de $ENV_FILE"
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  warn "Nenhum arquivo .env encontrado. Certifique-se de exportar as variáveis necessárias."
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  warn "DATABASE_URL não setado nas variáveis de ambiente. Exemplo (SQLite): DATABASE_URL=\"file:./prisma/dev.db\""
fi

# Ensure SQLite folder exists when using file: URLs
if [[ -n "${DATABASE_URL:-}" && "$DATABASE_URL" == file:* ]]; then
  DB_PATH="${DATABASE_URL#file:}"
  DB_DIR="$(dirname "$DB_PATH")"
  if [[ ! -d "$DB_DIR" ]]; then
    log "Criando diretório do banco SQLite: $DB_DIR"
    mkdir -p "$DB_DIR"
  fi
fi

# ------------- Instalação --------------
if $DO_INSTALL; then
  log "Instalando dependências..."
  case "$PM" in
    # For prod we ensure devDeps are present (tsx for seeds), then optionally prune later
    npm)
      if $PROD; then npm_config_production=false npm ci; else npm install; fi
      ;;
    pnpm)
      if $PROD; then pnpm install --frozen-lockfile --prod=false; else pnpm install; fi
      ;;
    yarn)
      if $PROD; then yarn install --frozen-lockfile --production=false; else yarn install; fi
      ;;
    bun)
      bun install
      ;;
  esac
else
  log "Pulando instalação (--no-install)."
fi

# --------------- Prisma ----------------
log "Prisma generate..."
case "$PM" in
  npm)  npm run db:generate ;;
  pnpm) pnpm run db:generate ;;
  yarn) yarn db:generate ;;
  bun)  bun run db:generate ;;
esac

if $PROD; then
  log "Aplicando migrações em produção (migrate deploy)..."
  prisma migrate deploy
else
  log "Migrações de desenvolvimento (migrate dev)..."
  case "$PM" in
    npm)  npm run db:migrate ;;
    pnpm) pnpm run db:migrate ;;
    yarn) yarn db:migrate ;;
    bun)  bun run db:migrate ;;
  esac
fi

# ---------------- Seed -----------------
if $DO_SEED; then
  log "Rodando seed principal (db:seed)..."
  if npm run | grep -q "db:seed"; then
    case "$PM" in
      npm)  npm run db:seed ;;
      pnpm) pnpm run db:seed ;;
      yarn) yarn db:seed ;;
      bun)  bun run db:seed ;;
    esac
  else
    warn "Script db:seed não encontrado. Pulando."
  fi

  log "Rodando seed de categorias (db:seed:categories)..."
  if npm run | grep -q "db:seed:categories"; then
    case "$PM" in
      npm)  npm run db:seed:categories ;;
      pnpm) pnpm run db:seed:categories ;;
      yarn) yarn db:seed:categories ;;
      bun)  bun run db:seed:categories ;;
    esac
  else
    warn "Script db:seed:categories não encontrado. Pulando."
  fi
else
  log "Pulando seed (--no-seed)."
fi

# --------------- Build -----------------
if $DO_BUILD; then
  log "Buildando Next.js..."
  if $PROD; then export NODE_ENV=production NEXT_TELEMETRY_DISABLED=1; fi
  case "$PM" in
    npm)  npm run build ;;
    pnpm) pnpm build ;;
    yarn) yarn build ;;
    bun)  bun run build ;;
  esac
else
  log "Pulando build (--skip-build)."
fi

# --------------- Start -----------------
if $DO_START; then
  PORT="${PORT:-3000}"
  HOST="${HOST:-0.0.0.0}"
  if $USE_PM2; then
    log "Gerenciando via PM2: name=$PM2_NAME instances=$PM2_INSTANCES host=$HOST port=$PORT"
    # Prefer pm2 if installed, else fallback to npx
    if command -v pm2 >/dev/null 2>&1; then PM2_CMD=pm2; else PM2_CMD="npx pm2"; fi
    # Path to next bin (JS file) for cluster support
    NEXT_BIN="$ROOT_DIR/node_modules/next/dist/bin/next"
    if [[ ! -x "$NEXT_BIN" ]]; then
      warn "next bin não encontrado em $NEXT_BIN; usando 'next' do PATH"
      NEXT_BIN="next"
    fi
    NODE_BIN="$(command -v node)"
    # Subcommand
    if $PROD; then
      export NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
      SUBCMD="start"
    else
      SUBCMD="dev"
    fi
    # Check if process exists
    if $PM2_CMD describe "$PM2_NAME" >/dev/null 2>&1; then
      log "Processo PM2 existente. Aplicando reload com --update-env"
      $PM2_CMD reload "$PM2_NAME" --update-env
    else
      # Start new process
      EXTRA=()
      [[ "$PM2_INSTANCES" != "1" ]] && EXTRA+=( -i "$PM2_INSTANCES" )
      if $PM2_WATCH && [[ $PROD == false ]]; then EXTRA+=( --watch ); fi
      if [[ "$NEXT_BIN" == "next" ]]; then
        # Starting via `next` on PATH
        $PM2_CMD start "$NEXT_BIN" --name "$PM2_NAME" --time --restart-delay 200 --cwd "$ROOT_DIR" "${EXTRA[@]}" -- "$SUBCMD" -p "$PORT" -H "$HOST"
      else
        # Starting via JS bin file with explicit Node interpreter (nvm compatible)
        $PM2_CMD start "$NEXT_BIN" --interpreter "$NODE_BIN" --name "$PM2_NAME" --time --restart-delay 200 --cwd "$ROOT_DIR" "${EXTRA[@]}" -- "$SUBCMD" -p "$PORT" -H "$HOST"
      fi
    fi
    if $PM2_SAVE; then
      log "Salvando configuração PM2 (pm2 save)"
      $PM2_CMD save || true
    fi
    log "PM2 ok. Logs: pm2 logs $PM2_NAME"
  else
    log "Subindo servidor em http://$HOST:$PORT ..."
    if $PROD; then
      NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 next start -p "$PORT" -H "$HOST"
    else
      next dev -p "$PORT" -H "$HOST"
    fi
  fi
else
  log "Concluído. Use --start para iniciar automaticamente."
fi
