package com.company.product.api.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.OffsetDateTime;
import java.util.List;

public class AiDtos {
    public record AiLimitsResponse(int dailyLimit, int usedToday, int remaining, OffsetDateTime resetsAt) {}
    public record AiPromptRequest(@NotBlank String teacherPrompt) {}

    public record GeneratedQuestion(String text, int points, List<GeneratedOption> options, String explanation) {}
    public record GeneratedOption(String text, boolean correct) {}
    public record GeneratedTestDraft(String title, String description, List<GeneratedQuestion> questions) {}
}
