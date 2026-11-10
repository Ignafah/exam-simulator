using ExamSimulator.Domain.Subjects;

namespace ExamSimulator.Application.Subjects;

public interface ITopicRepository
{
    Task AddAsync(Topic topic, CancellationToken cancellationToken);

    Task<Topic?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
