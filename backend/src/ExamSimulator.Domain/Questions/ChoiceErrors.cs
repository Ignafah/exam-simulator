using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Questions;

public static class ChoiceErrors
{
    public static readonly Error TextRequired = new("Choice.TextRequired", "Le texte du choix est obligatoire.");

    public static readonly Error TextTooLong = new("Choice.TextTooLong", "Le texte du choix est trop long.");
}
