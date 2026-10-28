using ExamSimulator.Domain.Subjects;

namespace ExamSimulator.Domain.Tests.Subjects;

public sealed class SubjectTests
{
    private static readonly Guid CategoryId = Guid.NewGuid();

    [Fact]
    public void Create_WithValidValues_Succeeds()
    {
        var result = Subject.Create("Sujet fictif", "Description fictive", CategoryId);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldNotBe(Guid.Empty);
        result.Value.Name.ShouldBe("Sujet fictif");
        result.Value.Description.ShouldBe("Description fictive");
        result.Value.CategoryId.ShouldBe(CategoryId);
    }

    [Fact]
    public void Create_TrimsName()
    {
        Subject.Create("  Sujet  ", null, CategoryId).Value.Name.ShouldBe("Sujet");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankName_FailsWithNameRequired(string? name)
    {
        var result = Subject.Create(name, null, CategoryId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.NameRequired);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Subject.NameRequired");
    }

    [Fact]
    public void Create_WithNameOfMaxLength_Succeeds()
    {
        Subject.Create(new string('a', Subject.NameMaxLength), null, CategoryId).IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_WithNameTooLong_FailsWithNameTooLong()
    {
        var result = Subject.Create(new string('a', Subject.NameMaxLength + 1), null, CategoryId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.NameTooLong);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Subject.NameTooLong");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankDescription_SucceedsWithNullDescription(string? description)
    {
        var result = Subject.Create("Sujet", description, CategoryId);

        result.IsSuccess.ShouldBeTrue();
        result.Value.Description.ShouldBeNull();
    }

    [Fact]
    public void Create_TrimsDescription()
    {
        Subject.Create("Sujet", "  Description  ", CategoryId).Value.Description.ShouldBe("Description");
    }

    [Fact]
    public void Create_WithDescriptionOfMaxLength_Succeeds()
    {
        var description = new string('a', Subject.DescriptionMaxLength);

        Subject.Create("Sujet", description, CategoryId).IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_WithDescriptionTooLong_FailsWithDescriptionTooLong()
    {
        var description = new string('a', Subject.DescriptionMaxLength + 1);

        var result = Subject.Create("Sujet", description, CategoryId);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.DescriptionTooLong);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Subject.DescriptionTooLong");
    }

    [Fact]
    public void Create_WithEmptyCategoryId_FailsWithCategoryRequired()
    {
        var result = Subject.Create("Sujet", null, Guid.Empty);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SubjectErrors.CategoryRequired);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Subject.CategoryRequired");
    }

    [Fact]
    public void Create_ValidatesNameBeforeDescriptionBeforeCategory()
    {
        var tooLong = new string('a', Subject.DescriptionMaxLength + 1);

        Subject.Create("", tooLong, Guid.Empty).Error.ShouldBe(SubjectErrors.NameRequired);
        Subject.Create("Sujet", tooLong, Guid.Empty).Error.ShouldBe(SubjectErrors.DescriptionTooLong);
    }

    [Fact]
    public void Create_GeneratesDistinctVersion7Ids()
    {
        var first = Subject.Create("Sujet", null, CategoryId).Value;
        var second = Subject.Create("Sujet", null, CategoryId).Value;

        first.Id.ShouldNotBe(second.Id);
        first.Id.Version.ShouldBe(7);
        second.Id.Version.ShouldBe(7);
    }

    [Fact]
    public void Subject_HasNoPublicConstructor()
    {
        typeof(Subject).GetConstructors().ShouldBeEmpty();
    }
}
