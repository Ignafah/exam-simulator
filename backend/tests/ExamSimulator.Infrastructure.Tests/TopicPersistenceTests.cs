using ExamSimulator.Application.Abstractions;
using ExamSimulator.Application.Subjects;
using ExamSimulator.Domain.Subjects;
using ExamSimulator.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ExamSimulator.Infrastructure.Tests;

[Collection(PostgreSqlCollection.Name)]
public sealed class TopicPersistenceTests(PostgreSqlFixture postgres) : IAsyncLifetime
{
    private TestDatabase _database = null!; // Affecté par InitializeAsync avant chaque test.

    public async Task InitializeAsync() => _database = await TestDatabase.CreateAsync(postgres.ConnectionString);

    public Task DisposeAsync() => _database.DisposeAsync().AsTask();

    [Fact]
    public async Task Topic_saved_is_read_back_with_same_values()
    {
        var subject = await SaveSubjectAsync("Sujet de test");
        var topic = Topic.Create("Thème de test", 27.5m, subject.Id).Value;
        await SaveAsync(topic);

        var loaded = await GetAsync(topic.Id);

        loaded.ShouldNotBeNull();
        loaded.Id.ShouldBe(topic.Id);
        loaded.Name.ShouldBe("Thème de test");
        loaded.Weight.ShouldBe(27.5m);
        loaded.SubjectId.ShouldBe(subject.Id);
    }

    [Fact]
    public async Task Name_at_max_length_is_stored_in_full()
    {
        var subject = await SaveSubjectAsync("Sujet de test");
        var name = new string('t', Topic.NameMaxLength);
        var topic = Topic.Create(name, 10m, subject.Id).Value;
        await SaveAsync(topic);

        var loaded = await GetAsync(topic.Id);

        loaded.ShouldNotBeNull().Name.ShouldBe(name);
        loaded.Name.Length.ShouldBe(100);
    }

    [Fact]
    public async Task Min_and_max_weights_are_stored_exactly()
    {
        var subject = await SaveSubjectAsync("Sujet de test");
        var min = Topic.Create("Thème minimal", Topic.MinWeight, subject.Id).Value;
        var max = Topic.Create("Thème maximal", Topic.MaxWeight, subject.Id).Value;
        await SaveAsync(min);
        await SaveAsync(max);

        (await GetAsync(min.Id)).ShouldNotBeNull().Weight.ShouldBe(0m);
        (await GetAsync(max.Id)).ShouldNotBeNull().Weight.ShouldBe(100m);
    }

    [Fact]
    public async Task Topic_with_unknown_subject_is_rejected_by_database()
    {
        var topic = Topic.Create("Thème de test", 10m, Guid.NewGuid()).Value;

        await Should.ThrowAsync<DbUpdateException>(() => SaveAsync(topic));
    }

    [Fact]
    public async Task Subject_with_topics_cannot_be_deleted()
    {
        var subject = await SaveSubjectAsync("Sujet de test");
        var topic = Topic.Create("Thème de test", 10m, subject.Id).Value;
        await SaveAsync(topic);

        await using (var scope = _database.NewScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ExamSimulatorDbContext>();
            context.Subjects.Remove(subject);

            await Should.ThrowAsync<DbUpdateException>(() => context.SaveChangesAsync());
        }

        (await GetAsync(topic.Id)).ShouldNotBeNull();
    }

    [Fact]
    public async Task Unknown_id_returns_null_without_exception()
    {
        var loaded = await GetAsync(Guid.NewGuid());

        loaded.ShouldBeNull();
    }

    [Fact]
    public async Task Repository_does_not_save_without_unit_of_work()
    {
        var subject = await SaveSubjectAsync("Sujet de test");
        var topic = Topic.Create("Thème de test", 10m, subject.Id).Value;

        await using (var scope = _database.NewScope())
        {
            await scope.ServiceProvider.GetRequiredService<ITopicRepository>()
                .AddAsync(topic, CancellationToken.None);
        }

        (await GetAsync(topic.Id)).ShouldBeNull();
    }

    [Fact]
    public async Task Name_must_be_unique_within_a_subject_but_not_across_subjects()
    {
        var first = await SaveSubjectAsync("Sujet S1");
        var second = await SaveSubjectAsync("Sujet S2");
        await SaveAsync(Topic.Create("Thème A", 10m, first.Id).Value);

        await Should.ThrowAsync<DbUpdateException>(
            () => SaveAsync(Topic.Create("Thème A", 20m, first.Id).Value));

        var otherSubjectTopic = Topic.Create("Thème A", 20m, second.Id).Value;
        await SaveAsync(otherSubjectTopic);
        (await GetAsync(otherSubjectTopic.Id)).ShouldNotBeNull();
    }

    private async Task<Topic?> GetAsync(Guid id)
    {
        await using var scope = _database.NewScope();
        return await scope.ServiceProvider.GetRequiredService<ITopicRepository>()
            .GetByIdAsync(id, CancellationToken.None);
    }

    private async Task<Subject> SaveSubjectAsync(string name)
    {
        await using var scope = _database.NewScope();
        var category = Category.Create("Catégorie fictive").Value;
        await scope.ServiceProvider.GetRequiredService<ICategoryRepository>()
            .AddAsync(category, CancellationToken.None);
        var subject = Subject.Create(name, null, category.Id).Value;
        await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .AddAsync(subject, CancellationToken.None);
        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync(CancellationToken.None);
        return subject;
    }

    private async Task SaveAsync(Topic topic)
    {
        await using var scope = _database.NewScope();
        await scope.ServiceProvider.GetRequiredService<ITopicRepository>()
            .AddAsync(topic, CancellationToken.None);
        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync(CancellationToken.None);
    }
}
