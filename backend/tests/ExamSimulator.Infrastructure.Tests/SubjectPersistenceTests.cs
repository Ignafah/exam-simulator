using ExamSimulator.Application.Abstractions;
using ExamSimulator.Application.Subjects;
using ExamSimulator.Domain.Subjects;
using ExamSimulator.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ExamSimulator.Infrastructure.Tests;

[Collection(PostgreSqlCollection.Name)]
public sealed class SubjectPersistenceTests(PostgreSqlFixture postgres) : IAsyncLifetime
{
    private TestDatabase _database = null!; // Affecté par InitializeAsync avant chaque test.

    public async Task InitializeAsync() => _database = await TestDatabase.CreateAsync(postgres.ConnectionString);

    public Task DisposeAsync() => _database.DisposeAsync().AsTask();

    [Fact]
    public async Task Category_saved_is_read_back_with_same_id_and_name()
    {
        var category = Category.Create("Catégorie fictive").Value;
        await SaveAsync(category);

        await using var scope = _database.NewScope();
        var loaded = await scope.ServiceProvider.GetRequiredService<ICategoryRepository>()
            .GetByIdAsync(category.Id, CancellationToken.None);

        loaded.ShouldNotBeNull();
        loaded.Id.ShouldBe(category.Id);
        loaded.Name.ShouldBe("Catégorie fictive");
    }

    [Fact]
    public async Task Subject_saved_is_read_back_with_same_values()
    {
        var category = Category.Create("Catégorie fictive").Value;
        await SaveAsync(category);
        var subject = Subject.Create("Sujet de test", "Description fictive", category.Id).Value;
        await SaveAsync(subject);

        await using var scope = _database.NewScope();
        var loaded = await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .GetByIdAsync(subject.Id, CancellationToken.None);

        loaded.ShouldNotBeNull();
        loaded.Id.ShouldBe(subject.Id);
        loaded.Name.ShouldBe("Sujet de test");
        loaded.Description.ShouldBe("Description fictive");
        loaded.CategoryId.ShouldBe(category.Id);
    }

    [Fact]
    public async Task Subject_without_description_is_read_back_with_null_description()
    {
        var category = Category.Create("Catégorie fictive").Value;
        await SaveAsync(category);
        var subject = Subject.Create("Sujet de test", null, category.Id).Value;
        await SaveAsync(subject);

        await using var scope = _database.NewScope();
        var loaded = await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .GetByIdAsync(subject.Id, CancellationToken.None);

        loaded.ShouldNotBeNull();
        loaded.Description.ShouldBeNull();
    }

    [Fact]
    public async Task Subject_with_unknown_category_is_rejected_by_database()
    {
        var subject = Subject.Create("Sujet de test", null, Guid.NewGuid()).Value;

        await Should.ThrowAsync<DbUpdateException>(() => SaveAsync(subject));
    }

    [Fact]
    public async Task Category_with_subjects_cannot_be_deleted()
    {
        var category = Category.Create("Catégorie fictive").Value;
        await SaveAsync(category);
        await SaveAsync(Subject.Create("Sujet de test", null, category.Id).Value);

        await using var scope = _database.NewScope();
        var context = scope.ServiceProvider.GetRequiredService<ExamSimulatorDbContext>();
        context.Categories.Remove(category);

        await Should.ThrowAsync<DbUpdateException>(() => context.SaveChangesAsync());
    }

    [Fact]
    public async Task Values_at_domain_max_length_are_stored_in_full()
    {
        var categoryName = new string('c', Category.NameMaxLength);
        var subjectName = new string('s', Subject.NameMaxLength);
        var description = new string('d', Subject.DescriptionMaxLength);
        var category = Category.Create(categoryName).Value;
        await SaveAsync(category);
        var subject = Subject.Create(subjectName, description, category.Id).Value;
        await SaveAsync(subject);

        await using var scope = _database.NewScope();
        var loadedCategory = await scope.ServiceProvider.GetRequiredService<ICategoryRepository>()
            .GetByIdAsync(category.Id, CancellationToken.None);
        var loadedSubject = await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .GetByIdAsync(subject.Id, CancellationToken.None);

        loadedCategory.ShouldNotBeNull().Name.ShouldBe(categoryName);
        loadedSubject.ShouldNotBeNull().Name.ShouldBe(subjectName);
        loadedSubject.Description.ShouldBe(description);
    }

    [Fact]
    public async Task Lists_return_all_saved_categories_and_subjects()
    {
        var first = Category.Create("Première catégorie").Value;
        var second = Category.Create("Seconde catégorie").Value;
        await SaveAsync(first);
        await SaveAsync(second);
        var subjectA = Subject.Create("Sujet A", null, first.Id).Value;
        var subjectB = Subject.Create("Sujet B", "Description fictive", second.Id).Value;
        await SaveAsync(subjectA);
        await SaveAsync(subjectB);

        await using var scope = _database.NewScope();
        var categories = await scope.ServiceProvider.GetRequiredService<ICategoryRepository>()
            .ListAsync(CancellationToken.None);
        var subjects = await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .ListAsync(CancellationToken.None);

        categories.Select(c => c.Id).ShouldBe([first.Id, second.Id]);
        subjects.Select(s => s.Id).ShouldBe([subjectA.Id, subjectB.Id]);
    }

    [Fact]
    public async Task Unknown_id_returns_null_without_exception()
    {
        await using var scope = _database.NewScope();

        var category = await scope.ServiceProvider.GetRequiredService<ICategoryRepository>()
            .GetByIdAsync(Guid.NewGuid(), CancellationToken.None);
        var subject = await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .GetByIdAsync(Guid.NewGuid(), CancellationToken.None);

        category.ShouldBeNull();
        subject.ShouldBeNull();
    }

    private async Task SaveAsync(Category category)
    {
        await using var scope = _database.NewScope();
        await scope.ServiceProvider.GetRequiredService<ICategoryRepository>()
            .AddAsync(category, CancellationToken.None);
        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync(CancellationToken.None);
    }

    private async Task SaveAsync(Subject subject)
    {
        await using var scope = _database.NewScope();
        await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .AddAsync(subject, CancellationToken.None);
        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync(CancellationToken.None);
    }
}
