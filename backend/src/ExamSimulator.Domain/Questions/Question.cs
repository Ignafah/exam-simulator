using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Questions;

public sealed class Question
{
    public const int TextMaxLength = 2000;
    public const int ExplanationMaxLength = 4000;
    public const int SourceMaxLength = 500;
    public const int MinChoices = 2;
    public const int TrueFalseChoiceCount = 2;

    private readonly List<Choice> _choices = [];

    private Question(
        Guid id,
        string text,
        QuestionType type,
        string explanation,
        string source,
        Guid topicId)
    {
        Id = id;
        Text = text;
        Type = type;
        Explanation = explanation;
        Source = source;
        TopicId = topicId;
    }

    public Guid Id { get; }

    public string Text { get; }

    public QuestionType Type { get; }

    public string Explanation { get; }

    public string Source { get; }

    public Guid TopicId { get; }

    public IReadOnlyList<Choice> Choices => _choices.AsReadOnly();

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

        var correctCount = choiceList.Count(choice => choice.IsCorrect);

        switch (type)
        {
            case QuestionType.TrueFalse:
                if (choiceList.Count != TrueFalseChoiceCount)
                {
                    return Result<Question>.Failure(QuestionErrors.TrueFalseRequiresTwoChoices);
                }

                if (correctCount != 1)
                {
                    return Result<Question>.Failure(QuestionErrors.ExactlyOneCorrectChoiceRequired);
                }

                break;
            case QuestionType.SingleChoice:
                if (correctCount != 1)
                {
                    return Result<Question>.Failure(QuestionErrors.ExactlyOneCorrectChoiceRequired);
                }

                break;
            case QuestionType.MultipleChoice:
                if (correctCount < 1)
                {
                    return Result<Question>.Failure(QuestionErrors.AtLeastOneCorrectChoiceRequired);
                }

                break;
            default:
                // Le type est déjà validé par Enum.IsDefined : un autre cas est une erreur de programmation.
                throw new InvalidOperationException($"Type de question non géré : {type}.");
        }

        var question = new Question(
            Guid.CreateVersion7(),
            trimmedText,
            type,
            trimmedExplanation,
            trimmedSource,
            topicId);
        question._choices.AddRange(choiceList);

        return Result<Question>.Success(question);
    }

    public Result<bool> Check(IEnumerable<Guid>? selectedChoiceIds)
    {
        var selected = selectedChoiceIds is null ? new HashSet<Guid>() : selectedChoiceIds.ToHashSet();

        if (selected.Count == 0)
        {
            return Result<bool>.Failure(QuestionErrors.NoChoiceSelected);
        }

        var knownIds = Choices.Select(choice => choice.Id).ToHashSet();

        if (!selected.IsSubsetOf(knownIds))
        {
            return Result<bool>.Failure(QuestionErrors.UnknownChoice);
        }

        var correctIds = Choices.Where(choice => choice.IsCorrect).Select(choice => choice.Id).ToHashSet();

        return Result<bool>.Success(selected.SetEquals(correctIds));
    }
}
