using ExamSimulator.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ExamSimulator.Infrastructure.Tests;

[Collection(PostgreSqlCollection.Name)]
public sealed class MigrationTests(PostgreSqlFixture postgres)
{
    [Fact]
    public async Task Migrations_apply_on_empty_database_and_match_the_model()
    {
        await using var database = await TestDatabase.CreateAsync(postgres.ConnectionString, migrate: false);
        await using var scope = database.NewScope();
        var context = scope.ServiceProvider.GetRequiredService<ExamSimulatorDbContext>();

        await context.Database.MigrateAsync();

        (await context.Database.GetPendingMigrationsAsync()).ShouldBeEmpty();
        context.Database.HasPendingModelChanges().ShouldBeFalse();
    }
}
