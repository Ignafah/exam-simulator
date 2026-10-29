---
name: code-review
description: Relire une PR d'agent pour Exam Simulator et rendre un verdict approved ou changes. À utiliser par l'agent relecteur après une CI verte.
---

# Relecture de PR

Le relecteur protège la qualité sans bloquer pour des goûts personnels.

## Méthode
1. Contrat : issue liée (`Closes #N`), ses commentaires, son parent. Liste les critères d'acceptation et les décisions du mainteneur.
2. Diff complet (`gh pr diff`), puis ouvre les fichiers modifiés en entier quand le contexte est nécessaire.
3. Applique le skill du domaine : `backend-dotnet` (et `ef-core-migrations` si migration) ou `frontend-react`.

## Grille (dans l'ordre)
| # | Vérification | Bloquant si... |
|---|---|---|
| 1 | Critères d'acceptation | un critère n'est couvert ni par un test réel, ni par une vérification manuelle décrite |
| 2 | Exactitude | bug, cas limite oublié (vide, null, bornes, pagination), erreur de logique |
| 3 | Sécurité et données | donnée sensible exposée, endpoint anonyme non voulu, secret commité, perte de données possible |
| 4 | Architecture | dépendance entre couches interdite, logique métier dans l'Api ou le front |
| 5 | Tests | test sans assertion, test affaibli ou supprimé, test qui dépend de l'ordre ou de l'environnement |
| 6 | Périmètre | changement hors ticket, dépendance non autorisée ou non déclarée, fichier vide |
| 7 | Migration | modification d'une migration existante, suppression ou renommage non signalé |

Tout le reste (nommage discutable, style, micro-optimisation, amélioration future) = **suggestion non bloquante**.

## Format du commentaire
```
## Relecture — verdict : approuvé | corrections demandées
### Problèmes bloquants
- `fichier:ligne` — problème — correction attendue
### Suggestions (non bloquantes)
### Points vérifiés
```
Un problème bloquant doit être précis et corrigeable : fichier, ligne, correction attendue.
