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
}
