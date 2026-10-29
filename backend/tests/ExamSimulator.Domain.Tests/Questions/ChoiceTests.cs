using ExamSimulator.Domain.Questions;

namespace ExamSimulator.Domain.Tests.Questions;

public sealed class ChoiceTests
{
    [Fact]
    public void Create_WithValidValues_Succeeds()
    {
        var result = Choice.Create("  Réponse A ", true);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldNotBe(Guid.Empty);
        result.Value.Text.ShouldBe("Réponse A");
        result.Value.IsCorrect.ShouldBeTrue();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankText_FailsWithTextRequired(string? text)
    {
        var result = Choice.Create(text, false);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChoiceErrors.TextRequired);
    }

    [Fact]
    public void Create_WithTextOfMaxLength_Succeeds()
    {
        Choice.Create(new string('a', Choice.TextMaxLength), false).IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_WithTextTooLong_FailsWithTextTooLong()
    {
        var result = Choice.Create(new string('a', Choice.TextMaxLength + 1), false);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(ChoiceErrors.TextTooLong);
    }

    [Fact]
    public void Choice_HasNoPublicConstructor()
    {
        typeof(Choice).GetConstructors().ShouldBeEmpty();
    }
}
