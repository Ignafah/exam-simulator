using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Questions;

public static class QuestionErrors
{
    public static readonly Error TextRequired = new("Question.TextRequired", "L'énoncé de la question est obligatoire.");

    public static readonly Error TextTooLong = new("Question.TextTooLong", "L'énoncé de la question est trop long.");

    public static readonly Error TypeInvalid = new("Question.TypeInvalid", "Le type de la question est invalide.");

    public static readonly Error ExplanationRequired = new("Question.ExplanationRequired", "L'explication de la question est obligatoire.");

    public static readonly Error ExplanationTooLong = new("Question.ExplanationTooLong", "L'explication de la question est trop longue.");

    public static readonly Error SourceRequired = new("Question.SourceRequired", "La source de la question est obligatoire.");

    public static readonly Error SourceTooLong = new("Question.SourceTooLong", "La source de la question est trop longue.");

    public static readonly Error TopicRequired = new("Question.TopicRequired", "Le thème de la question est obligatoire.");

    public static readonly Error NotEnoughChoices = new("Question.NotEnoughChoices", "Une question doit avoir au moins 2 choix.");
}
