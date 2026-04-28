package com.company.product.api.controller;

import com.company.product.api.dto.TestDtos;
import com.company.product.api.entity.AppUser;
import com.company.product.api.service.CurrentUserService;
import com.company.product.api.service.TestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {
    private final TestService testService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public List<TestDtos.TestItem> list() {
        return testService.listTests(currentUserService.requireCurrentUser());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
    public TestDtos.TestDetailsItem details(@PathVariable Long id) {
        return testService.getTestDetails(id);
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public TestDtos.TestItem create(@Valid @RequestBody TestDtos.CreateTestRequest request) {
        return testService.createTest(request, currentUserService.requireCurrentUser());
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('TEACHER')")
    public void publish(@PathVariable Long id) {
        testService.publishTest(id);
    }

    @PostMapping("/{id}/questions")
    @PreAuthorize("hasRole('TEACHER')")
    public void addQuestion(@PathVariable Long id, @Valid @RequestBody TestDtos.AddQuestionRequest request) {
        testService.addQuestion(id, request);
    }

    @PostMapping("/{id}/assignments")
    @PreAuthorize("hasRole('TEACHER')")
    public void assign(@PathVariable Long id, @Valid @RequestBody TestDtos.AssignTestRequest request) {
        testService.assignTest(id, request);
    }

    @PostMapping("/{id}/attempts/start")
    @PreAuthorize("hasRole('STUDENT')")
    public TestDtos.AttemptItem startAttempt(@PathVariable Long id) {
        AppUser student = currentUserService.requireCurrentUser();
        return testService.startAttempt(id, student);
    }

    @PostMapping("/attempts/{attemptId}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public TestDtos.AttemptItem submitAttempt(@PathVariable Long attemptId, @Valid @RequestBody TestDtos.SubmitAttemptRequest request) {
        return testService.submitAttempt(attemptId, request, currentUserService.requireCurrentUser());
    }

    @GetMapping("/attempts/my")
    @PreAuthorize("hasRole('STUDENT')")
    public List<TestDtos.AttemptItem> myAttempts() {
        return testService.listMyAttempts(currentUserService.requireCurrentUser());
    }
}
