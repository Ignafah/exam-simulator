using ExamSimulator.Application.Abstractions;
using ExamSimulator.Application.Subjects;
using ExamSimulator.Domain.Subjects;
using ExamSimulator.Infrastructure.Persistence;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;

namespace ExamSimulator.Api.IntegrationTests;

// Une API démarrée sur une base vierge (migrations appliquées) pour que les tests restent indépendants.
public sealed class ApiFactory : WebApplicationFactory<Program>
{
    private readonly string _connectionString;
    private readonly Dictionary<string, string?> _settings;

    public ApiFactory(string serverConnectionString, Dictionary<string, string?>? settings = null)
    {
        _connectionString = new NpgsqlConnectionStringBuilder(serverConnectionString)
        {
            Database = $"test_{Guid.NewGuid():N}",
        }.ConnectionString;
        _settings = settings ?? [];
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");
        builder.UseSetting("ConnectionStrings:Default", _connectionString);
        foreach (var (key, value) in _settings)
        {
            builder.UseSetting(key, value);
        }
    }

    public async Task MigrateAsync()
    {
        await using var scope = Services.CreateAsyncScope();
        var context = scope.ServiceProvider.GetRequiredService<ExamSimulatorDbContext>();
        await context.Database.MigrateAsync();
    }

    public async Task SeedSubjectsAsync(string categoryName, params string[] subjectNames)
    {
        await using var scope = Services.CreateAsyncScope();
        var category = Category.Create(categoryName).Value;
        await scope.ServiceProvider.GetRequiredService<ICategoryRepository>()
            .AddAsync(category, CancellationToken.None);
        var subjects = scope.ServiceProvider.GetRequiredService<ISubjectRepository>();
        foreach (var name in subjectNames)
        {
            await subjects.AddAsync(Subject.Create(name, null, category.Id).Value, CancellationToken.None);
        }

        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync(CancellationToken.None);
    }
}
