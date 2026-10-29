using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Questions;

public sealed class Question
{
    public const int TextMaxLength = 2000;
    public const int ExplanationMaxLength = 4000;
    public const int SourceMaxLength = 500;
    public const int MinChoices = 2;

    private Question(
        Guid id,
        string text,
        QuestionType type,
        string explanation,
        string source,
        Guid topicId,
        IReadOnlyList<Choice> choices)
    {
        Id = id;
        Text = text;
        Type = type;
        Explanation = explanation;
        Source = source;
        TopicId = topicId;
        Choices = choices;
    }

    public Guid Id { get; }

    public string Text { get; }

    public QuestionType Type { get; }

    public string Explanation { get; }

    public string Source { get; }

    public Guid TopicId { get; }

    public IReadOnlyList<Choice> Choices { get; }

    public static Result<Question> Create(
        string? text,
        QuestionType type,
        string? explanation,
        string? source,
        Guid topicId,
        IEnumerable<Choice>? choices)
    {
        var trimmedText = text?.Trim();

        if (string.IsNullOrEmpty(trimmedText))
        {
            return Result<Question>.Failure(QuestionErrors.TextRequired);
        }

        if (trimmedText.Length > TextMaxLength)
        {
            return Result<Question>.Failure(QuestionErrors.TextTooLong);
        }

        if (!Enum.IsDefined(type))
        {
            return Result<Question>.Failure(QuestionErrors.TypeInvalid);
        }

        var trimmedExplanation = explanation?.Trim();

        if (string.IsNullOrEmpty(trimmedExplanation))
        {
            return Result<Question>.Failure(QuestionErrors.ExplanationRequired);
        }

        if (trimmedExplanation.Length > ExplanationMaxLength)
        {
            return Result<Question>.Failure(QuestionErrors.ExplanationTooLong);
        }

        var trimmedSource = source?.Trim();

        if (string.IsNullOrEmpty(trimmedSource))
        {
            return Result<Question>.Failure(QuestionErrors.SourceRequired);
        }

        if (trimmedSource.Length > SourceMaxLength)
        {
            return Result<Question>.Failure(QuestionErrors.SourceTooLong);
        }

        if (topicId == Guid.Empty)
        {
            return Result<Question>.Failure(QuestionErrors.TopicRequired);
        }

        var choiceList = choices?.ToList();

        if (choiceList is null || choiceList.Count < MinChoices || choiceList.Any(choice => choice is null))
        {
            return Result<Question>.Failure(QuestionErrors.NotEnoughChoices);
        }

        return Result<Question>.Success(new Question(
            Guid.CreateVersion7(),
            trimmedText,
            type,
            trimmedExplanation,
            trimmedSource,
            topicId,
            choiceList.AsReadOnly()));
    }
}
