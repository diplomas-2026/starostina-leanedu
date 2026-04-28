package com.company.product.api.controller;

import com.company.product.api.dto.LectureDtos;
import com.company.product.api.entity.AppUser;
import com.company.product.api.service.CurrentUserService;
import com.company.product.api.service.LectureService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lectures")
@RequiredArgsConstructor
public class LectureController {
    private final LectureService lectureService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public List<LectureDtos.LectureItem> list(@RequestParam(required = false) Long subjectId) {
        return lectureService.list(currentUserService.requireCurrentUser(), subjectId);
    }

    @GetMapping("/{id}")
    public LectureDtos.LectureItem getById(@PathVariable Long id) {
        return lectureService.getById(id, currentUserService.requireCurrentUser());
    }

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public LectureDtos.LectureItem create(@Valid @RequestBody LectureDtos.LectureRequest request) {
        AppUser user = currentUserService.requireCurrentUser();
        return lectureService.create(request, user);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public LectureDtos.LectureItem update(@PathVariable Long id, @Valid @RequestBody LectureDtos.LectureRequest request) {
        return lectureService.update(id, request, currentUserService.requireCurrentUser());
    }

    @PatchMapping("/{id}/publish")
    @PreAuthorize("hasRole('TEACHER')")
    public LectureDtos.LectureItem publish(@PathVariable Long id) {
        return lectureService.publish(id, currentUserService.requireCurrentUser());
    }
}
