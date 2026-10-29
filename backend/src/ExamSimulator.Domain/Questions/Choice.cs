using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Questions;

public sealed class Choice
{
    public const int TextMaxLength = 500;

    private Choice(Guid id, string text, bool isCorrect)
    {
        Id = id;
        Text = text;
        IsCorrect = isCorrect;
    }

    public Guid Id { get; }

    public string Text { get; }

    public bool IsCorrect { get; }

    public static Result<Choice> Create(string? text, bool isCorrect)
    {
        var trimmedText = text?.Trim();

        if (string.IsNullOrEmpty(trimmedText))
        {
            return Result<Choice>.Failure(ChoiceErrors.TextRequired);
        }

        if (trimmedText.Length > TextMaxLength)
        {
            return Result<Choice>.Failure(ChoiceErrors.TextTooLong);
        }

        return Result<Choice>.Success(new Choice(Guid.CreateVersion7(), trimmedText, isCorrect));
    }
}
