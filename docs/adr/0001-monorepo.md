# 0001 — Monorepo backend .NET + frontend React

Statut : Proposée

## Contexte

Le produit est composé d'une API .NET et d'un front React. Les deux évoluent ensemble :
un changement d'endpoint met à jour le document OpenAPI et les types du front dans la même PR.

## Décision

Un seul dépôt contient `backend/` (API .NET), `frontend/` (React + TypeScript, à venir)
et `legacy/` (ancien prototype, en cours de migration).

## Conséquences

- Une PR peut modifier l'API et le front de façon cohérente.
- Un seul historique et un seul endroit pour les tickets.
- `global.json` est à la racine pour que `dotnet build backend` lancé depuis la racine utilise le bon SDK.
- Les outils de chaque pile (dotnet, npm) sont lancés par chemin depuis la racine.
