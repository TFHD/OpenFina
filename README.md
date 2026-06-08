# OpenFina

Application web full-stack pour gérer ses finances personnelles. Agrège les comptes bancaires via [Powens](https://docs.powens.com/), catégorise les dépenses avec Ollama, et affiche tableaux de bord, investissements et prêts.

**Stack :** React · Vite · Hono · MySQL · TypeScript

Frontend et API tournent dans le **même projet** — un seul serveur à lancer.

<div align="center">
  <img width="1918" height="959" alt="Screenshot from 2026-06-09 00-09-50" src="https://github.com/user-attachments/assets/45ed36ba-9dd0-432f-9665-d616f52c3d1d" width="33%" />
  <img width="1918" height="959" alt="Screenshot from 2026-06-09 00-09-58" src="https://github.com/user-attachments/assets/d0f36280-c38f-4613-88d2-715843f99afe" width="33%" />
  <img width="1918" height="959" alt="Screenshot from 2026-06-09 00-10-05" src="https://github.com/user-attachments/assets/ad57847d-034f-477e-a6ed-375a65493fd8" width="33%" />
</div>
---

## Prérequis

- **Node.js** 20+
- **MySQL** 8+
- Compte développeur **Powens** (sandbox)
- *(Optionnel)* **Ollama** pour la catégorisation automatique des transactions

---

## Démarrage rapide

```bash
git clone <repo>
cd OpenFina

cp .env.example .env
# Renseigner les identifiants Powens dans .env

make setup        # MySQL + migrations + npm install
npm run dev       # Lance l'app
```

Ouvrir [http://localhost:5173](http://localhost:5173).

---

## Installation détaillée

### 1. Variables d'environnement

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `POWENS_CLIENT_ID` / `POWENS_CLIENT_SECRET` / `POWENS_DOMAIN` | Identifiants Powens |
| `POWENS_WEBVIEW_URL` | URL de la webview Powens |
| `POWENS_REDIRECT_URL` | URL de retour après connexion bancaire |
| `POWENS_WHITELISTED_IPS` | IPs autorisées à appeler l'API |
| `DB_*` | Connexion MySQL (défaut : `openfina` / `openfina_user`) |
| `SERVER_PORT` | Port en production (défaut : `8080`) |
| `OLLAMA_*` | Configuration Ollama pour la catégorisation |

Les valeurs par défaut de la base correspondent à ce que crée `make migrate` (voir `migrations/00_user.sql`).

### 2. Base de données

**Tout en une commande :**

```bash
make setup
```

**Étape par étape :**

```bash
make mysql      # Installe MySQL si absent (Debian/Ubuntu)
make migrate    # Crée la base, l'utilisateur et les tables
make deps       # npm install
make ollama     # Ollama + modèle qwen2.5:7b
```

Les migrations SQL sont dans `migrations/`.

### 3. Lancer l'application

#### Développement

```bash
npm run dev
```

- Frontend + API sur **http://localhost:5173**
- L'API est intégrée au serveur Vite (pas de backend séparé)
- Hot reload activé

#### Production

```bash
npm run build   # Compile TypeScript + bundle React → dist/
npm start       # API + frontend sur SERVER_PORT (défaut : 8080)
```

Ouvrir [http://localhost:8080](http://localhost:8080).

---

## Connecter sa banque (Powens)

La synchronisation des comptes ne se fait **pas** en direct depuis le frontend. Le flux est le suivant :

1. Aller sur **Comptes** → **Gérer avec Powens**
2. Connecter sa banque dans la webview Powens
3. Powens envoie un webhook `POST /webhook/connection_synced/` vers ton serveur
4. Les données sont insérées en base
5. Cliquer **Actualiser** pour voir les comptes

### Webhook Powens

Powens doit pouvoir joindre ton serveur via une **URL publique**. Configure le webhook dans ton espace développeur Powens :

```
https://<ton-domaine>/webhook/connection_synced/
```

En développement local, l'app tourne sur `localhost` : il faut donc exposer le port de ton serveur (5173 en dev, 8080 en prod) vers l'extérieur pour que Powens puisse envoyer les données.

**Vérification :** dans les logs, tu dois voir `POST /webhook/connection_synced/` suivi d'un `204`. Si tu vois `Unauthorized IP`, ajoute l'IP dans `POWENS_WHITELISTED_IPS`.

---

## Commandes utiles

| Commande | Description |
|---|---|
| `npm run dev` | Dev server (port 5173) |
| `npm run build` | Build production |
| `npm start` | Serveur production (port 8080) |
| `npm run lint` | ESLint |
| `make setup` | Setup complet (MySQL + migrations + npm) |
| `make migrate` | Applique les migrations SQL |
| `make ollama` | Installe Ollama et le modèle `qwen2.5:7b` |
| `make help` | Liste toutes les cibles Make |

---

## Structure du projet

```
├── src/              # Frontend React
├── server/           # API Hono (routes, middleware, DB)
├── migrations/       # Schéma MySQL
├── tools/scripts.sh  # Scripts de setup
├── Makefile
└── .env              # Configuration (non versionné)
```
