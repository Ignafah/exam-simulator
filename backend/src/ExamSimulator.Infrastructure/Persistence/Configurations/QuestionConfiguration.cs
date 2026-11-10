using ExamSimulator.Domain.Questions;
using ExamSimulator.Domain.Subjects;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace ExamSimulator.Infrastructure.Persistence.Configurations;

internal sealed class QuestionConfiguration : IEntityTypeConfiguration<Question>
{
    public void Configure(EntityTypeBuilder<Question> builder)
    {
        builder.ToTable("questions");
        builder.HasKey(q => q.Id);
        builder.Property(q => q.Id).ValueGeneratedNever();
        builder.Property(q => q.Text).IsRequired().HasMaxLength(Question.TextMaxLength);
        builder.Property(q => q.Explanation).IsRequired().HasMaxLength(Question.ExplanationMaxLength);
        builder.Property(q => q.Source).IsRequired().HasMaxLength(Question.SourceMaxLength);
        builder.Property(q => q.Type).HasConversion<string>().HasMaxLength(20);

        builder.HasOne<Topic>()
            .WithMany()
            .HasForeignKey(q => q.TopicId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(q => q.Choices)
            .WithOne()
            .HasForeignKey("QuestionId")
            .OnDelete(DeleteBehavior.Restrict);
        builder.Navigation(q => q.Choices).UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}
