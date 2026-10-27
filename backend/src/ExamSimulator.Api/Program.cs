var builder = WebApplication.CreateBuilder(args);
builder.Services.AddHealthChecks();

var app = builder.Build();

// Endpoint technique hors /api/v1 ; il n'expose aucune information.
app.MapHealthChecks("/health").AllowAnonymous();

app.Run();

public partial class Program;
