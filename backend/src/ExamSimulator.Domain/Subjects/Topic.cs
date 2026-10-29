using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Subjects;

public sealed class Topic
{
    public const int NameMaxLength = 100;
    public const decimal MinWeight = 0m;
    public const decimal MaxWeight = 100m;

    private Topic(Guid id, string name, decimal weight, Guid subjectId)
    {
        Id = id;
        Name = name;
        Weight = weight;
        SubjectId = subjectId;
    }

    public Guid Id { get; }

    public string Name { get; }

    public decimal Weight { get; }

    public Guid SubjectId { get; }

    public static Result<Topic> Create(string? name, decimal weight, Guid subjectId)
    {
        var trimmedName = name?.Trim();

        if (string.IsNullOrEmpty(trimmedName))
        {
            return Result<Topic>.Failure(TopicErrors.NameRequired);
        }

        if (trimmedName.Length > NameMaxLength)
        {
            return Result<Topic>.Failure(TopicErrors.NameTooLong);
        }

        if (weight is < MinWeight or > MaxWeight)
        {
            return Result<Topic>.Failure(TopicErrors.WeightOutOfRange);
        }

        if (subjectId == Guid.Empty)
        {
            return Result<Topic>.Failure(TopicErrors.SubjectRequired);
        }

        return Result<Topic>.Success(new Topic(Guid.CreateVersion7(), trimmedName, weight, subjectId));
    }
}
