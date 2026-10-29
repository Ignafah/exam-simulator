---
name: ticket-planning
description: Découper une idée validée en sous-tickets ordonnés, par domaine et par niveau de risque. À utiliser par l'agent architecte après le label approved.
---

# Découper une idée en sous-tickets

## Principes
- **Un sous-ticket = un domaine** : `area:backend` (dossier `backend/`) ou `area:frontend` (dossier `frontend/`).
  `docs/`, `README.md` et `.gitignore` sont modifiables par les deux.
- **Un sous-ticket = une PR relisable seule**, moins de 400 lignes modifiées hors fichiers générés.
- **Livrable vertical** quand c'est possible : chaque sous-ticket laisse le projet dans un état cohérent, CI verte.
- **Ordre** : les fondations d'abord (Domain → Application → Infrastructure → Api → frontend).
  Un sous-ticket frontend qui consomme un endpoint dépend du sous-ticket qui crée cet endpoint.
- **Pas de sur-découpage** : une petite idée d'un seul domaine = un seul sous-ticket.
- **Reprise** : avant de créer, vérifie les sous-tickets existants de l'idée et ne recrée jamais un doublon.

## Niveau de risque
`risk:high` si le sous-ticket touche : authentification, autorisation, sécurité (CORS, limitation de débit, secrets),
données des utilisateurs, schéma de base de données ou migration, suppression de données, nouvelle dépendance,
configuration de l'application, contrat d'API public existant. Sinon `risk:low`. En cas de doute : `risk:high`.

## Contenu d'un sous-ticket
Il doit être **autonome** : l'agent qui l'exécute ne devrait pas avoir besoin de relire toute l'idée.
Recopie dans chaque sous-ticket les critères d'acceptation et **toutes** les décisions du mainteneur qui le concernent.

Format exact (les deux premières lignes sont lues par un programme, au caractère près) :

```
Parent : #<idée>
Dépend de : #<numéros séparés par des virgules> | aucun

## Contexte
## Ce qu'il faut faire
## Critères d'acceptation
## Décisions du mainteneur à respecter
## Hors périmètre
## Dépendances autorisées
```

## Récapitulatif sur l'idée
Un tableau : numéro, titre, domaine, risque, dépend de. Puis une phrase sur l'ordre d'exécution.
