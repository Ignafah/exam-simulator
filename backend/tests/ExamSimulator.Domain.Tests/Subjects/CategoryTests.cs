using ExamSimulator.Domain.Subjects;

namespace ExamSimulator.Domain.Tests.Subjects;

public sealed class CategoryTests
{
    [Fact]
    public void Create_WithValidName_Succeeds()
    {
        var result = Category.Create("Tech");

        result.IsSuccess.ShouldBeTrue();
        result.Value.Id.ShouldNotBe(Guid.Empty);
        result.Value.Name.ShouldBe("Tech");
    }

    [Fact]
    public void Create_TrimsName()
    {
        Category.Create("  Tech  ").Value.Name.ShouldBe("Tech");
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithBlankName_FailsWithNameRequired(string? name)
    {
        var result = Category.Create(name!);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CategoryErrors.NameRequired);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Category.NameRequired");
    }

    [Fact]
    public void Create_WithNameOfMaxLength_Succeeds()
    {
        Category.Create(new string('a', Category.NameMaxLength)).IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Create_WithNameTooLong_FailsWithNameTooLong()
    {
        var result = Category.Create(new string('a', Category.NameMaxLength + 1));

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(CategoryErrors.NameTooLong);
        result.Error.ShouldNotBeNull().Code.ShouldBe("Category.NameTooLong");
    }

    [Fact]
    public void Create_WithMaxLengthNameSurroundedBySpaces_Succeeds()
    {
        var name = "  " + new string('a', Category.NameMaxLength) + "  ";

        Category.Create(name).IsSuccess.ShouldBeTrue();
    }

    [Fact]
    public void Category_HasNoPublicConstructor()
    {
        typeof(Category).GetConstructors().ShouldBeEmpty();
    }
}
