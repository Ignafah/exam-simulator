using ExamSimulator.Domain.Questions;

namespace ExamSimulator.Domain.Tests.Questions;

public sealed class QuestionTests
{
    private static readonly Guid TopicId = Guid.NewGuid();

    private static List<Choice> TwoChoices() =>
    [
        Choice.Create("A", true).Value,
        Choice.Create("B", false).Value,
    ];

    [Fact]
    public void Create_WithValidValues_Succeeds()
    {
        var choices = TwoChoices();

        var result = Question.Create("  Énoncé ", QuestionType.SingleChoice, " Explication ", " Rédaction originale ", TopicId, choices);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldNotBe(Guid.Empty);
        result.Value.Id.Version.ShouldBe(7);
        result.Value.Text.ShouldBe("Énoncé");
        result.Value.Type.ShouldBe(QuestionType.SingleChoice);
        result.Value.Explanation.ShouldBe("Explication");
        result.Value.Source.ShouldBe("Rédaction originale");
        result.Value.TopicId.ShouldBe(TopicId);
        result.Value.Choices.ShouldBe(choices);
    }

    [Theory]
    [InlineData(QuestionType.SingleChoice)]
    [InlineData(QuestionType.MultipleChoice)]
    [InlineData(QuestionType.TrueFalse)]
    public void Create_AcceptsEveryQuestionType(QuestionType type)
    {
        Question.Create("Énoncé", type, "Explication", "Source", TopicId, TwoChoices()).IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_WithUndefinedType_FailsWithTypeInvalid()
    {
        Question.Create("Énoncé", (QuestionType)99, "Explication", "Source", TopicId, TwoChoices())
            .Error.ShouldBe(QuestionErrors.TypeInvalid);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankText_FailsWithTextRequired(string? text)
    {
        Question.Create(text, QuestionType.SingleChoice, "Explication", "Source", TopicId, TwoChoices())
            .Error.ShouldBe(QuestionErrors.TextRequired);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankExplanation_FailsWithExplanationRequired(string? explanation)
    {
        Question.Create("Énoncé", QuestionType.SingleChoice, explanation, "Source", TopicId, TwoChoices())
            .Error.ShouldBe(QuestionErrors.ExplanationRequired);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankSource_FailsWithSourceRequired(string? source)
    {
        Question.Create("Énoncé", QuestionType.SingleChoice, "Explication", source, TopicId, TwoChoices())
            .Error.ShouldBe(QuestionErrors.SourceRequired);
    }

    [Fact]
    public void Create_WithFieldsOfMaxLength_Succeeds()
    {
        var result = Question.Create(
            new string('a', Question.TextMaxLength),
            QuestionType.SingleChoice,
            new string('b', Question.ExplanationMaxLength),
            new string('c', Question.SourceMaxLength),
            TopicId,
            TwoChoices());

        result.IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_WithTextTooLong_FailsWithTextTooLong()
    {
        Question.Create(new string('a', Question.TextMaxLength + 1), QuestionType.SingleChoice, "Explication", "Source", TopicId, TwoChoices())
            .Error.ShouldBe(QuestionErrors.TextTooLong);
    }

    [Fact]
    public void Create_WithExplanationTooLong_FailsWithExplanationTooLong()
    {
        Question.Create("Énoncé", QuestionType.SingleChoice, new string('a', Question.ExplanationMaxLength + 1), "Source", TopicId, TwoChoices())
            .Error.ShouldBe(QuestionErrors.ExplanationTooLong);
    }

    [Fact]
    public void Create_WithSourceTooLong_FailsWithSourceTooLong()
    {
        Question.Create("Énoncé", QuestionType.SingleChoice, "Explication", new string('a', Question.SourceMaxLength + 1), TopicId, TwoChoices())
            .Error.ShouldBe(QuestionErrors.SourceTooLong);
    }

    [Fact]
    public void Create_WithEmptyTopicId_FailsWithTopicRequired()
    {
        Question.Create("Énoncé", QuestionType.SingleChoice, "Explication", "Source", Guid.Empty, TwoChoices())
            .Error.ShouldBe(QuestionErrors.TopicRequired);
    }

    [Fact]
    public void Create_WithNullChoices_FailsWithNotEnoughChoices()
    {
        Question.Create("Énoncé", QuestionType.SingleChoice, "Explication", "Source", TopicId, null)
            .Error.ShouldBe(QuestionErrors.NotEnoughChoices);
    }

    [Fact]
    public void Create_WithNoChoice_FailsWithNotEnoughChoices()
    {
        Question.Create("Énoncé", QuestionType.SingleChoice, "Explication", "Source", TopicId, [])
            .Error.ShouldBe(QuestionErrors.NotEnoughChoices);
    }

    [Fact]
    public void Create_WithOneChoice_FailsWithNotEnoughChoices()
    {
        var result = Question.Create("Énoncé", QuestionType.SingleChoice, "Explication", "Source", TopicId, [Choice.Create("A", true).Value]);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(QuestionErrors.NotEnoughChoices);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Question.NotEnoughChoices");
    }

    [Fact]
    public void Create_ValidatesFieldsInOrder()
    {
        Question.Create("", (QuestionType)99, "", "", Guid.Empty, null).Error.ShouldBe(QuestionErrors.TextRequired);
        Question.Create("Énoncé", (QuestionType)99, "", "", Guid.Empty, null).Error.ShouldBe(QuestionErrors.TypeInvalid);
        Question.Create("Énoncé", QuestionType.SingleChoice, "", "", Guid.Empty, null).Error.ShouldBe(QuestionErrors.ExplanationRequired);
        Question.Create("Énoncé", QuestionType.SingleChoice, "Explication", "", Guid.Empty, null).Error.ShouldBe(QuestionErrors.SourceRequired);
        Question.Create("Énoncé", QuestionType.SingleChoice, "Explication", "Source", Guid.Empty, null).Error.ShouldBe(QuestionErrors.TopicRequired);
    }

    private static List<Choice> Choices(int total, int correct) =>
        [.. Enumerable.Range(0, total).Select(i => Choice.Create($"Choix {i}", i < correct).Value)];

    [Theory]
    [InlineData(QuestionType.SingleChoice, 3, 1)]
    [InlineData(QuestionType.TrueFalse, 2, 1)]
    [InlineData(QuestionType.MultipleChoice, 4, 2)]
    [InlineData(QuestionType.MultipleChoice, 4, 1)]
    [InlineData(QuestionType.MultipleChoice, 3, 3)]
    public void Create_WithValidCorrectChoiceCount_Succeeds(QuestionType type, int total, int correct)
    {
        Question.Create("Énoncé", type, "Explication", "Source", TopicId, Choices(total, correct)).IsSuccess.ShouldBeTrue();
    }

    [Theory]
    [InlineData(QuestionType.SingleChoice, 3, 0)]
    [InlineData(QuestionType.SingleChoice, 3, 2)]
    [InlineData(QuestionType.SingleChoice, 2, 2)]
    [InlineData(QuestionType.TrueFalse, 2, 0)]
    [InlineData(QuestionType.TrueFalse, 2, 2)]
    public void Create_WithWrongCorrectChoiceCount_FailsWithExactlyOneCorrectChoiceRequired(QuestionType type, int total, int correct)
    {
        var result = Question.Create("Énoncé", type, "Explication", "Source", TopicId, Choices(total, correct));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(QuestionErrors.ExactlyOneCorrectChoiceRequired);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Question.ExactlyOneCorrectChoiceRequired");
    }

    [Fact]
    public void Create_MultipleChoiceWithoutCorrectChoice_FailsWithAtLeastOneCorrectChoiceRequired()
    {
        var result = Question.Create("Énoncé", QuestionType.MultipleChoice, "Explication", "Source", TopicId, Choices(3, 0));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(QuestionErrors.AtLeastOneCorrectChoiceRequired);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Question.AtLeastOneCorrectChoiceRequired");
    }

    [Fact]
    public void Create_TrueFalseWithThreeChoices_FailsWithTrueFalseRequiresTwoChoices()
    {
        var result = Question.Create("Énoncé", QuestionType.TrueFalse, "Explication", "Source", TopicId, Choices(3, 1));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(QuestionErrors.TrueFalseRequiresTwoChoices);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Question.TrueFalseRequiresTwoChoices");
    }

    [Fact]
    public void Create_ChecksChoiceCountBeforeCorrectChoices()
    {
        Question.Create("Énoncé", QuestionType.SingleChoice, "Explication", "Source", TopicId, Choices(1, 0))
            .Error.ShouldBe(QuestionErrors.NotEnoughChoices);
    }

    [Fact]
    public void Create_WithUndefinedTypeAndNoCorrectChoice_FailsWithTypeInvalid()
    {
        Question.Create("Énoncé", (QuestionType)99, "Explication", "Source", TopicId, Choices(3, 0))
            .Error.ShouldBe(QuestionErrors.TypeInvalid);
    }

    [Fact]
    public void Question_HasNoPublicConstructor()
    {
        typeof(Question).GetConstructors().ShouldBeEmpty();
    }
}
