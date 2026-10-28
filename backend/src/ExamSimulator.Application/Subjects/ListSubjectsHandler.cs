namespace ExamSimulator.Application.Subjects;

public sealed class ListSubjectsHandler(ISubjectRepository subjects)
{
    // page et pageSize sont déjà validés par l'appelant (validation HTTP).
    public async Task<PagedResult<SubjectSummaryDto>> HandleAsync(
        int page, int pageSize, CancellationToken cancellationToken)
    {
        var result = await subjects.ListPageAsync(page, pageSize, cancellationToken);
        return result.ToDto();
    }
}
