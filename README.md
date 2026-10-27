# Exam Simulator

Application de révision par questionnaires (web et mobile) : entraînement par thème, examens blancs chronométrés et suivi de progression.

Voir `CLAUDE.md` pour le produit, l'architecture cible et les conventions.

## Structure

| Dossier | Contenu |
|---|---|
| `backend/` | API ASP.NET Core (.NET 10) : `src/` (Domain, Application, Infrastructure, Api) et `tests/` |
| `legacy/` | Ancien prototype React + Vite (référence fonctionnelle, en cours de migration) |
| `docs/adr/` | Décisions d'architecture |

## Commandes

Backend (SDK .NET 10 requis) :

```bash
dotnet build backend
dotnet test backend
```

Prototype legacy :

```bash
cd legacy && npm ci && npm run build
```
