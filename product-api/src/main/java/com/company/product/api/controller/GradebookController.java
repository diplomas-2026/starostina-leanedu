package com.company.product.api.controller;

import com.company.product.api.dto.TestDtos;
import com.company.product.api.service.TestService;
import com.company.product.api.service.CurrentUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gradebook")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
public class GradebookController {
    private final TestService testService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public List<TestDtos.GradebookItem> list() {
        return testService.listGradebook();
    }

    @GetMapping("/groups")
    public List<TestDtos.GradebookGroupOption> groups() {
        return testService.listGradebookGroups(currentUserService.requireCurrentUser());
    }

    @GetMapping("/subjects")
    public List<TestDtos.GradebookSubjectOption> subjects(@RequestParam Long groupId) {
        return testService.listGradebookSubjects(groupId, currentUserService.requireCurrentUser());
    }

    @GetMapping("/matrix")
    public TestDtos.GradebookMatrix matrix(@RequestParam Long groupId, @RequestParam Long subjectId) {
        return testService.getGradebookMatrix(groupId, subjectId, currentUserService.requireCurrentUser());
    }
}
