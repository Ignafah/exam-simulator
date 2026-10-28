using ExamSimulator.Application.Abstractions;
using ExamSimulator.Application.Subjects;
using ExamSimulator.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace ExamSimulator.Infrastructure;

public static class DependencyInjection
{
    public const string ConnectionStringName = "Default";

    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString(ConnectionStringName);
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException(
                $"La chaîne de connexion 'ConnectionStrings:{ConnectionStringName}' est absente. "
                + "Configure-la avec dotnet user-secrets ou la variable d'environnement ConnectionStrings__Default.");
        }

        return services.AddPersistence(connectionString);
    }

    public static IServiceCollection AddPersistence(this IServiceCollection services, string connectionString)
    {
        services.AddDbContext<ExamSimulatorDbContext>(options =>
            options.UseNpgsql(connectionString).UseSnakeCaseNamingConvention());
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ExamSimulatorDbContext>());
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<ISubjectRepository, SubjectRepository>();

        return services;
    }
}
