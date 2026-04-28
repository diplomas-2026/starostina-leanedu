package com.company.product.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LectureDtos {
    public record LectureRequest(@NotBlank String title, @NotBlank String summary, @NotBlank String content, @NotNull Long subjectId) {}
    public record LectureTestItem(Long id, String title, String description, boolean published) {}
    public record LectureItem(
        Long id,
        String title,
        String summary,
        String content,
        boolean published,
        String createdBy,
        Long subjectId,
        String subjectName,
        java.util.List<LectureTestItem> tests
    ) {}
}
