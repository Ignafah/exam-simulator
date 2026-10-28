using ExamSimulator.Domain.Subjects;

namespace ExamSimulator.Application.Subjects;

public interface ISubjectRepository
{
    Task AddAsync(Subject subject, CancellationToken cancellationToken);

    Task<Subject?> GetByIdAsync(Guid id, CancellationToken cancellationToken);

    Task<PagedResult<SubjectWithCategory>> ListPageAsync(int page, int pageSize, CancellationToken cancellationToken);

    Task<IReadOnlyList<Subject>> ListAsync(CancellationToken cancellationToken);
}
