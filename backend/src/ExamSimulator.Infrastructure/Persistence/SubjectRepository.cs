using ExamSimulator.Application.Subjects;
using ExamSimulator.Domain.Subjects;
using Microsoft.EntityFrameworkCore;

namespace ExamSimulator.Infrastructure.Persistence;

internal sealed class SubjectRepository(ExamSimulatorDbContext dbContext) : ISubjectRepository
{
    public async Task AddAsync(Subject subject, CancellationToken cancellationToken) =>
        await dbContext.Subjects.AddAsync(subject, cancellationToken);

    public Task<Subject?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Subjects.AsNoTracking().FirstOrDefaultAsync(s => s.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Subject>> ListAsync(CancellationToken cancellationToken) =>
        await dbContext.Subjects.AsNoTracking().OrderBy(s => s.Name).ThenBy(s => s.Id).ToListAsync(cancellationToken);

    public async Task<PagedResult<SubjectWithCategory>> ListPageAsync(
        int page, int pageSize, CancellationToken cancellationToken)
    {
        var query = dbContext.Subjects.AsNoTracking()
            .Join(dbContext.Categories, s => s.CategoryId, c => c.Id, (s, c) => new { Subject = s, CategoryName = c.Name });

        var totalCount = await query.CountAsync(cancellationToken);
        var rows = await query
            .OrderBy(x => x.Subject.Name.ToLower())
            .ThenBy(x => x.Subject.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResult<SubjectWithCategory>(
            [.. rows.Select(r => new SubjectWithCategory(r.Subject, r.CategoryName))], page, pageSize, totalCount);
    }
}
