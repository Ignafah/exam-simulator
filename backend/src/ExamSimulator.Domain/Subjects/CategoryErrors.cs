using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Subjects;

public static class CategoryErrors
{
    public static readonly Error NameRequired = new("Category.NameRequired", "Le nom de la catégorie est obligatoire.");

    public static readonly Error NameTooLong = new("Category.NameTooLong", "Le nom de la catégorie est trop long.");
}
