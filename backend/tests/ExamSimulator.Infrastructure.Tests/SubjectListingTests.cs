using ExamSimulator.Application.Abstractions;
using ExamSimulator.Application.Subjects;
using ExamSimulator.Domain.Subjects;
using Microsoft.Extensions.DependencyInjection;

namespace ExamSimulator.Infrastructure.Tests;

[Collection(PostgreSqlCollection.Name)]
public sealed class SubjectListingTests(PostgreSqlFixture postgres) : IAsyncLifetime
{
    private TestDatabase _database = null!; // Affecté par InitializeAsync avant chaque test.

    public async Task InitializeAsync() => _database = await TestDatabase.CreateAsync(postgres.ConnectionString);

    public Task DisposeAsync() => _database.DisposeAsync().AsTask();

    [Fact]
    public async Task Three_subjects_are_listed_with_id_name_and_category_name()
    {
        var category = await SaveCategoryAsync("Catégorie fictive");
        var saved = new List<Subject>();
        foreach (var name in new[] { "Sujet 1", "Sujet 2", "Sujet 3" })
        {
            saved.Add(await SaveSubjectAsync(name, category.Id));
        }

        var result = await ListAsync(1, 20);

        result.Items.Count.ShouldBe(3);
        result.Items.Select(i => i.Subject.Id).ShouldBe(saved.Select(s => s.Id));
        result.Items.Select(i => i.Subject.Name).ShouldBe(["Sujet 1", "Sujet 2", "Sujet 3"]);
        result.Items.ShouldAllBe(i => i.CategoryName == "Catégorie fictive");
    }

    [Fact]
    public async Task Subjects_are_ordered_by_name_ignoring_case()
    {
        var category = await SaveCategoryAsync("Catégorie fictive");
        await SaveSubjectAsync("B", category.Id);
        await SaveSubjectAsync("a", category.Id);
        await SaveSubjectAsync("C", category.Id);

        var result = await ListAsync(1, 20);

        result.Items.Select(i => i.Subject.Name).ShouldBe(["a", "B", "C"]);
    }

    [Fact]
    public async Task Subjects_with_same_name_are_ordered_by_id()
    {
        var category = await SaveCategoryAsync("Catégorie fictive");
        var first = await SaveSubjectAsync("Même nom", category.Id);
        var second = await SaveSubjectAsync("Même nom", category.Id);

        var result = await ListAsync(1, 20);

        result.Items.Select(i => i.Subject.Id).ShouldBe(new[] { first.Id, second.Id }.Order());
    }

    [Fact]
    public async Task Pagination_returns_twenty_then_five_items_of_twenty_five_with_total()
    {
        var category = await SaveCategoryAsync("Catégorie fictive");
        for (var i = 1; i <= 25; i++)
        {
            await SaveSubjectAsync($"Sujet {i:00}", category.Id);
        }

        var firstPage = await ListAsync(1, 20);
        var secondPage = await ListAsync(2, 20);

        firstPage.Items.Count.ShouldBe(20);
        firstPage.TotalCount.ShouldBe(25);
        firstPage.Page.ShouldBe(1);
        firstPage.PageSize.ShouldBe(20);
        secondPage.Items.Count.ShouldBe(5);
        secondPage.TotalCount.ShouldBe(25);
        secondPage.Items.Select(i => i.Subject.Name).ShouldBe(
            ["Sujet 21", "Sujet 22", "Sujet 23", "Sujet 24", "Sujet 25"]);
    }

    [Fact]
    public async Task Page_beyond_the_end_is_empty_but_keeps_total()
    {
        var category = await SaveCategoryAsync("Catégorie fictive");
        await SaveSubjectAsync("Sujet", category.Id);

        var result = await ListAsync(3, 20);

        result.Items.ShouldBeEmpty();
        result.TotalCount.ShouldBe(1);
    }

    [Fact]
    public async Task No_subject_gives_empty_list_and_zero_total()
    {
        var result = await ListAsync(1, 20);

        result.Items.ShouldBeEmpty();
        result.TotalCount.ShouldBe(0);
    }

    [Fact]
    public async Task Handler_returns_dtos_from_the_real_database()
    {
        var category = await SaveCategoryAsync("Catégorie fictive");
        var subject = await SaveSubjectAsync("Sujet", category.Id);

        await using var scope = _database.NewScope();
        var handler = new ListSubjectsHandler(scope.ServiceProvider.GetRequiredService<ISubjectRepository>());
        var result = await handler.HandleAsync(1, 20, CancellationToken.None);

        result.Items.ShouldBe([new SubjectSummaryDto(subject.Id, "Sujet", "Catégorie fictive")]);
    }

    private async Task<PagedResult<SubjectWithCategory>> ListAsync(int page, int pageSize)
    {
        await using var scope = _database.NewScope();
        return await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .ListPageAsync(page, pageSize, CancellationToken.None);
    }

    private async Task<Category> SaveCategoryAsync(string name)
    {
        var category = Category.Create(name).Value;
        await using var scope = _database.NewScope();
        await scope.ServiceProvider.GetRequiredService<ICategoryRepository>()
            .AddAsync(category, CancellationToken.None);
        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync(CancellationToken.None);
        return category;
    }

    private async Task<Subject> SaveSubjectAsync(string name, Guid categoryId)
    {
        var subject = Subject.Create(name, null, categoryId).Value;
        await using var scope = _database.NewScope();
        await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .AddAsync(subject, CancellationToken.None);
        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync(CancellationToken.None);
        return subject;
    }
}
