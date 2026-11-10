using ExamSimulator.Application.Abstractions;
using ExamSimulator.Domain.Questions;
using ExamSimulator.Domain.Subjects;
using Microsoft.EntityFrameworkCore;

namespace ExamSimulator.Infrastructure.Persistence;

public sealed class ExamSimulatorDbContext(DbContextOptions<ExamSimulatorDbContext> options)
    : DbContext(options), IUnitOfWork
{
    public DbSet<Category> Categories => Set<Category>();

    public DbSet<Subject> Subjects => Set<Subject>();

    public DbSet<Topic> Topics => Set<Topic>();

    public DbSet<Question> Questions => Set<Question>();

    public DbSet<Choice> Choices => Set<Choice>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ExamSimulatorDbContext).Assembly);
}
