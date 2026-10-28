using ExamSimulator.Domain.Common;

namespace ExamSimulator.Domain.Tests.Common;

public sealed class ResultTests
{
    private static readonly Error SampleError = new("Sample.Code", "Message d'exemple.");

    [Fact]
    public void Success_IsSuccessAndNotFailure()
    {
        var result = Result.Success();

        result.IsSuccess.ShouldBeTrue();
        result.IsFailure.ShouldBeFalse();
    }

    [Fact]
    public void Failure_IsFailureWithGivenError()
    {
        var result = Result.Failure(SampleError);

        result.IsFailure.ShouldBeTrue();
        result.IsSuccess.ShouldBeFalse();
        result.Error.ShouldBe(SampleError);
    }

    [Fact]
    public void GenericSuccess_ExposesValue()
    {
        var result = Result<int>.Success(42);

        result.IsSuccess.ShouldBeTrue();
        result.Value.ShouldBe(42);
    }

    [Fact]
    public void GenericFailure_CarriesErrorAndValueThrows()
    {
        var result = Result<int>.Failure(SampleError);

        result.IsFailure.ShouldBeTrue();
        result.Error.ShouldBe(SampleError);
        Should.Throw<InvalidOperationException>(() => result.Value);
    }

    [Fact]
    public void Errors_WithSameCodeAndMessage_AreEqual()
    {
        var first = new Error("Code", "Message");
        var second = new Error("Code", "Message");

        first.ShouldBe(second);
    }
}
