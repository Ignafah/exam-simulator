using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Subjects;

public static class SubjectErrors
{
    public static readonly Error NameRequired = new("Subject.NameRequired", "Le nom du sujet est obligatoire.");

    public static readonly Error NameTooLong = new("Subject.NameTooLong", "Le nom du sujet est trop long.");

    public static readonly Error DescriptionTooLong = new("Subject.DescriptionTooLong", "La description du sujet est trop longue.");

    public static readonly Error CategoryRequired = new("Subject.CategoryRequired", "La catégorie du sujet est obligatoire.");
}
