# Exam Simulator

Application de révision par questionnaires (web et mobile) : entraînement par thème, examens blancs chronométrés et suivi de progression.

Voir `CLAUDE.md` pour le produit, l'architecture cible et les conventions.

## Structure

| Dossier | Contenu |
|---|---|
| `backend/` | API ASP.NET Core (.NET 10) : `src/` (Domain, Application, Infrastructure, Api) et `tests/` |
| `frontend/` | Application React + TypeScript + Vite, installable en PWA (Node 22 requis) |
| `legacy/` | Ancien prototype React + Vite (référence fonctionnelle, en cours de migration) |
| `docs/adr/` | Décisions d'architecture |

## Commandes

Backend (SDK .NET 10 requis) :

```bash
dotnet build backend
dotnet test backend   # Docker doit être démarré : les tests lancent un vrai PostgreSQL (Testcontainers)
```

Document OpenAPI : il est généré à chaque `dotnet build backend` dans `backend/openapi/openapi.json` (paquet `Microsoft.Extensions.ApiDescription.Server`, sans base ni configuration) et ce fichier est commité pour que le frontend génère ses types sans lancer l'API. Après toute modification d'un endpoint, relance le build et commite le fichier mis à jour. L'API sert aussi le document sur `GET /openapi/v1.json`.

Configuration CORS : `Cors:AllowedOrigins` (liste d'origines). `http://localhost:5173` en développement ; vide par défaut ailleurs (variable d'environnement `Cors__AllowedOrigins__0`, etc.).

Base de données locale (Docker requis) :

```bash
docker compose up -d                      # lance PostgreSQL sur 127.0.0.1:5432
dotnet tool restore                       # installe dotnet-ef (outil local)

# Chaîne de connexion : jamais dans un fichier commité. L'API refuse de démarrer sans elle.
# Les identifiants ci-dessous sont ceux (fictifs) de docker-compose.yml.
dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Port=5432;Database=examsimulator;Username=examsimulator;Password=dev-only-password" --project backend/src/ExamSimulator.Api

dotnet ef database update --project backend/src/ExamSimulator.Infrastructure --startup-project backend/src/ExamSimulator.Api

# Créer une nouvelle migration (ne jamais modifier une migration déjà commitée)
dotnet ef migrations add <Nom> --project backend/src/ExamSimulator.Infrastructure --startup-project backend/src/ExamSimulator.Api --output-dir Persistence/Migrations
```

Autre possibilité : la variable d'environnement `ConnectionStrings__Default`.

Frontend (Node 22 requis), depuis la racine du dépôt :

```bash
npm ci --prefix frontend                  # installer les dépendances
npm run dev --prefix frontend             # serveur de développement
npm run lint --prefix frontend            # analyse statique (ESLint)
npm run test --prefix frontend            # tests (une seule exécution)
npm run build --prefix frontend           # build de production dans frontend/dist
npm run preview --prefix frontend         # servir le build localement
npm run generate-pwa-assets --prefix frontend  # régénérer les icônes depuis public/icon.svg
```

Prototype legacy :

```bash
cd legacy && npm ci && npm run build
```
