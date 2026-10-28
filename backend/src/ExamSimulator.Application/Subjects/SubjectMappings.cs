namespace ExamSimulator.Application.Subjects;

public static class SubjectMappings
{
    public static SubjectSummaryDto ToDto(this SubjectWithCategory source) =>
        new(source.Subject.Id, source.Subject.Name, source.CategoryName);

    public static PagedResult<SubjectSummaryDto> ToDto(this PagedResult<SubjectWithCategory> source) =>
        new([.. source.Items.Select(i => i.ToDto())], source.Page, source.PageSize, source.TotalCount);
}
