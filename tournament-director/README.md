# Tournament Director

Système de gestion de tournois de poker en temps réel, construit sur une architecture microservices événementielle.

## Architecture Globale

Le projet est divisé en plusieurs microservices autonomes qui communiquent de trois manières :

- **Synchrone (HTTP / REST)**  
   Via une **API Gateway** unifiée pour les clients (Frontend / Scripts de test).

- **Asynchrone (Kafka)**  
   Pour la cohérence des données et les workflows complexes  
   (Event-Driven + Saga Pattern).

- **Temps réel (WebSockets)**  
   Pour la diffusion du timer, des niveaux et des états de jeu.

Voici les technos utilisés :

- **Node.js & Fastify** — Framework serveur haute performance
- **Apache Kafka** — Bus d’événements inter-services
- **Redis (Valkey)** — Cache distribué, verrous (Redlock) et Pub/Sub
- **MySQL** — Persistance relationnelle
- **Yarn Berry (v4)** — Monorepo avec Plug’n’Play (PnP)


## Prérequis

Avant de lancer le projet :

1. **Node.js** — v24.11.1 recommandée
2. **Yarn** — v1.22+ ou v4  
   ```bash
   corepack enable
   ```
3. **Docker Desktop** (ou Docker Engine + Docker Compose)  
   **Indispensable** pour Kafka, MySQL et Redis

4. **ENV** - Il faut 2 fichiers .env afin de démarrer les microservices correctement. 

   Le premier est dans `/tournament-directory`

```bash
# --- DATABASE ---
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=Root@1234
DB_PORT=3306
DB_NAME=tournament

# --- KAFKA ---
KAFKA_BROKERS=localhost:9092
KAFKA_TOPIC_TOURNAMENT=tournament-events
KAFKA_TOPIC_TIMER=timer-events

# --- PORTS ---
PORT_TOURNAMENT=3001
PORT_PLAYERS=3002
PORT_TIMER=3003
PORT_TABLES=3004
```

Le deuxième dans le dossier `/tournament-directory/packages/services/api-gateway` :

```bash
PORT=8080
```

## Installation et lancement

Cloner le dépôt ou télécharger les fichiers.

### Back

1. Se placer dans le dossier `tournament-director` :
```bash
cd tournament-director
```

2. Installation des dépendances

```bash
yarn install
```

3. Démarrage de l’infrastructure (Docker)

```bash
docker compose up -d
```

⏳ Attendre 1 minute que Kafka et MySQL soient prêts.

4. Démarrage des microservices

```bash
yarn start:all
```

### Front

1. Se placer dans le dossier du front :
```bash
cd tournament-director-front/tournament-poker
```

2. Installation des dépendances

```bash
npm install
```

3. Démarrage de l’infrastructure (Docker)

```bash
npm run dev
```

## C'est parti !
Se rendre sur http://localhost:5173/

## Commandes Utiles

- Lancer les tests de tous les services
```bash
yarn test
```

- Arrêter l’infrastructure Docker
```bash
docker compose down
```

- Reset complet (BDD + volumes)
```bash
docker compose down -v
```

- Lancer un service spécifique
```bash
yarn workspace <nom-du-service> start
```

## 🧩 Microservices

| Service                   | Port   | Rôle                                                                                       |
|---------------------------|--------|--------------------------------------------------------------------------------------------|
| **API Gateway**       | `8080` | Point d’entrée unique. Valide les requêtes, route vers les services et agrège les erreurs. |
| **Tournament Service** | `3001` | Chef d’orchestre. Gère le cycle de vie du tournoi (création, start, level up).             |
| **Players Service**    | `3002` | Gestion des inscriptions et du référentiel joueurs (Pattern Pivot).                        |
| **Timer Service**      | `3003` | Gestion du temps réel (WebSockets), pauses/reprises et calcul des blinds.                  |
| **Tables Service**     | `3004` | Algorithme d’équilibrage des tables (balancing) et placement des joueurs.                  |

---

**Membres du groupe :**  
- Fabien Burguion  
- Lucas Burgaud  
- Mélody Bastien
- Paul Grangeon 
