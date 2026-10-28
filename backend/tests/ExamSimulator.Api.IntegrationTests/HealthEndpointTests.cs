using System.Net;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace ExamSimulator.Api.IntegrationTests;

public sealed class HealthEndpointTests
{
    [Fact]
    public async Task Get_health_sans_authentification_retourne_200()
    {
        // Chaîne factice : /health n'interroge pas la base.
        await using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:Default", "Host=localhost;Database=fictive;Username=fictif;Password=fictif"));
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/health");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
    }

    [Fact]
    public void Demarrage_sans_chaine_de_connexion_echoue_en_nommant_ConnectionStrings_Default()
    {
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
            builder.UseSetting("ConnectionStrings:Default", string.Empty));

        var exception = Should.Throw<InvalidOperationException>(() => factory.CreateClient());

        exception.Message.ShouldContain("ConnectionStrings:Default");
    }
}
