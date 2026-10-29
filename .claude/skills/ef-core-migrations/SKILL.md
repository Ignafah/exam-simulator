---
name: ef-core-migrations
description: Créer et vérifier une migration EF Core PostgreSQL sans risque pour les données. À utiliser dès qu'un ticket modifie une entité persistée, une configuration EF ou le schéma.
---

# Migrations EF Core

## Procédure
1. Modifie l'entité (Domain) et sa configuration `IEntityTypeConfiguration<T>` (Infrastructure).
   Longueurs maximales = constantes du Domain. Clés étrangères en `DeleteBehavior.Restrict`.
2. Génère (aucune base nécessaire) :
   `dotnet tool restore`
   `dotnet ef migrations add <NomExplicite> --project backend/src/ExamSimulator.Infrastructure --startup-project backend/src/ExamSimulator.Api --output-dir Persistence/Migrations`
   La commande démarre l'Api, qui exige une chaîne de connexion. Fournis une valeur factice hors du dépôt :
   `dotnet user-secrets set "ConnectionStrings:Default" "Host=localhost;Database=design;Username=design;Password=design" --project backend/src/ExamSimulator.Api`
   (les user-secrets sont stockés hors du dépôt : rien n'est commité).
3. Relis le fichier généré ligne par ligne :
   - noms en snake_case (`category_id`, `pk_subjects`) ;
   - types attendus (`uuid`, `character varying(n)`, `timestamp with time zone` pour `DateTimeOffset`) ;
   - aucun `DropTable`, `DropColumn`, `RenameColumn` non prévu par le ticket ;
   - une nouvelle colonne obligatoire sur une table existante a une valeur par défaut, sinon la migration échoue sur des données réelles.
4. `dotnet test backend` : le test `MigrationTests` vérifie que les migrations s'appliquent sur une base vide
   et qu'il ne reste aucune différence entre le modèle et les migrations.

## Interdits
- Modifier ou supprimer une migration déjà présente sur `main`.
- Écrire du SQL brut pour contourner EF, sauf demande explicite du ticket.
- Appliquer les migrations au démarrage de l'API.

## Dans la PR
Section « Migrations » : nom de la migration, tables et colonnes créées, et en tête de la PR toute suppression ou renommage.
