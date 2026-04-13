package com.company.product.api.controller;

import com.company.product.api.dto.AiDtos;
import com.company.product.api.entity.LearningTest;
import com.company.product.api.service.AiService;
import com.company.product.api.service.CurrentUserService;
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
    public Long generate(@PathVariable Long lectureId) {
        LearningTest test = aiService.generateDraftFromLecture(lectureId, currentUserService.requireCurrentUser());
        return test.getId();
    }
}
