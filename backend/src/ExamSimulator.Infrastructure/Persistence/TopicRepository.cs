using ExamSimulator.Application.Subjects;
using ExamSimulator.Domain.Subjects;
using Microsoft.EntityFrameworkCore;

namespace ExamSimulator.Infrastructure.Persistence;

internal sealed class TopicRepository(ExamSimulatorDbContext dbContext) : ITopicRepository
{
    public async Task AddAsync(Topic topic, CancellationToken cancellationToken) =>
        await dbContext.Topics.AddAsync(topic, cancellationToken);

    public Task<Topic?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Topics.AsNoTracking().FirstOrDefaultAsync(t => t.Id == id, cancellationToken);
}
