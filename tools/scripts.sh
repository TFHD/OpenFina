#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
MIGRATIONS_DIR="${ROOT_DIR}/migrations"

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-openfina}"
DB_USER="${DB_USER:-openfina_user}"
DB_PASS="${DB_PASS:-1234}"

log() {
  printf '\n[%s] %s\n' "$(date '+%H:%M:%S')" "$*"
}

error() {
  printf '\n[ERROR] %s\n' "$*" >&2
}

load_env() {
  if [[ -f "${ROOT_DIR}/.env" ]]; then
    set -a
    source "${ROOT_DIR}/.env"
    set +a
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-3306}"
    DB_NAME="${DB_NAME:-openfina}"
    DB_USER="${DB_USER:-openfina_user}"
    DB_PASS="${DB_PASS:-1234}"
  fi
}

mysql_client_available() {
  command -v mysql >/dev/null 2>&1
}

mysql_server_running() {
  if mysql_client_available; then
    if mysqladmin ping -h "${DB_HOST}" --silent 2>/dev/null; then
      return 0
    fi
  fi

  if command -v systemctl >/dev/null 2>&1; then
    systemctl is-active --quiet mysql 2>/dev/null && return 0
    systemctl is-active --quiet mariadb 2>/dev/null && return 0
  fi

  return 1
}

mysql_as_root() {
  if mysql -u root -e "SELECT 1" >/dev/null 2>&1; then
    mysql -u root "$@"
    return
  fi

  if sudo mysql -e "SELECT 1" >/dev/null 2>&1; then
    sudo mysql "$@"
    return
  fi

  if [[ -n "${MYSQL_ROOT_PASSWORD:-}" ]]; then
    mysql -u root -p"${MYSQL_ROOT_PASSWORD}" "$@"
    return
  fi

  error "Impossible de se connecter à MySQL en tant que root."
  error "Essayez: sudo mysql"
  error "Ou définissez MYSQL_ROOT_PASSWORD avant de lancer le setup."
  exit 1
}

mysql_as_app() {
  mysql \
    -h "${DB_HOST}" \
    -P "${DB_PORT}" \
    -u "${DB_USER}" \
    -p"${DB_PASS}" \
    "$@"
}

install_mysql() {
  if mysql_client_available && mysql_server_running; then
    log "MySQL est déjà installé et actif."
    return 0
  fi

  if ! command -v apt-get >/dev/null 2>&1; then
    error "Installation automatique supportée uniquement sur Debian/Ubuntu (apt-get)."
    error "Installez MySQL manuellement puis relancez: make migrate"
    exit 1
  fi

  log "Installation de MySQL via apt..."
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y mysql-server

  log "Démarrage du service MySQL..."
  sudo systemctl enable mysql
  sudo systemctl start mysql

  if ! mysql_server_running; then
    error "MySQL installé mais le service ne répond pas."
    exit 1
  fi

  log "MySQL installé avec succès."
}

run_user_migration() {
  local user_migration="${MIGRATIONS_DIR}/00_user.sql"

  if [[ ! -f "${user_migration}" ]]; then
    error "Migration utilisateur introuvable: ${user_migration}"
    exit 1
  fi

  log "Création de la base '${DB_NAME}' et de l'utilisateur '${DB_USER}'..."
  mysql_as_root < "${user_migration}"
}

run_schema_migrations() {
  local migration

  for migration in "${MIGRATIONS_DIR}"/*.sql; do
    [[ -f "${migration}" ]] || continue
    [[ "$(basename "${migration}")" == "00_user.sql" ]] && continue

    log "Migration: $(basename "${migration}")"
    mysql_as_app "${DB_NAME}" < "${migration}"
  done
}

run_migrations() {
  load_env

  if ! mysql_client_available; then
    error "Le client mysql est introuvable. Lancez d'abord: make mysql"
    exit 1
  fi

  if ! mysql_server_running; then
    error "MySQL ne répond pas. Lancez d'abord: make mysql"
    exit 1
  fi

  run_user_migration
  run_schema_migrations

  log "Migrations terminées."
  log "Base: ${DB_NAME} | Utilisateur: ${DB_USER}"
}

install_npm_deps() {
  if ! command -v npm >/dev/null 2>&1; then
    error "npm est introuvable. Installez Node.js 20+ puis relancez."
    exit 1
  fi

  log "Installation des dépendances npm..."
  cd "${ROOT_DIR}"
  npm install
  log "Dépendances npm installées."
}

ollama_server_running() {
  curl -sf "http://localhost:11434/" >/dev/null 2>&1
}

install_ollama() {
  load_env
  local model="${OLLAMA_MODEL:-qwen2.5:7b}"

  if ! command -v ollama >/dev/null 2>&1; then
    if ! command -v curl >/dev/null 2>&1; then
      error "curl est requis pour installer Ollama."
      exit 1
    fi

    log "Installation d'Ollama..."
    curl -fsSL https://ollama.com/install.sh | sh
  else
    log "Ollama est déjà installé."
  fi

  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl enable ollama 2>/dev/null || true
    sudo systemctl start ollama 2>/dev/null || true
  fi

  local retries=30
  while ! ollama_server_running && (( retries > 0 )); do
    sleep 1
    retries=$((retries - 1))
  done

  if ! ollama_server_running; then
    error "Ollama ne répond pas sur http://localhost:11434"
    exit 1
  fi

  if ollama list 2>/dev/null | awk '{print $1}' | grep -Fxq "${model}"; then
    log "Modèle '${model}' déjà présent."
    return 0
  fi

  log "Téléchargement du modèle '${model}' (peut prendre plusieurs minutes)..."
  ollama pull "${model}"
  log "Modèle '${model}' installé."
}

setup_all() {
  install_mysql
  run_migrations
  install_npm_deps
  log "Setup terminé."
  log "Pensez à configurer .env (cp .env.example .env) si ce n'est pas déjà fait."
}

start_tunnel() {
  local port="${1:-5173}"

  if ! command -v cloudflared >/dev/null 2>&1; then
    error "cloudflared est introuvable."
    error "Installez-le: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    error "Ou sur Debian/Ubuntu: sudo apt install cloudflared"
    exit 1
  fi

  log "Tunnel Cloudflare vers http://localhost:${port}"
  log "URL webhook Powens: https://<url-affichée>/webhook/connection_synced/"
  log "Appuyez sur Ctrl+C pour arrêter."
  cloudflared tunnel --url "http://localhost:${port}"
}

print_usage() {
  cat <<EOF
Usage: $(basename "$0") <commande>

Commandes:
  install-mysql   Installe MySQL si absent (Debian/Ubuntu)
  migrate         Crée la base/utilisateur et applique les migrations
  npm-install     Installe les dépendances npm
  install-ollama  Installe Ollama et télécharge le modèle (défaut: qwen2.5:7b)
  setup           Setup complet (MySQL + migrations + npm)
  tunnel [port]   Expose l'app via Cloudflare Tunnel (défaut: 5173)
EOF
}

main() {
  local command="${1:-}"

  case "${command}" in
    install-mysql) install_mysql ;;
    migrate) run_migrations ;;
    npm-install) install_npm_deps ;;
    install-ollama) install_ollama ;;
    setup) setup_all ;;
    tunnel) start_tunnel "${2:-5173}" ;;
    *)
      print_usage
      exit 1
      ;;
  esac
}

main "$@"
