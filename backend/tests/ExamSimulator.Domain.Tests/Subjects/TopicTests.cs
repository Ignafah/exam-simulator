using ExamSimulator.Domain.Subjects;

namespace ExamSimulator.Domain.Tests.Subjects;

public sealed class TopicTests
{
    private static readonly Guid SubjectId = Guid.NewGuid();

    [Fact]
    public void Create_WithValidValues_Succeeds()
    {
        var result = Topic.Create("Compute Solutions", 27.5m, SubjectId);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldNotBe(Guid.Empty);
        result.Value.Name.ShouldBe("Compute Solutions");
        result.Value.Weight.ShouldBe(27.5m);
        result.Value.SubjectId.ShouldBe(SubjectId);
    }

    [Fact]
    public void Create_TrimsName()
    {
        Topic.Create("  Compute  ", 10m, SubjectId).Value.Name.ShouldBe("Compute");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankName_FailsWithNameRequired(string? name)
    {
        var result = Topic.Create(name, 10m, SubjectId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TopicErrors.NameRequired);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Topic.NameRequired");
    }

    [Fact]
    public void Create_WithNameOfMaxLength_Succeeds()
    {
        Topic.Create(new string('a', Topic.NameMaxLength), 10m, SubjectId).IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_WithNameTooLong_FailsWithNameTooLong()
    {
        var result = Topic.Create(new string('a', Topic.NameMaxLength + 1), 10m, SubjectId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TopicErrors.NameTooLong);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Topic.NameTooLong");
    }

    [Theory]
    [InlineData(0)]
    [InlineData(100)]
    public void Create_WithWeightAtBounds_Succeeds(decimal weight)
    {
        Topic.Create("Thème", weight, SubjectId).IsSuccess.ShouldBeTrue();
    }

    [Theory]
    [InlineData(-0.1)]
    [InlineData(100.1)]
    [InlineData(-1)]
    [InlineData(101)]
    public void Create_WithWeightOutOfRange_FailsWithWeightOutOfRange(double weight)
    {
        var result = Topic.Create("Thème", (decimal)weight, SubjectId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TopicErrors.WeightOutOfRange);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Topic.WeightOutOfRange");
    }

    [Fact]
    public void Create_WithEmptySubjectId_FailsWithSubjectRequired()
    {
        var result = Topic.Create("Thème", 10m, Guid.Empty);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(TopicErrors.SubjectRequired);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Topic.SubjectRequired");
    }

    [Fact]
    public void Create_ValidatesNameBeforeWeightBeforeSubject()
    {
        Topic.Create("", 150m, Guid.Empty).Error.ShouldBe(TopicErrors.NameRequired);
        Topic.Create("Thème", 150m, Guid.Empty).Error.ShouldBe(TopicErrors.WeightOutOfRange);
    }

    [Fact]
    public void Create_GeneratesDistinctVersion7Ids()
    {
        var first = Topic.Create("Thème", 10m, SubjectId).Value;
        var second = Topic.Create("Thème", 10m, SubjectId).Value;

        first.Id.ShouldNotBe(second.Id);
        first.Id.Version.ShouldBe(7);
        second.Id.Version.ShouldBe(7);
    }

    [Fact]
    public void Topic_HasNoPublicConstructor()
    {
        typeof(Topic).GetConstructors().ShouldBeEmpty();
    }
}
