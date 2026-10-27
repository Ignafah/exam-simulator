using System.Reflection;
using NetArchTest.Rules;

namespace ExamSimulator.ArchitectureTests;

public sealed class DependencyRulesTests
{
    private const string DomainNs = "ExamSimulator.Domain";
    private const string ApplicationNs = "ExamSimulator.Application";
    private const string InfrastructureNs = "ExamSimulator.Infrastructure";
    private const string ApiNs = "ExamSimulator.Api";

    private static readonly Assembly DomainAssembly = typeof(Domain.AssemblyMarker).Assembly;
    private static readonly Assembly ApplicationAssembly = typeof(Application.AssemblyMarker).Assembly;
    private static readonly Assembly InfrastructureAssembly = typeof(Infrastructure.AssemblyMarker).Assembly;

    [Fact]
    public void Domain_ne_depend_d_aucun_autre_projet()
    {
        var result = Types.InAssembly(DomainAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(ApplicationNs, InfrastructureNs, ApiNs)
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Application_ne_depend_ni_d_Infrastructure_ni_d_Api()
    {
        var result = Types.InAssembly(ApplicationAssembly)
            .ShouldNot()
            .HaveDependencyOnAny(InfrastructureNs, ApiNs)
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }

    [Fact]
    public void Infrastructure_ne_depend_pas_d_Api()
    {
        var result = Types.InAssembly(InfrastructureAssembly)
            .ShouldNot()
            .HaveDependencyOn(ApiNs)
            .GetResult();

        result.IsSuccessful.ShouldBeTrue();
    }
}
