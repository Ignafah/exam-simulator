# 0003 — PostgreSQL + EF Core

Statut : Proposée

## Contexte

La progression de l'utilisateur ne doit jamais être perdue (CLAUDE.md §1).
Le domaine (catégories, sujets, puis questions et tentatives) est relationnel, avec des contraintes d'intégrité fortes.

## Décision

- Le stockage est une base PostgreSQL (version 18, la même en local et dans les tests).
- L'accès aux données passe par EF Core avec le fournisseur Npgsql, uniquement dans `ExamSimulator.Infrastructure`.
  Domain et Application ne référencent ni EF Core ni Npgsql ; Application définit les interfaces (dépôts, `IUnitOfWork`).
- Le schéma est géré par des migrations EF Core, appliquées à la main (`dotnet ef database update`) ; il n'y a pas de migration automatique au démarrage.
- Les tables et colonnes sont en snake_case (`EFCore.NamingConventions`).
- Les clés étrangères n'utilisent pas de suppression en cascade (`DeleteBehavior.Restrict`).
- Les tests de persistance tournent sur une vraie base PostgreSQL via Testcontainers, jamais sur une base simulée.

## Conséquences

- Docker est nécessaire pour lancer `dotnet test backend` et la base locale (`docker compose up -d`).
- L'API refuse de démarrer sans `ConnectionStrings:Default`.
- Une migration déjà commitée n'est jamais modifiée ; toute évolution du schéma crée une nouvelle migration.
- Les dépôts ne sauvegardent pas : le cas d'usage appelle `IUnitOfWork.SaveChangesAsync`.
