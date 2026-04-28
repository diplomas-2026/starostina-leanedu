package com.company.product.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;

public class TestDtos {
    public record CreateTestRequest(
        @NotBlank String title,
        @NotBlank String description,
        @NotNull Long lectureId,
        @NotNull Long subjectId,
        @NotEmpty List<Long> groupIds,
        @NotNull OffsetDateTime dueAt,
        @NotNull @Min(1) Integer timeLimitMin,
        @NotNull @Min(1) Integer attemptsLimit,
        @NotNull @Min(0) Integer minScore3,
        @NotNull @Min(0) Integer minScore4,
        @NotNull @Min(0) Integer minScore5
    ) {}
    public record AssignTestRequest(@NotNull Long groupId, @NotNull OffsetDateTime dueAt) {}
    public record QuestionOptionRequest(@NotBlank String text, boolean correct) {}
    public record AddQuestionRequest(@NotBlank String text, @NotNull Integer points, @NotEmpty List<QuestionOptionRequest> options) {}
    public record SubmitAnswerRequest(Long questionId, Long selectedOptionId) {}
    public record SubmitAttemptRequest(@NotEmpty List<SubmitAnswerRequest> answers) {}
    public record TestItem(
        Long id,
        String title,
        String description,
        boolean published,
        Long subjectId,
        String subjectName,
        Integer minScore3,
        Integer minScore4,
        Integer minScore5
    ) {}
    public record AttemptItem(Long id, Long testId, String testTitle, Integer score, Integer maxScore, Integer grade, String status) {}
    public record GradebookItem(Long attemptId, String studentName, String testTitle, Integer score, Integer maxScore) {}
    public record GradebookGroupOption(Long id, String code, String name) {}
    public record GradebookSubjectOption(Long id, String code, String name) {}
    public record GradebookColumn(Long assignmentId, String testTitle, OffsetDateTime dueAt) {}
    public record GradebookCell(String status, Integer score, Integer maxScore, Integer grade) {}
    public record GradebookRow(Long studentId, String studentName, List<GradebookCell> cells) {}
    public record GradebookMatrix(
        Long groupId,
        String groupCode,
        String groupName,
        Long subjectId,
        String subjectCode,
        String subjectName,
        List<GradebookColumn> columns,
        List<GradebookRow> rows
    ) {}
    public record TestOptionItem(Long id, String text, boolean correct) {}
    public record AttemptOptionItem(Long id, String text) {}
    public record AttemptQuestionItem(Long id, String text, Integer points, Integer sortOrder, List<AttemptOptionItem> options) {}
    public record AttemptSessionItem(
        Long attemptId,
        Long testId,
        String testTitle,
        Integer timeLimitMin,
        OffsetDateTime startedAt,
        OffsetDateTime availableUntil,
        String status,
        Integer score,
        Integer maxScore,
        Integer grade,
        List<AttemptQuestionItem> questions
    ) {}
    public record TestQuestionItem(Long id, String text, Integer points, Integer sortOrder, List<TestOptionItem> options) {}
    public record TestAssignmentItem(Long assignmentId, Long groupId, String groupCode, String groupName, OffsetDateTime dueAt) {}
    public record TestDetailsItem(
        Long id,
        String title,
        String description,
        boolean published,
        Long subjectId,
        String subjectName,
        Integer timeLimitMin,
        Integer attemptsLimit,
        Integer minScore3,
        Integer minScore4,
        Integer minScore5,
        List<TestAssignmentItem> assignments,
        List<TestQuestionItem> questions
    ) {}
}
