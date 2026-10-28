using System.Reflection;
using System.Threading.RateLimiting;
using ExamSimulator.Api.Subjects;
using ExamSimulator.Infrastructure;

const string CorsPolicy = "Frontend";

var builder = WebApplication.CreateBuilder(args);

// La génération du document OpenAPI au build démarre l'application sans configuration : elle ne se connecte
// jamais à la base, une chaîne factice suffit à enregistrer les services.
if (Assembly.GetEntryAssembly()?.GetName().Name == "GetDocument.Insider")
{
    builder.Services.AddPersistence("Host=localhost;Database=openapi;Username=fictif;Password=fictif");
}
else
{
    builder.Services.AddInfrastructure(builder.Configuration);
}

builder.Services.AddHealthChecks();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddSubjects();

// Liste explicite d'origines ; vide (aucune origine autorisée) tant que le mainteneur n'a pas fourni celles de production.
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? [];
builder.Services.AddCors(options => options.AddPolicy(CorsPolicy, policy => policy.WithOrigins(allowedOrigins)));

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy(SubjectsEndpoints.RateLimitPolicy, httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 60,
                Window = TimeSpan.FromMinutes(1),
                QueueLimit = 0,
            }));
});

var app = builder.Build();

app.UseCors(CorsPolicy);
app.UseRateLimiter();

// Endpoint technique hors /api/v1 ; il n'expose aucune information.
app.MapHealthChecks("/health").AllowAnonymous();
app.MapOpenApi().AllowAnonymous();
app.MapSubjects();

app.Run();

public partial class Program;
