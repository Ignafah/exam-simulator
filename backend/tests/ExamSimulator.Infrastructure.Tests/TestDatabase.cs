using ExamSimulator.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace ExamSimulator.Infrastructure.Tests;

// Une base vierge par test (migrations appliquées) pour que les tests restent indépendants.
public sealed class TestDatabase : IAsyncDisposable
{
    private readonly ServiceProvider _provider;

    private TestDatabase(ServiceProvider provider)
    {
        _provider = provider;
    }

    public static async Task<TestDatabase> CreateAsync(string serverConnectionString, bool migrate = true)
    {
        var connectionString = new NpgsqlConnectionStringBuilder(serverConnectionString)
        {
            Database = $"test_{Guid.NewGuid():N}",
        }.ConnectionString;

        var provider = new ServiceCollection()
            .AddPersistence(connectionString)
            .BuildServiceProvider();

        if (migrate)
        {
            await using var scope = provider.CreateAsyncScope();
            var context = scope.ServiceProvider.GetRequiredService<ExamSimulatorDbContext>();
            await context.Database.MigrateAsync();
        }

        return new TestDatabase(provider);
    }

    // Chaque appel renvoie un scope neuf, donc un DbContext neuf (sans cache de suivi des entités).
    public AsyncServiceScope NewScope() => _provider.CreateAsyncScope();

    public ValueTask DisposeAsync() => _provider.DisposeAsync();
}
