using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Subjects;

public static class TopicErrors
{
    public static readonly Error NameRequired = new("Topic.NameRequired", "Le nom du thème est obligatoire.");

    public static readonly Error NameTooLong = new("Topic.NameTooLong", "Le nom du thème est trop long.");

    public static readonly Error WeightOutOfRange = new("Topic.WeightOutOfRange", "Le poids du thème doit être compris entre 0 et 100.");

    public static readonly Error SubjectRequired = new("Topic.SubjectRequired", "Le sujet du thème est obligatoire.");
}
