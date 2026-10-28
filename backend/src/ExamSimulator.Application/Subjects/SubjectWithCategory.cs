using ExamSimulator.Domain.Subjects;

namespace ExamSimulator.Application.Subjects;

public sealed record SubjectWithCategory(Subject Subject, string CategoryName);
