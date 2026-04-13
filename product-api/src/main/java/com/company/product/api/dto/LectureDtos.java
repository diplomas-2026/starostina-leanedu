package com.company.product.api.dto;

import jakarta.validation.constraints.NotBlank;

public class LectureDtos {
    public record LectureRequest(@NotBlank String title, @NotBlank String summary, @NotBlank String content) {}
    public record LectureItem(Long id, String title, String summary, String content, boolean published, String createdBy) {}
}
