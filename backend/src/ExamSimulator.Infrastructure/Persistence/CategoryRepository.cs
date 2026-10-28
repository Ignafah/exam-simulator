using ExamSimulator.Application.Subjects;
using ExamSimulator.Domain.Subjects;
using Microsoft.EntityFrameworkCore;

namespace ExamSimulator.Infrastructure.Persistence;

internal sealed class CategoryRepository(ExamSimulatorDbContext dbContext) : ICategoryRepository
{
    public async Task AddAsync(Category category, CancellationToken cancellationToken) =>
        await dbContext.Categories.AddAsync(category, cancellationToken);

    public Task<Category?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Categories.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

    public async Task<IReadOnlyList<Category>> ListAsync(CancellationToken cancellationToken) =>
        await dbContext.Categories.AsNoTracking().OrderBy(c => c.Name).ThenBy(c => c.Id).ToListAsync(cancellationToken);
}
