package com.company.product.api.controller;

import com.company.product.api.dto.AiDtos;
import com.company.product.api.entity.LearningTest;
import com.company.product.api.service.AiService;
import com.company.product.api.service.CurrentUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {
    private final AiService aiService;
    private final CurrentUserService currentUserService;

    @GetMapping("/limits")
    public AiDtos.AiLimitsResponse limits() {
        return aiService.getLimits();
    }

    @PostMapping("/generate-test-from-lecture/{lectureId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Long generate(@PathVariable Long lectureId, @Valid @RequestBody AiDtos.AiPromptRequest request) {
        LearningTest test = aiService.generateDraftFromLecture(lectureId, currentUserService.requireCurrentUser(), request.teacherPrompt());
        return test.getId();
    }

    @PostMapping("/generate-questions-for-test/{testId}")
    @PreAuthorize("hasRole('TEACHER')")
    public Integer generateQuestionsForTest(@PathVariable Long testId, @Valid @RequestBody AiDtos.AiPromptRequest request) {
        return aiService.generateQuestionsForExistingTest(testId, currentUserService.requireCurrentUser(), request.teacherPrompt());
    }
}
