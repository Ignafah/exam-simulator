using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Subjects;

public sealed class Category
{
    public const int NameMaxLength = 100;

    private Category(Guid id, string name)
    {
        Id = id;
        Name = name;
    }

    public Guid Id { get; }

    public string Name { get; }

    public static Result<Category> Create(string? name)
    {
        var trimmed = name?.Trim();

        if (string.IsNullOrEmpty(trimmed))
        {
            return Result<Category>.Failure(CategoryErrors.NameRequired);
        }

        if (trimmed.Length > NameMaxLength)
        {
            return Result<Category>.Failure(CategoryErrors.NameTooLong);
        }

        return Result<Category>.Success(new Category(Guid.CreateVersion7(), trimmed));
    }
}
