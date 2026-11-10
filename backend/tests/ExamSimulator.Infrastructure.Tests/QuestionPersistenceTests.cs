using ExamSimulator.Application.Abstractions;
using ExamSimulator.Application.Questions;
using ExamSimulator.Application.Subjects;
using ExamSimulator.Domain.Questions;
using ExamSimulator.Domain.Subjects;
using ExamSimulator.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace ExamSimulator.Infrastructure.Tests;

[Collection(PostgreSqlCollection.Name)]
public sealed class QuestionPersistenceTests(PostgreSqlFixture postgres) : IAsyncLifetime
{
    private TestDatabase _database = null!; // Affecté par InitializeAsync avant chaque test.

    public async Task InitializeAsync() => _database = await TestDatabase.CreateAsync(postgres.ConnectionString);

    public Task DisposeAsync() => _database.DisposeAsync().AsTask();

    [Fact]
    public async Task Question_saved_is_read_back_with_same_values_and_choices()
    {
        var topic = await SaveTopicAsync();
        var question = NewQuestion(
            topic.Id,
            QuestionType.SingleChoice,
            ("Choix A", true),
            ("Choix B", false),
            ("Choix C", false),
            ("Choix D", false));
        await SaveAsync(question);

        var loaded = await GetAsync(question.Id);

        loaded.ShouldNotBeNull();
        loaded.Id.ShouldBe(question.Id);
        loaded.Text.ShouldBe(question.Text);
        loaded.Type.ShouldBe(QuestionType.SingleChoice);
        loaded.Explanation.ShouldBe(question.Explanation);
        loaded.Source.ShouldBe(question.Source);
        loaded.TopicId.ShouldBe(topic.Id);
        loaded.Choices.Count.ShouldBe(4);
        for (var i = 0; i < 4; i++)
        {
            loaded.Choices[i].Id.ShouldBe(question.Choices[i].Id);
            loaded.Choices[i].Text.ShouldBe(question.Choices[i].Text);
            loaded.Choices[i].IsCorrect.ShouldBe(question.Choices[i].IsCorrect);
        }
    }

    [Fact]
    public async Task Choice_order_is_preserved_on_many_questions()
    {
        var topic = await SaveTopicAsync();
        var questions = new List<Question>();
        for (var i = 0; i < 20; i++)
        {
            var question = NewQuestion(
                topic.Id,
                QuestionType.SingleChoice,
                ("Choix 1", false),
                ("Choix 2", false),
                ("Choix 3", true),
                ("Choix 4", false),
                ("Choix 5", false),
                ("Choix 6", false));
            await SaveAsync(question);
            questions.Add(question);
        }

        foreach (var question in questions)
        {
            var loaded = await GetAsync(question.Id);

            loaded.ShouldNotBeNull();
            loaded.Choices.Select(c => c.Text)
                .ShouldBe(["Choix 1", "Choix 2", "Choix 3", "Choix 4", "Choix 5", "Choix 6"]);
            loaded.Choices.Select(c => c.Id).ShouldBe(question.Choices.Select(c => c.Id));
        }
    }

    [Fact]
    public async Task Each_question_type_is_preserved()
    {
        var topic = await SaveTopicAsync();
        var single = NewQuestion(topic.Id, QuestionType.SingleChoice, ("Choix A", true), ("Choix B", false));
        var multiple = NewQuestion(
            topic.Id,
            QuestionType.MultipleChoice,
            ("Choix A", true),
            ("Choix B", true),
            ("Choix C", false));
        var trueFalse = NewQuestion(topic.Id, QuestionType.TrueFalse, ("Vrai", false), ("Faux", true));
        await SaveAsync(single);
        await SaveAsync(multiple);
        await SaveAsync(trueFalse);

        foreach (var expected in new[] { single, multiple, trueFalse })
        {
            var loaded = await GetAsync(expected.Id);

            loaded.ShouldNotBeNull();
            loaded.Type.ShouldBe(expected.Type);
            loaded.Choices.Where(c => c.IsCorrect).Select(c => c.Id)
                .ShouldBe(expected.Choices.Where(c => c.IsCorrect).Select(c => c.Id));
        }
    }

    [Fact]
    public async Task Check_works_on_a_question_read_from_database()
    {
        var topic = await SaveTopicAsync();
        var multiple = NewQuestion(
            topic.Id,
            QuestionType.MultipleChoice,
            ("Choix A", true),
            ("Choix B", true),
            ("Choix C", false));
        await SaveAsync(multiple);

        var loaded = (await GetAsync(multiple.Id)).ShouldNotBeNull();
        var correctIds = loaded.Choices.Where(c => c.IsCorrect).Select(c => c.Id).ToList();

        loaded.Check(correctIds).Value.ShouldBeTrue();
        loaded.Check([correctIds[0]]).Value.ShouldBeFalse();
    }

    [Fact]
    public async Task Texts_at_max_length_with_accents_and_newlines_are_stored_in_full()
    {
        var topic = await SaveTopicAsync();
        var text = Pad("Énoncé…\nsuite ", Question.TextMaxLength);
        var explanation = Pad("Explication é\nsuite ", Question.ExplanationMaxLength);
        var source = Pad("Source é\nsuite ", Question.SourceMaxLength);
        var choiceText = Pad("Choix é\nsuite ", Choice.TextMaxLength);
        var question = Question.Create(
            text,
            QuestionType.SingleChoice,
            explanation,
            source,
            topic.Id,
            [Choice.Create(choiceText, true).Value, Choice.Create("Choix B", false).Value]).Value;
        await SaveAsync(question);

        var loaded = (await GetAsync(question.Id)).ShouldNotBeNull();

        loaded.Text.ShouldBe(text);
        loaded.Text.Length.ShouldBe(Question.TextMaxLength);
        loaded.Explanation.ShouldBe(explanation);
        loaded.Explanation.Length.ShouldBe(Question.ExplanationMaxLength);
        loaded.Source.ShouldBe(source);
        loaded.Source.Length.ShouldBe(Question.SourceMaxLength);
        loaded.Choices[0].Text.ShouldBe(choiceText);
        loaded.Choices[0].Text.Length.ShouldBe(Choice.TextMaxLength);
    }

    [Fact]
    public async Task Question_with_unknown_topic_is_rejected_and_nothing_is_written()
    {
        var question = NewQuestion(Guid.NewGuid(), QuestionType.SingleChoice, ("Choix A", true), ("Choix B", false));

        await Should.ThrowAsync<DbUpdateException>(() => SaveAsync(question));

        await using var scope = _database.NewScope();
        var context = scope.ServiceProvider.GetRequiredService<ExamSimulatorDbContext>();
        (await context.Questions.CountAsync()).ShouldBe(0);
        (await context.Choices.CountAsync()).ShouldBe(0);
    }

    [Fact]
    public async Task Topic_with_questions_cannot_be_deleted()
    {
        var topic = await SaveTopicAsync();
        var question = NewQuestion(topic.Id, QuestionType.SingleChoice, ("Choix A", true), ("Choix B", false));
        await SaveAsync(question);

        await using (var scope = _database.NewScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ExamSimulatorDbContext>();
            context.Topics.Remove(topic);

            await Should.ThrowAsync<DbUpdateException>(() => context.SaveChangesAsync());
        }

        (await GetAsync(question.Id)).ShouldNotBeNull();
    }

    [Fact]
    public async Task Question_with_choices_cannot_be_deleted_alone()
    {
        var topic = await SaveTopicAsync();
        var question = NewQuestion(topic.Id, QuestionType.SingleChoice, ("Choix A", true), ("Choix B", false));
        await SaveAsync(question);

        await using (var scope = _database.NewScope())
        {
            var context = scope.ServiceProvider.GetRequiredService<ExamSimulatorDbContext>();
            // Charge la question sans ses choix : seule la ligne questions est supprimée.
            var tracked = await context.Questions.SingleAsync(q => q.Id == question.Id);
            context.Questions.Remove(tracked);

            await Should.ThrowAsync<DbUpdateException>(() => context.SaveChangesAsync());
        }

        var loaded = (await GetAsync(question.Id)).ShouldNotBeNull();
        loaded.Choices.Count.ShouldBe(2);
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
        var topic = await SaveTopicAsync();
        var question = NewQuestion(topic.Id, QuestionType.SingleChoice, ("Choix A", true), ("Choix B", false));

        await using (var scope = _database.NewScope())
        {
            await scope.ServiceProvider.GetRequiredService<IQuestionRepository>()
                .AddAsync(question, CancellationToken.None);
        }

        (await GetAsync(question.Id)).ShouldBeNull();
    }

    private static string Pad(string prefix, int length) =>
        (prefix + new string('x', length))[..length];

    private static Question NewQuestion(Guid topicId, QuestionType type, params (string Text, bool IsCorrect)[] choices) =>
        Question.Create(
            "Question de test",
            type,
            "Explication de test",
            "Rédaction originale",
            topicId,
            choices.Select(c => Choice.Create(c.Text, c.IsCorrect).Value).ToList()).Value;

    private async Task<Question?> GetAsync(Guid id)
    {
        await using var scope = _database.NewScope();
        return await scope.ServiceProvider.GetRequiredService<IQuestionRepository>()
            .GetByIdAsync(id, CancellationToken.None);
    }

    private async Task<Topic> SaveTopicAsync()
    {
        await using var scope = _database.NewScope();
        var category = Category.Create("Catégorie fictive").Value;
        await scope.ServiceProvider.GetRequiredService<ICategoryRepository>()
            .AddAsync(category, CancellationToken.None);
        var subject = Subject.Create("Sujet de test", null, category.Id).Value;
        await scope.ServiceProvider.GetRequiredService<ISubjectRepository>()
            .AddAsync(subject, CancellationToken.None);
        var topic = Topic.Create("Thème de test", 10m, subject.Id).Value;
        await scope.ServiceProvider.GetRequiredService<ITopicRepository>()
            .AddAsync(topic, CancellationToken.None);
        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync(CancellationToken.None);
        return topic;
    }

    private async Task SaveAsync(Question question)
    {
        await using var scope = _database.NewScope();
        await scope.ServiceProvider.GetRequiredService<IQuestionRepository>()
            .AddAsync(question, CancellationToken.None);
        await scope.ServiceProvider.GetRequiredService<IUnitOfWork>().SaveChangesAsync(CancellationToken.None);
    }
}
