using ExamSimulator.Domain.Questions;

namespace ExamSimulator.Application.Questions;

public interface IQuestionRepository
{
    Task AddAsync(Question question, CancellationToken cancellationToken);

    Task<Question?> GetByIdAsync(Guid id, CancellationToken cancellationToken);
}
