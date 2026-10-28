# CLAUDE.md — Exam Simulator

Ce fichier est la référence pour tout agent IA travaillant sur ce repo.
Il prime sur tes habitudes par défaut. En cas de conflit entre ce fichier et un ticket,
**arrête-toi et pose la question** (voir section 11).

---

## 1. Le produit

**Exam Simulator** est une application de révision par questionnaires, utilisable sur web et mobile.

- L'utilisateur choisit un **sujet** (certification tech comme AZ-204, concours public, autre examen).
- Il s'entraîne par **thème** (mode entraînement) ou passe un **examen blanc** chronométré.
- Il consulte sa **progression** par thème pour savoir quoi réviser.

Utilisateurs cibles : personnes qui préparent un examen, sur téléphone (usage principal) et ordinateur.

Priorités produit, dans l'ordre :
1. Les questions et les corrections sont justes (une mauvaise correction fait perdre confiance).
2. L'expérience mobile est fluide.
3. La progression de l'utilisateur n'est jamais perdue.

---

## 2. État actuel du repo

- `backend/` : solution .NET (4 projets + 5 projets de tests), endpoint technique `GET /health`, tests d'architecture.
  - Domain : `Result` / `Result<T>` / `Error` (`Common/`), entités `Category` et `Subject` (`Subjects/`).
  - Application : interfaces `IUnitOfWork`, `ICategoryRepository`, `ISubjectRepository`. Aucun handler pour l'instant.
  - Infrastructure : `ExamSimulatorDbContext` (EF Core + PostgreSQL), dépôts, migration initiale, `AddInfrastructure`.
  - Api : aucun endpoint métier pour l'instant.
- `docker-compose.yml` : PostgreSQL 18 pour le développement local.
- `frontend/` : React + TypeScript + Vite en PWA, une page d'accueil. Aucun appel API pour l'instant.
- `legacy/` : ancien prototype React + Vite en JavaScript (`legacy/src/data.js` contient des questions AZ-204).
- `docs/adr/` : décisions d'architecture 0001, 0002 et 0003.
- `.github/workflows/` : CI (jobs `backend`, `legacy`, `frontend`) et workflows des agents.

Règles pour le legacy :
- Ne le modifie pas.
- Il sert de référence fonctionnelle, pas de modèle de code.
- Les questions de `legacy/src/data.js` ne seront importées qu'après relecture humaine (voir section 8).
  L'examen AZ-204 a été retiré par Microsoft le 31/07/2026 : ces questions servent uniquement de données de test.

La cible complète est décrite ci-dessous.

---

## 3. Architecture cible

### Vue d'ensemble

```
[ Web / Mobile (PWA React) ]  --HTTPS/JSON-->  [ API ASP.NET Core ]  -->  [ PostgreSQL ]
```

- **Une seule application front** React + TypeScript, installable sur mobile en PWA.
- **Une API REST** .NET, seule source de vérité (scores, chronomètre, progression).
- Le front ne contient **aucune règle métier critique** : il affiche et envoie.

### Arborescence cible

```
/
├── CLAUDE.md
├── docker-compose.yml          # PostgreSQL local
├── .config/dotnet-tools.json   # Outils .NET locaux (dotnet-ef)
├── docs/
│   └── adr/                    # Décisions d'architecture (0001-xxx.md)
├── backend/
│   ├── src/
│   │   ├── ExamSimulator.Domain/          # Entités, règles métier. Aucune dépendance.
│   │   ├── ExamSimulator.Application/     # Cas d'usage, interfaces, DTOs, validation
│   │   ├── ExamSimulator.Infrastructure/  # EF Core, PostgreSQL, implémentations
│   │   └── ExamSimulator.Api/             # Endpoints HTTP, auth, configuration
│   └── tests/
│       ├── ExamSimulator.Domain.Tests/
│       ├── ExamSimulator.Application.Tests/
│       ├── ExamSimulator.Infrastructure.Tests/   # Persistance, vraie base via Testcontainers
│       ├── ExamSimulator.Api.IntegrationTests/
│       └── ExamSimulator.ArchitectureTests/
├── frontend/                   # React + TypeScript + Vite (PWA)
│   └── src/
│       ├── app/                # Routing, providers, layout
│       ├── features/           # Un dossier par fonctionnalité (subjects, practice, exam, progress, auth)
│       ├── shared/             # Composants UI et utilitaires réutilisables
│       └── api/                # Client HTTP et types générés depuis l'OpenAPI
└── legacy/                     # Ancien prototype, déplacé ici lors de la migration
```

### Règles de dépendances backend (vérifiées par les tests d'architecture)

| Projet | Peut référencer |
|---|---|
| Domain | Rien |
| Application | Domain |
| Infrastructure | Application, Domain |
| Api | Application, Infrastructure (uniquement pour l'enregistrement DI) |

- **Domain** : entités, value objects, invariants. Pas d'EF Core, pas d'attributs de persistance, pas d'`async` d'I/O.
- **Application** : un cas d'usage = une classe handler explicite (ex. `StartExamAttemptHandler`)
  injectée directement. Définit les interfaces (`IExamAttemptRepository`, `IClock`...).
- **Infrastructure** : `DbContext`, configurations EF (`IEntityTypeConfiguration<T>`), repositories.
- **Api** : Minimal APIs groupées par fonctionnalité (`MapGroup`), aucune logique métier.
  Un endpoint valide l'entrée, appelle un handler, mappe le résultat en réponse HTTP.

### Stack technique

**Backend**
- .NET 10 (LTS), C#, `Nullable` activé, `TreatWarningsAsErrors` activé
- ASP.NET Core Minimal APIs
- EF Core + Npgsql (PostgreSQL 18), noms en snake_case via `EFCore.NamingConventions`
- FluentValidation pour la validation des entrées
- ASP.NET Core Identity avec jetons bearer pour l'authentification (voir ADR à écrire)
- OpenAPI intégré (`Microsoft.AspNetCore.OpenApi`)
- Mapping manuel (méthodes d'extension `ToDto()`), **pas d'AutoMapper**
- Handlers explicites, **pas de MediatR**

**Frontend**
- React + TypeScript (`strict: true`) + Vite
- PWA via `vite-plugin-pwa`
- React Router pour la navigation
- TanStack Query pour les appels API et le cache
- Zod pour valider les réponses de l'API côté client
- Types API générés depuis le document OpenAPI du backend (`openapi-typescript`)
- CSS mobile-first

**Tests**
- Backend : xUnit, Shouldly, Testcontainers (PostgreSQL), `WebApplicationFactory`, NetArchTest.Rules
- Frontend : Vitest, Testing Library (`@testing-library/react`, `@testing-library/dom`, `@testing-library/jest-dom`), jsdom
- Icônes PWA : `@vite-pwa/assets-generator` (script `npm run generate-pwa-assets`)

---

## 4. Modèle de domaine

Glossaire (utilise ces noms exacts dans le code, en anglais) :

| Terme | Signification |
|---|---|
| `Category` | Famille de sujets : Tech, Concours public, Langues... |
| `Subject` | Un examen à préparer : « AZ-204 », « Concours attaché territorial » |
| `Topic` | Un thème d'un sujet : « Azure Functions », « Droit administratif ». A un poids (%) |
| `Question` | Énoncé, type, choix, explication, difficulté, source |
| `Choice` | Une réponse possible, correcte ou non |
| `ExamBlueprint` | Règles d'un examen blanc : nombre de questions, durée, score de réussite, répartition par thème |
| `ExamAttempt` | Une tentative d'un utilisateur : début, fin, statut, score |
| `AttemptAnswer` | Réponse d'un utilisateur à une question dans une tentative |
| `TopicProgress` | Taux de réussite d'un utilisateur par thème |

Types de questions (v1) : `SingleChoice`, `MultipleChoice`, `TrueFalse`.

### Invariants métier (à tester unitairement dans Domain)

- Une question a au moins 2 choix.
- `SingleChoice` et `TrueFalse` : exactement 1 choix correct. `MultipleChoice` : au moins 1.
- Une question a toujours une explication non vide et une source.
- La somme des poids des thèmes d'un `ExamBlueprint` vaut 100 %.
- Une `ExamAttempt` soumise ou expirée est **immuable**.
- Le **score est calculé uniquement côté serveur**.
- Le **chronomètre fait foi côté serveur** : une réponse reçue après l'expiration est refusée.
  Le front affiche le temps restant mais ne décide de rien.

---

## 5. Conventions de code

### C#
- Noms en anglais. Commentaires uniquement pour expliquer un *pourquoi* non évident.
- Pas d'opérateur `!` (null-forgiving) sans commentaire justifiant pourquoi c'est sûr.
- `async`/`await` de bout en bout, `CancellationToken` propagé dans toutes les méthodes async.
- Pas d'exceptions pour le flux métier attendu : retourne un résultat typé `Result` / `Result<T>`,
  défini dans `ExamSimulator.Domain` (dossier `Common/`), car le Domain ne peut référencer aucun autre projet.
  Les entités sont créées par une méthode statique `Create(...)` qui retourne `Result<T>` (pas de constructeur public).
  Une exception n'est utilisée que pour une erreur de programmation (cas qui ne devrait jamais arriver).
- Classes `sealed` par défaut. Records pour les DTOs.
- Pas de `DateTime.Now` : utilise `TimeProvider` injecté (testable).

### TypeScript
- Pas de `any`. Si un type est inconnu, `unknown` puis validation Zod.
- Composants fonctionnels, un composant par fichier.
- Un appel API passe toujours par `src/api/`, jamais de `fetch` direct dans un composant.

---

## 6. Conventions API

- Préfixe : `/api/v1/...`. Ressources au pluriel (`/api/v1/subjects`).
- Erreurs : toujours au format **ProblemDetails** (RFC 9457).
- Codes : 200/201/204 succès, 400 validation, 401 non authentifié, 403 interdit, 404 introuvable, 409 conflit d'état.
- Pagination sur toute liste : `?page=1&pageSize=20`, `pageSize` maximum 100.
- Les endpoints exposent des **DTOs**, jamais des entités du domaine.
- **Ne jamais renvoyer les bonnes réponses d'une question avant la soumission** de l'entraînement ou de l'examen.
- Tout endpoint modifié met à jour le document OpenAPI et les types générés du front dans la même PR.

---

## 7. Données

- PostgreSQL. Migrations EF Core dans `ExamSimulator.Infrastructure/Persistence/Migrations`,
  appliquées à la main (`dotnet ef database update`), jamais automatiquement au démarrage.
- Tables et colonnes en snake_case (convention automatique, ne pas forcer de noms en PascalCase).
- Configuration des entités uniquement par `IEntityTypeConfiguration<T>` (aucun attribut dans le Domain).
  Les longueurs maximales réutilisent les constantes du Domain (`NameMaxLength`...).
- Clés étrangères en `DeleteBehavior.Restrict` (pas de suppression en cascade).
- Les dépôts ne sauvegardent pas : le cas d'usage appelle `IUnitOfWork.SaveChangesAsync`.
- L'API refuse de démarrer sans `ConnectionStrings:Default` (user-secrets ou variable d'environnement).
- Les tests qui démarrent l'API (`WebApplicationFactory`) utilisent l'environnement `Testing`
  (les user-secrets ne sont chargés qu'en `Development`).
- **Ne modifie jamais une migration déjà commitée** : crée-en une nouvelle.
- Toute migration qui supprime ou renomme une colonne ou une table est signalée en tête de la PR.
- Les identifiants sont des `Guid`.
- Les dates sont en UTC (`DateTimeOffset`).

---

## 8. Contenu des questions (risque juridique et qualité)

- **N'importe jamais de questions issues d'examens réels (« dumps »)** : les examens de certification
  sont couverts par des accords de confidentialité. Le contenu doit être original ou sous licence.
- Chaque question a un champ `Source` (ex. « Rédaction originale », lien vers la documentation officielle).
- Tu ne génères pas de questions de contenu toi-même dans le code ou les seeds,
  sauf si un ticket le demande explicitement. Toute question générée est marquée « à relire » et validée par un humain.

---

## 9. Sécurité

- Aucun secret dans le code ou dans les fichiers commités. Configuration locale via `dotnet user-secrets`
  ou variables d'environnement.
- Tous les endpoints sont authentifiés par défaut, sauf ceux marqués explicitement `AllowAnonymous`.
- Un utilisateur n'accède qu'à **ses** tentatives et sa progression : vérifie toujours le propriétaire côté serveur.
- Valide toute entrée (FluentValidation côté API, Zod côté front).
- CORS : liste explicite d'origines, jamais `AllowAnyOrigin` en dehors du développement.
- Limitation de débit (`RateLimiter`) sur les endpoints d'authentification.

---

## 10. Commandes

```bash
# Base de données locale (développement)
docker compose up -d
dotnet tool restore
dotnet ef database update --project backend/src/ExamSimulator.Infrastructure --startup-project backend/src/ExamSimulator.Api

# Nouvelle migration (aucune base nécessaire pour la générer)
dotnet ef migrations add <Nom> --project backend/src/ExamSimulator.Infrastructure --startup-project backend/src/ExamSimulator.Api --output-dir Persistence/Migrations

# Backend
dotnet build backend
dotnet test backend

# Frontend
cd frontend
npm ci
npm run lint
npm run test
npm run build
```

Avant d'ouvrir une PR, **toutes** ces commandes doivent réussir pour les parties touchées.

Les tests d'infrastructure utilisent Testcontainers : ils ont besoin du **service** Docker
(disponible sur les runners GitHub Actions), pas de la commande `docker`. Lance simplement `dotnet test backend`.
`docker compose` et `dotnet ef database update` sont des vérifications manuelles du mainteneur.

---

## 11. Règles de travail pour l'agent

### Avant de coder
1. Lis le ticket **et tous ses commentaires** : les réponses du mainteneur aux questions ouvertes font foi.
2. Lis le code concerné avant de proposer quoi que ce soit.

### Pendant
- Un ticket = une branche `ai/issue-<numéro>` = une PR.
- Reste dans le périmètre du ticket. Pas de refactoring opportuniste hors périmètre.
- Écris d'abord les tests dérivés des critères d'acceptation, puis le code.
- Taille visée : moins de 400 lignes modifiées (hors fichiers générés et migrations).
  Si c'est plus, propose un découpage au lieu de coder.

### Quand t'arrêter et demander
Arrête-toi, commente la question sur le ticket et ajoute le label `needs-clarification` si :
- le ticket contredit ce fichier ou le code existant ;
- un critère d'acceptation est ambigu ou non testable ;
- tu dois ajouter une dépendance non listée en section 3 ;
- le changement touche l'authentification, la suppression de données ou une migration destructive.

**Ne devine jamais une règle métier.**

### Description de PR (obligatoire)
```
Closes #<numéro>

## Ce qui change
## Critères d'acceptation → tests correspondants
## Hypothèses prises
## Dépendances ajoutées (et pourquoi, y compris tout écart à la liste autorisée par le ticket)
## Migrations (oui/non, destructive ?)
## Points à vérifier en priorité par le relecteur
```

---

## 12. Interdits

- Modifier `CLAUDE.md`, `.github/workflows/` ou les fichiers de configuration de sécurité.
- Pousser sur `main` ou merger une PR.
- Désactiver, supprimer ou affaiblir un test pour le faire passer.
- Ajouter `#pragma warning disable`, `// @ts-ignore` ou `eslint-disable` sans justification écrite dans la PR.
- Ajouter MediatR, AutoMapper ou toute bibliothèque à licence commerciale.
- Commiter un secret, une chaîne de connexion réelle ou un fichier `.env`.

---

## 13. Décisions d'architecture

À consigner dans `docs/adr/` au fur et à mesure.

| # | Décision | Statut |
|---|---|---|
| 0001 | Monorepo backend .NET + frontend React | Proposée |
| 0002 | PWA plutôt qu'application mobile native en v1 | Proposée |
| 0003 | PostgreSQL + EF Core | Proposée |
| 0004 | Authentification : ASP.NET Core Identity ou fournisseur externe | **Ouverte** |

### Hors périmètre v1
Paiement, fonctionnalités sociales, génération de questions par IA, mode hors ligne complet,
répétition espacée (prévue en v2).

---

## 14. Système d'agents (fonctionnement automatique)

Flux : idée (template, label `idea`) → analyste (spec, `to-validate`) → le mainteneur valide (`approved`)
→ architecte (sous-tickets `sub-task` + `area:*` + `risk:*`) → planificateur (un sous-ticket à la fois, `ready-for-agent`)
→ agent spécialisé (PR) → CI → relecteur IA (`ai-approved` / `ai-changes-requested`) → correction automatique
(2 tentatives max) → merge (automatique pour `risk:low` si activé, sinon par le mainteneur).

Conventions lues par des programmes (à respecter au caractère près, en début de ligne, dans un sous-ticket) :
- `Parent : #<numéro de l'idée>`
- `Dépend de : #<numéros séparés par des virgules>` ou `Dépend de : aucun`

Spécialités et fichiers modifiables (vérifié automatiquement, toute PR hors périmètre est refusée) :
- `area:backend` : `backend/`, `docs/`, `README.md`, `.gitignore`, `docker-compose.yml`, `.config/dotnet-tools.json`
- `area:frontend` : `frontend/`, `docs/`, `README.md`, `.gitignore`
- Jamais : `.github/`, `CLAUDE.md`, `legacy/`

Un sous-ticket ne touche qu'un seul domaine. Une évolution qui touche backend et frontend est découpée en deux sous-tickets.
