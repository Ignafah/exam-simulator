---
name: spec-writing
description: Transformer une idée brute en spécification exécutable pour Exam Simulator. À utiliser par l'agent analyste avant d'écrire une spec (label idea ou refine).
---

# Rédiger une spec

Objectif : une spec que le mainteneur (débutant) valide en 5 minutes et qu'un agent peut exécuter sans deviner.

## Avant d'écrire
1. Lis `CLAUDE.md` en entier, l'idée, ses commentaires, et le ticket parent s'il y en a un.
2. Liste les tickets existants (`gh issue list --state all --limit 50`) : repère les doublons et les dépendances.
3. Lis le code réellement concerné. Ne décris jamais un fichier ou une classe sans l'avoir ouvert.

## Format (sections obligatoires, dans cet ordre)
Résumé (2 lignes) · Problème métier · Valeur attendue · Avis critique · Hors périmètre ·
Critères d'acceptation · Approche technique · Hypothèses · Questions ouvertes · Risques · Taille (S/M/L).

## Règles de qualité
- **Avis critique honnête** : redondant, surdimensionné, prématuré ou faible valeur ? Dis-le. Cite la dépendance manquante.
- **Critères d'acceptation** en Given/When/Then, avec des valeurs concrètes (100 caractères, page 2, code 400).
  - Ce qui peut régresser (comportement, règle métier, sécurité) : test automatisé.
  - Ce qui est posé une seule fois (fichier de configuration, manifeste, liste de dépendances) :
    « vérification manuelle en review ». Jamais de script qui lit des fichiers de configuration.
  - Toujours au moins un cas d'erreur et un cas limite.
- **Approche technique** : couches et fichiers concernés selon `CLAUDE.md` §3, une alternative écartée avec la raison,
  liste fermée des dépendances et commandes nécessaires.
- **Hypothèses** : tout ce que tu as supposé faute d'information. Zéro hypothèse = relis, c'est presque toujours faux.
- **Questions ouvertes** : uniquement les choix qui reviennent au mainteneur (métier, produit, coût, sécurité).
  Pour chacune, propose une réponse par défaut et sa raison : le mainteneur pourra répondre « OK ».
- **Décisions coûteuses à changer plus tard** (schéma de base, nommage, contrat d'API, format d'erreur) :
  signale-les explicitement, elles doivent être tranchées maintenant.
- **Taille** : L = propose un découpage en tickets S ou M, chacun d'un seul domaine (backend OU frontend).

## Style
Français simple, phrases courtes, termes techniques expliqués en une demi-phrase la première fois.

## Mode découpage (label `breakdown`)
L'idée demande de découper une fonctionnalité en **petites stories**, et non une spec à implémenter.
Ta sortie est une **liste de stories proposée**, que le mainteneur valide, corrige ou complète.

### Ce qu'est une « petite » story
- Une seule taille : **S**. Un seul domaine (backend OU frontend). Une seule PR de moins de 150 lignes environ.
- Un seul comportement observable, ou une seule brique technique indispensable (entité, endpoint, écran).
- Le mainteneur doit pouvoir la valider en moins de 10 minutes.
- Indépendante autant que possible ; sinon, dépendances explicites.
- Si son titre contient « et », elle est probablement à couper en deux.

### Format de sortie (dans /tmp/spec.md)
```
## Résumé (2 lignes)
## Avis critique
(prérequis manquants, contenu nécessaire, risques, ce qui est prématuré)
## Stories proposées
| # | Titre | En tant que… je veux… afin de… | Domaine | Dépend de |
## Ordre recommandé
(du socle vers l'interface ; les premières stories doivent pouvoir démarrer tout de suite)
## Hors périmètre de la fonctionnalité
## Questions ouvertes
(avec une réponse proposée par défaut pour chacune)
```
Numérote les stories (S1, S2…) : le mainteneur pourra répondre « OK sauf S4 : couper en deux ».
Vise autant de stories que nécessaire pour respecter la taille, sans fusionner pour réduire leur nombre.
