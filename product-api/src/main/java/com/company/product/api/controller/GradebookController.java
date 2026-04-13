package com.company.product.api.controller;

import com.company.product.api.dto.TestDtos;
import com.company.product.api.service.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gradebook")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER','ADMIN')")
public class GradebookController {
    private final TestService testService;

    @GetMapping
    public List<TestDtos.GradebookItem> list() {
        return testService.listGradebook();
    }
}
