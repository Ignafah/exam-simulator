using ExamSimulator.Application.Abstractions;
using ExamSimulator.Domain.Subjects;
using Microsoft.EntityFrameworkCore;

namespace ExamSimulator.Infrastructure.Persistence;

public sealed class ExamSimulatorDbContext(DbContextOptions<ExamSimulatorDbContext> options)
    : DbContext(options), IUnitOfWork
{
    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Subject> Subjects => Set<Subject>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ExamSimulatorDbContext).Assembly);
}
