---
name: frontend-react
description: Recettes et règles pour le frontend React + TypeScript + Vite (PWA) d'Exam Simulator. À utiliser par l'agent frontend et par le relecteur sur une PR area:frontend.
---

# Frontend React : recettes

Référence obligatoire : `CLAUDE.md` §3 (structure, stack) et §5 (TypeScript).

## Structure
- `src/app/` : `App.tsx`, routes, providers (QueryClient, Router), mise en page.
- `src/features/<fonctionnalité>/` : pages, composants, hooks d'une fonctionnalité (`subjects`, `practice`, `exam`...).
- `src/shared/` : composants et utilitaires réutilisés par au moins deux fonctionnalités.
- `src/api/` : client HTTP, schémas Zod, types générés depuis l'OpenAPI. **Seul endroit qui appelle `fetch`.**
- Crée un dossier seulement quand un fichier y entre (pas de dossier vide, pas de `.gitkeep`).

## Recette : afficher des données de l'API
1. `src/api/` : fonction typée (`getSubjects(page, pageSize)`), réponse validée par un schéma Zod.
   Réponse invalide → erreur explicite, jamais de plantage silencieux.
   URL de base de l'API via `import.meta.env.VITE_API_BASE_URL`, jamais en dur.
2. Hook TanStack Query dans la fonctionnalité (`useSubjects`), avec une clé de requête stable.
3. Composant de page : **4 états obligatoires** : chargement, erreur (avec bouton « Réessayer »), vide, données.
4. Tests Vitest + Testing Library : un test par état, API simulée au niveau du module `src/api/` (pas de vrai réseau).

## Règles qui reviennent en review
- Pas de `any`, pas de `@ts-ignore`, pas de `eslint-disable` (le lint échoue de toute façon).
- Aucune règle métier critique dans le front (score, chronomètre, correction) : il affiche ce que renvoie l'API.
- Mobile d'abord : lisible à 360 px de large, zones cliquables d'au moins 44 × 44 px, pas de défilement horizontal.
- Accessibilité : un seul `h1` par page, boutons en `<button>`, liens en `<a>`, textes alternatifs, libellés de formulaire.
- Interface en français.
- Dépendances : uniquement celles autorisées par le ticket ; toute addition se voit dans `package.json` et doit être déclarée dans la PR.

## Vérifications avant PR
`npm ci --prefix frontend`, puis `npm run lint`, `npm run test`, `npm run build` avec `--prefix frontend`.
