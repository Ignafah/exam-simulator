---
name: backend-dotnet
description: Recettes et règles pour développer le backend .NET 10 d'Exam Simulator (Domain, Application, Infrastructure, Api, tests). À utiliser par l'agent backend et par le relecteur sur une PR area:backend.
---

# Backend .NET : recettes

Référence obligatoire : `CLAUDE.md` §3 (couches), §5 (C#), §6 (API), §7 (données), §9 (sécurité).

## Où mettre quoi
| Besoin | Projet | Exemple existant |
|---|---|---|
| Entité, règle métier, invariant | Domain | `Subjects/Subject.cs` (`Create` → `Result<T>`) |
| Erreur métier nommée | Domain | `Subjects/SubjectErrors.cs` |
| Cas d'usage (handler) | Application | `Subjects/ListSubjectsHandler.cs` |
| Interface de dépôt, DTO, mapping `ToDto()` | Application | `Subjects/ISubjectRepository.cs`, `SubjectMappings.cs` |
| `DbContext`, configuration EF, dépôt | Infrastructure | `Persistence/` |
| Endpoint HTTP, validation d'entrée | Api | groupe `MapGroup("/api/v1/...")` |

## Recette : nouveau cas d'usage exposé en HTTP
1. **Domain** (si besoin) : entité ou règle + tests unitaires dans `ExamSimulator.Domain.Tests`.
2. **Application** : `XxxHandler` (classe `sealed`, dépendances par constructeur, `CancellationToken` partout),
   DTO en `record`, mapping manuel `ToDto()`. Retourne `Result<T>` pour un échec métier attendu.
3. **Infrastructure** : méthode de dépôt (lecture : `AsNoTracking()`, projection, tri déterministe avec un second critère `Id`).
   Les dépôts ne sauvegardent pas : `IUnitOfWork.SaveChangesAsync` est appelé par le handler.
4. **Api** : endpoint dans un groupe par fonctionnalité ; validation FluentValidation ; `Result` en échec → ProblemDetails
   (400 validation, 404 introuvable, 409 conflit) ; enregistrement du handler en DI ; métadonnées OpenAPI.
5. **Tests** : handler (Application.Tests), dépôt sur vraie base (Infrastructure.Tests, Testcontainers),
   endpoint (Api.IntegrationTests, `WebApplicationFactory` en environnement `Testing`).

## Règles qui reviennent en review
- Aucune référence à EF Core ou Npgsql hors Infrastructure (test d'architecture).
- Pas de `!` sans commentaire ; pas de `DateTime.Now` (`TimeProvider`) ; pas d'exception pour un cas métier attendu.
- Pagination : `page >= 1`, `1 <= pageSize <= 100`, total renvoyé. Validée à l'entrée de l'API.
- Endpoint anonyme : `AllowAnonymous` explicite et justifié dans la PR ; jamais de donnée sensible.
- Ne jamais renvoyer une entité du Domain dans une réponse HTTP.
- Ne jamais renvoyer les bonnes réponses d'une question avant soumission.

## Vérifications avant PR
`dotnet build backend` (0 avertissement) puis `dotnet test backend` (Docker nécessaire pour Testcontainers ;
le service est disponible sur le runner, ne lance pas la commande `docker`).
