using ExamSimulator.Application.Subjects;
using ExamSimulator.Domain.Subjects;

namespace ExamSimulator.Application.Tests.Subjects;

public sealed class ListSubjectsHandlerTests
{
    [Fact]
    public async Task Three_subjects_are_returned_as_dtos_with_id_name_and_category_name()
    {
        var categoryId = Guid.NewGuid();
        var subjects = new[] { "Sujet 1", "Sujet 2", "Sujet 3" }
            .Select(name => new SubjectWithCategory(Subject.Create(name, "Description", categoryId).Value, "Catégorie fictive"))
            .ToList();
        var handler = new ListSubjectsHandler(new FakeSubjectRepository(subjects, subjects.Count));

        var result = await handler.HandleAsync(1, 20, CancellationToken.None);

        result.Items.ShouldBe(
            subjects.Select(s => new SubjectSummaryDto(s.Subject.Id, s.Subject.Name, "Catégorie fictive")).ToList());
        result.Page.ShouldBe(1);
        result.PageSize.ShouldBe(20);
        result.TotalCount.ShouldBe(3);
    }

    [Fact]
    public async Task No_subject_gives_empty_items_and_zero_total()
    {
        var handler = new ListSubjectsHandler(new FakeSubjectRepository([], 0));

        var result = await handler.HandleAsync(1, 20, CancellationToken.None);

        result.Items.ShouldBeEmpty();
        result.TotalCount.ShouldBe(0);
    }

    [Fact]
    public async Task Page_and_page_size_are_forwarded_to_the_repository()
    {
        var repository = new FakeSubjectRepository([], 25);
        var handler = new ListSubjectsHandler(repository);

        var result = await handler.HandleAsync(2, 20, CancellationToken.None);

        repository.RequestedPage.ShouldBe(2);
        repository.RequestedPageSize.ShouldBe(20);
        result.Page.ShouldBe(2);
        result.PageSize.ShouldBe(20);
        result.TotalCount.ShouldBe(25);
    }

    [Fact]
    public void Result_exposes_only_dto_properties()
    {
        typeof(SubjectSummaryDto).GetProperties().Select(p => p.Name)
            .ShouldBe(["Id", "Name", "CategoryName"], ignoreOrder: true);
        typeof(ListSubjectsHandler).GetMethod(nameof(ListSubjectsHandler.HandleAsync))
            .ShouldNotBeNull()
            .ReturnType.ShouldBe(typeof(Task<PagedResult<SubjectSummaryDto>>));
    }

    private sealed class FakeSubjectRepository(IReadOnlyList<SubjectWithCategory> items, int totalCount)
        : ISubjectRepository
    {
        public int RequestedPage { get; private set; }

        public int RequestedPageSize { get; private set; }

        public Task<PagedResult<SubjectWithCategory>> ListPageAsync(
            int page, int pageSize, CancellationToken cancellationToken)
        {
            RequestedPage = page;
            RequestedPageSize = pageSize;
            return Task.FromResult(new PagedResult<SubjectWithCategory>(items, page, pageSize, totalCount));
        }

        public Task AddAsync(Subject subject, CancellationToken cancellationToken) => throw new NotSupportedException();

        public Task<Subject?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
            throw new NotSupportedException();

        public Task<IReadOnlyList<Subject>> ListAsync(CancellationToken cancellationToken) =>
            throw new NotSupportedException();
    }
}
