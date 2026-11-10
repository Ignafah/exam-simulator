using ExamSimulator.Application.Questions;
using ExamSimulator.Domain.Questions;
using Microsoft.EntityFrameworkCore;

namespace ExamSimulator.Infrastructure.Persistence;

internal sealed class QuestionRepository(ExamSimulatorDbContext dbContext) : IQuestionRepository
{
    public async Task AddAsync(Question question, CancellationToken cancellationToken)
    {
        await dbContext.Questions.AddAsync(question, cancellationToken);

        var position = 0;
        foreach (var choice in question.Choices)
        {
            dbContext.Entry(choice).Property<int>("Position").CurrentValue = position++;
        }
    }

    public Task<Question?> GetByIdAsync(Guid id, CancellationToken cancellationToken) =>
        dbContext.Questions
            .AsNoTracking()
            .Include(q => q.Choices.OrderBy(c => EF.Property<int>(c, "Position")))
            .FirstOrDefaultAsync(q => q.Id == id, cancellationToken);
}
