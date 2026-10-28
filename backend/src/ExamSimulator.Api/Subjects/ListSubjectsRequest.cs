using FluentValidation;

namespace ExamSimulator.Api.Subjects;

public sealed record ListSubjectsRequest(int Page, int PageSize);

public sealed class ListSubjectsRequestValidator : AbstractValidator<ListSubjectsRequest>
{
    public const int MaxPageSize = 100;

    public ListSubjectsRequestValidator()
    {
        RuleFor(r => r.Page).GreaterThanOrEqualTo(1).WithName("page");
        RuleFor(r => r.PageSize).InclusiveBetween(1, MaxPageSize).WithName("pageSize");
    }
}
