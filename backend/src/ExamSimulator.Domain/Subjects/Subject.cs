using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Subjects;

public sealed class Subject
{
    public const int NameMaxLength = 100;
    public const int DescriptionMaxLength = 500;

    private Subject(Guid id, string name, string? description, Guid categoryId)
    {
        Id = id;
        Name = name;
        Description = description;
        CategoryId = categoryId;
    }

    public Guid Id { get; }

    public string Name { get; }

    public string? Description { get; }

    public Guid CategoryId { get; }

    public static Result<Subject> Create(string name, string? description, Guid categoryId)
    {
        var trimmedName = name?.Trim();

        if (string.IsNullOrEmpty(trimmedName))
        {
            return Result<Subject>.Failure(SubjectErrors.NameRequired);
        }

        if (trimmedName.Length > NameMaxLength)
        {
            return Result<Subject>.Failure(SubjectErrors.NameTooLong);
        }

        var trimmedDescription = description?.Trim();
        if (string.IsNullOrEmpty(trimmedDescription))
        {
            trimmedDescription = null;
        }

        if (trimmedDescription?.Length > DescriptionMaxLength)
        {
            return Result<Subject>.Failure(SubjectErrors.DescriptionTooLong);
        }

        if (categoryId == Guid.Empty)
        {
            return Result<Subject>.Failure(SubjectErrors.CategoryRequired);
        }

        return Result<Subject>.Success(new Subject(Guid.CreateVersion7(), trimmedName, trimmedDescription, categoryId));
    }
}
