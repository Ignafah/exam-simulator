using ExamSimulator.Application.Subjects;
using FluentValidation;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;

namespace ExamSimulator.Api.Subjects;

public static class SubjectsEndpoints
{
    public const string RateLimitPolicy = "subjects";

    public static IServiceCollection AddSubjects(this IServiceCollection services)
    {
        services.AddScoped<ListSubjectsHandler>();
        services.AddScoped<IValidator<ListSubjectsRequest>, ListSubjectsRequestValidator>();
        return services;
    }

    public static IEndpointRouteBuilder MapSubjects(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/v1/subjects")
            .WithTags("Subjects")
            .AllowAnonymous()
            .RequireRateLimiting(RateLimitPolicy);

        group.MapGet("/", ListAsync)
            .WithName("ListSubjects")
            .Produces<PagedResult<SubjectSummaryDto>>()
            .ProducesValidationProblem()
            .ProducesProblem(StatusCodes.Status429TooManyRequests);

        return app;
    }

    private static async Task<Results<Ok<PagedResult<SubjectSummaryDto>>, ValidationProblem>> ListAsync(
        IValidator<ListSubjectsRequest> validator,
        ListSubjectsHandler handler,
        CancellationToken cancellationToken,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var request = new ListSubjectsRequest(page, pageSize);
        var validation = await validator.ValidateAsync(request, cancellationToken);
        if (!validation.IsValid)
        {
            return TypedResults.ValidationProblem(validation.ToDictionary());
        }

        return TypedResults.Ok(await handler.HandleAsync(page, pageSize, cancellationToken));
    }
}
