TOOLS := $(CURDIR)/tools/scripts.sh

help:
	@echo "Cibles disponibles:"
	@echo "  make setup    Setup complet (MySQL + migrations + npm)"
	@echo "  make mysql    Installe MySQL si nécessaire"
	@echo "  make migrate  Crée la base/utilisateur et applique les migrations"
	@echo "  make deps     Installe les dépendances npm"
	@echo "  make ollama   Installe Ollama et le modèle qwen2.5:7b"
	@echo "  make tunnel   Expose le dev server (port 5173) via Cloudflare Tunnel"

setup:
	@bash "$(TOOLS)" setup

mysql:
	@bash "$(TOOLS)" install-mysql

migrate:
	@bash "$(TOOLS)" migrate

deps:
	@bash "$(TOOLS)" npm-install

ollama:
	@bash "$(TOOLS)" install-ollama

tunnel:
	@bash "$(TOOLS)" tunnel 5173

.PHONY: help setup mysql migrate deps ollama tunnel