using ExamSimulator.Domain.Questions;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExamSimulator.Infrastructure.Persistence.Configurations;

internal sealed class ChoiceConfiguration : IEntityTypeConfiguration<Choice>
{
    public void Configure(EntityTypeBuilder<Choice> builder)
    {
        builder.ToTable("choices");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Text).IsRequired().HasMaxLength(Choice.TextMaxLength);
        builder.Property(c => c.IsCorrect).IsRequired();
        builder.Property<Guid>("QuestionId").IsRequired();
        builder.Property<int>("Position").IsRequired();

        builder.HasIndex("QuestionId", "Position").IsUnique();
    }
}
