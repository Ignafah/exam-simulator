using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace ExamSimulator.Api.IntegrationTests;

[Collection(PostgreSqlCollection.Name)]
public sealed class SubjectsEndpointTests(PostgreSqlFixture postgres)
{
    private const string Route = "/api/v1/subjects";

    private async Task<ApiFactory> CreateFactoryAsync(Dictionary<string, string?>? settings = null)
    {
        var factory = new ApiFactory(postgres.ConnectionString, settings);
        await factory.MigrateAsync();
        return factory;
    }

    private static async Task<JsonElement> ReadJsonAsync(HttpResponseMessage response) =>
        await response.Content.ReadFromJsonAsync<JsonElement>();

    [Fact]
    public async Task Three_subjects_are_returned_anonymously_with_id_name_and_category_name_only()
    {
        await using var factory = await CreateFactoryAsync();
        await factory.SeedSubjectsAsync("Catégorie fictive", "Sujet 1", "Sujet 2", "Sujet 3");
        using var client = factory.CreateClient();

        var response = await client.GetAsync(Route);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var json = await ReadJsonAsync(response);
        var items = json.GetProperty("items").EnumerateArray().ToList();
        items.Count.ShouldBe(3);
        foreach (var item in items)
        {
            item.EnumerateObject().Select(p => p.Name).Order().ShouldBe(["categoryName", "id", "name"]);
            item.GetProperty("categoryName").GetString().ShouldBe("Catégorie fictive");
            item.GetProperty("id").GetGuid().ShouldNotBe(Guid.Empty);
        }

        items.Select(i => i.GetProperty("name").GetString()).ShouldBe(["Sujet 1", "Sujet 2", "Sujet 3"]);
    }

    [Fact]
    public async Task Response_contains_no_question_choice_or_answer()
    {
        await using var factory = await CreateFactoryAsync();
        await factory.SeedSubjectsAsync("Catégorie fictive", "Sujet 1");
        using var client = factory.CreateClient();

        var body = await (await client.GetAsync(Route)).Content.ReadAsStringAsync();

        body.ShouldNotContain("question", Case.Insensitive);
        body.ShouldNotContain("choice", Case.Insensitive);
        body.ShouldNotContain("answer", Case.Insensitive);
        body.ShouldNotContain("correct", Case.Insensitive);
    }

    [Fact]
    public async Task Subjects_are_ordered_by_name_ignoring_case()
    {
        await using var factory = await CreateFactoryAsync();
        await factory.SeedSubjectsAsync("Catégorie fictive", "B", "a", "C");
        using var client = factory.CreateClient();

        var json = await ReadJsonAsync(await client.GetAsync(Route));

        json.GetProperty("items").EnumerateArray().Select(i => i.GetProperty("name").GetString())
            .ShouldBe(["a", "B", "C"]);
    }

    [Fact]
    public async Task Pages_of_20_out_of_25_subjects_give_20_then_5_items()
    {
        await using var factory = await CreateFactoryAsync();
        await factory.SeedSubjectsAsync(
            "Catégorie fictive", Enumerable.Range(1, 25).Select(i => $"Sujet {i:00}").ToArray());
        using var client = factory.CreateClient();

        var first = await ReadJsonAsync(await client.GetAsync($"{Route}?page=1&pageSize=20"));
        var second = await ReadJsonAsync(await client.GetAsync($"{Route}?page=2&pageSize=20"));

        first.GetProperty("items").GetArrayLength().ShouldBe(20);
        first.GetProperty("totalCount").GetInt32().ShouldBe(25);
        second.GetProperty("items").GetArrayLength().ShouldBe(5);
        second.GetProperty("totalCount").GetInt32().ShouldBe(25);
        second.GetProperty("page").GetInt32().ShouldBe(2);
    }

    [Fact]
    public async Task Without_parameters_page_is_1_and_page_size_is_20()
    {
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        var json = await ReadJsonAsync(await client.GetAsync(Route));

        json.GetProperty("page").GetInt32().ShouldBe(1);
        json.GetProperty("pageSize").GetInt32().ShouldBe(20);
    }

    [Theory]
    [InlineData("page=0")]
    [InlineData("pageSize=0")]
    [InlineData("pageSize=101")]
    public async Task Invalid_paging_returns_400_problem_details(string query)
    {
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        var response = await client.GetAsync($"{Route}?{query}");

        response.StatusCode.ShouldBe(HttpStatusCode.BadRequest);
        response.Content.Headers.ContentType?.MediaType.ShouldBe("application/problem+json");
        var json = await ReadJsonAsync(response);
        json.GetProperty("status").GetInt32().ShouldBe(400);
        json.TryGetProperty("title", out _).ShouldBeTrue();
    }

    [Fact]
    public async Task Without_subjects_the_list_is_empty_with_total_count_0()
    {
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        var response = await client.GetAsync(Route);

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var json = await ReadJsonAsync(response);
        json.GetProperty("items").GetArrayLength().ShouldBe(0);
        json.GetProperty("totalCount").GetInt32().ShouldBe(0);
    }

    [Fact]
    public async Task Requests_beyond_60_per_minute_from_the_same_address_get_429()
    {
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        for (var i = 0; i < 60; i++)
        {
            (await client.GetAsync(Route)).StatusCode.ShouldBe(HttpStatusCode.OK);
        }

        var response = await client.GetAsync(Route);

        response.StatusCode.ShouldBe(HttpStatusCode.TooManyRequests);
    }

    [Fact]
    public async Task Allowed_origin_is_echoed_and_unlisted_origin_is_not_allowed()
    {
        await using var factory = await CreateFactoryAsync(new()
        {
            ["Cors:AllowedOrigins:0"] = "https://exemple.test",
        });
        using var client = factory.CreateClient();

        using var allowed = new HttpRequestMessage(HttpMethod.Get, Route);
        allowed.Headers.Add("Origin", "https://exemple.test");
        using var denied = new HttpRequestMessage(HttpMethod.Get, Route);
        denied.Headers.Add("Origin", "https://autre.test");

        using var allowedResponse = await client.SendAsync(allowed);
        using var deniedResponse = await client.SendAsync(denied);

        allowedResponse.Headers.GetValues("Access-Control-Allow-Origin").ShouldBe(["https://exemple.test"]);
        deniedResponse.Headers.Contains("Access-Control-Allow-Origin").ShouldBeFalse();
    }

    [Fact]
    public async Task Without_configured_origins_no_origin_is_allowed()
    {
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Get, Route);
        request.Headers.Add("Origin", "https://exemple.test");

        using var response = await client.SendAsync(request);

        response.Headers.Contains("Access-Control-Allow-Origin").ShouldBeFalse();
    }

    [Fact]
    public async Task OpenApi_document_describes_the_route_its_parameters_and_the_200_and_400_responses()
    {
        await using var factory = await CreateFactoryAsync();
        using var client = factory.CreateClient();

        var response = await client.GetAsync("/openapi/v1.json");

        response.StatusCode.ShouldBe(HttpStatusCode.OK);
        var operation = (await ReadJsonAsync(response)).GetProperty("paths").GetProperty(Route).GetProperty("get");
        operation.GetProperty("parameters").EnumerateArray().Select(p => p.GetProperty("name").GetString())
            .Order().ShouldBe(["page", "pageSize"]);
        var responses = operation.GetProperty("responses");
        responses.TryGetProperty("200", out _).ShouldBeTrue();
        responses.TryGetProperty("400", out _).ShouldBeTrue();
    }
}
