using ExamSimulator.Domain.Common;
using ExamSimulator.Domain.Questions;

namespace ExamSimulator.Domain.Tests.Questions;

public sealed class QuestionCheckTests
{
    private static readonly Guid TopicId = Guid.NewGuid();

    private static Choice NewChoice(string text, bool isCorrect) => Choice.Create(text, isCorrect).Value;

    private static Question NewQuestion(QuestionType type, params Choice[] choices) =>
        Question.Create("Énoncé", type, "Explication", "Rédaction originale", TopicId, choices).Value;

    private static (Question Question, Choice A, Choice B, Choice C) SingleChoiceQuestion()
    {
        var a = NewChoice("A", true);
        var b = NewChoice("B", false);
        var c = NewChoice("C", false);
        return (NewQuestion(QuestionType.SingleChoice, a, b, c), a, b, c);
    }

    private static (Question Question, Choice A, Choice B, Choice C, Choice D) MultipleChoiceQuestion()
    {
        var a = NewChoice("A", true);
        var b = NewChoice("B", true);
        var c = NewChoice("C", false);
        var d = NewChoice("D", false);
        return (NewQuestion(QuestionType.MultipleChoice, a, b, c, d), a, b, c, d);
    }

    private static (Question Question, Choice A, Choice B) TrueFalseQuestion()
    {
        var a = NewChoice("Vrai", true);
        var b = NewChoice("Faux", false);
        return (NewQuestion(QuestionType.TrueFalse, a, b), a, b);
    }

    private static void ShouldBeChecked(Result<bool> result, bool expected)
    {
        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(expected);
    }

    [Fact]
    public void Check_SingleChoice_WithCorrectChoice_ReturnsTrue()
    {
        var (question, a, _, _) = SingleChoiceQuestion();

        ShouldBeChecked(question.Check([a.Id]), true);
    }

    [Fact]
    public void Check_SingleChoice_WithWrongChoice_ReturnsFalse()
    {
        var (question, _, b, _) = SingleChoiceQuestion();

        ShouldBeChecked(question.Check([b.Id]), false);
    }

    [Fact]
    public void Check_SingleChoice_WithExtraChoice_ReturnsFalse()
    {
        var (question, a, b, _) = SingleChoiceQuestion();

        ShouldBeChecked(question.Check([a.Id, b.Id]), false);
    }

    [Fact]
    public void Check_TrueFalse_WithCorrectChoice_ReturnsTrue()
    {
        var (question, a, _) = TrueFalseQuestion();

        ShouldBeChecked(question.Check([a.Id]), true);
    }

    [Fact]
    public void Check_TrueFalse_WithWrongChoice_ReturnsFalse()
    {
        var (question, _, b) = TrueFalseQuestion();

        ShouldBeChecked(question.Check([b.Id]), false);
    }

    [Fact]
    public void Check_MultipleChoice_WithAllCorrectChoices_ReturnsTrue()
    {
        var (question, a, b, _, _) = MultipleChoiceQuestion();

        ShouldBeChecked(question.Check([a.Id, b.Id]), true);
    }

    [Fact]
    public void Check_MultipleChoice_IgnoresOrder()
    {
        var (question, a, b, _, _) = MultipleChoiceQuestion();

        ShouldBeChecked(question.Check([b.Id, a.Id]), true);
    }

    [Fact]
    public void Check_MultipleChoice_WithPartialSelection_ReturnsFalse()
    {
        var (question, a, _, _, _) = MultipleChoiceQuestion();

        ShouldBeChecked(question.Check([a.Id]), false);
    }

    [Fact]
    public void Check_MultipleChoice_WithExtraChoice_ReturnsFalse()
    {
        var (question, a, b, c, _) = MultipleChoiceQuestion();

        ShouldBeChecked(question.Check([a.Id, b.Id, c.Id]), false);
    }

    [Fact]
    public void Check_MultipleChoice_WithOnlyWrongChoices_ReturnsFalse()
    {
        var (question, _, _, c, d) = MultipleChoiceQuestion();

        ShouldBeChecked(question.Check([c.Id, d.Id]), false);
    }

    [Fact]
    public void Check_WithUnknownId_FailsWithUnknownChoice()
    {
        var (question, a, _, _) = SingleChoiceQuestion();

        question.Check([a.Id, Guid.NewGuid()]).Error.ShouldBe(QuestionErrors.UnknownChoice);
    }

    [Fact]
    public void Check_WithChoiceOfAnotherQuestion_FailsWithUnknownChoice()
    {
        var (question, a, _, _) = SingleChoiceQuestion();
        var (_, otherA, _, _) = SingleChoiceQuestion();

        question.Check([a.Id, otherA.Id]).Error.ShouldBe(QuestionErrors.UnknownChoice);
    }

    [Fact]
    public void Check_WithEmptySelection_FailsWithNoChoiceSelected()
    {
        var (question, _, _, _) = SingleChoiceQuestion();

        question.Check([]).Error.ShouldBe(QuestionErrors.NoChoiceSelected);
    }

    [Fact]
    public void Check_WithNullSelection_FailsWithNoChoiceSelected()
    {
        var (question, _, _, _) = SingleChoiceQuestion();

        question.Check(null).Error.ShouldBe(QuestionErrors.NoChoiceSelected);
    }

    [Fact]
    public void Check_WithDuplicatedIds_IgnoresDuplicates()
    {
        var (question, a, _, _) = SingleChoiceQuestion();

        ShouldBeChecked(question.Check([a.Id, a.Id]), true);
    }

    [Fact]
    public void Check_DoesNotModifyQuestion_AndIsDeterministic()
    {
        var (question, a, b, c, d) = MultipleChoiceQuestion();
        var choicesBefore = question.Choices.ToList();
        var correctnessBefore = question.Choices.Select(choice => choice.IsCorrect).ToList();

        var first = question.Check([a.Id, b.Id]);
        var second = question.Check([a.Id, b.Id]);

        question.Choices.ShouldBe(choicesBefore);
        question.Choices.Select(choice => choice.IsCorrect).ShouldBe(correctnessBefore);
        question.Choices.Select(choice => choice.Id).ShouldBe([a.Id, b.Id, c.Id, d.Id]);
        ShouldBeChecked(first, true);
        ShouldBeChecked(second, true);
    }
}
