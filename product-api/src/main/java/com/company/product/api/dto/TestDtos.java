package com.company.product.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.List;

public class TestDtos {
    public record CreateTestRequest(@NotBlank String title, @NotBlank String description, Long lectureId, @NotNull Integer timeLimitMin, @NotNull Integer attemptsLimit) {}
    public record AssignTestRequest(@NotNull Long groupId, @NotNull OffsetDateTime dueAt) {}
    public record QuestionOptionRequest(@NotBlank String text, boolean correct) {}
    public record AddQuestionRequest(@NotBlank String text, @NotNull Integer points, @NotEmpty List<QuestionOptionRequest> options) {}
    public record SubmitAnswerRequest(Long questionId, Long selectedOptionId) {}
    public record SubmitAttemptRequest(@NotEmpty List<SubmitAnswerRequest> answers) {}
    public record TestItem(Long id, String title, String description, boolean published) {}
    public record AttemptItem(Long id, Long testId, String testTitle, Integer score, Integer maxScore, String status) {}
    public record GradebookItem(Long attemptId, String studentName, String testTitle, Integer score, Integer maxScore) {}
    public record GradebookGroupOption(Long id, String code, String name) {}
    public record GradebookColumn(Long assignmentId, String testTitle, OffsetDateTime dueAt) {}
    public record GradebookCell(String status, Integer score, Integer maxScore) {}
    public record GradebookRow(Long studentId, String studentName, List<GradebookCell> cells) {}
    public record GradebookMatrix(Long groupId, String groupCode, String groupName, List<GradebookColumn> columns, List<GradebookRow> rows) {}
}
