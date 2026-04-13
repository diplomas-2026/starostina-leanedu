package com.company.product.api.controller;

import com.company.product.api.dto.UserManagementDtos;
import com.company.product.api.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {
    private final UserManagementService userManagementService;

    @PostMapping("/students")
    public UserManagementDtos.UserItem createStudent(@Valid @RequestBody UserManagementDtos.CreateStudentRequest request) {
        return userManagementService.createStudent(request);
    }

    @PostMapping("/groups/{groupId}/students/{studentId}")
    public void addStudentToGroup(@PathVariable Long groupId, @PathVariable Long studentId) {
        userManagementService.addStudentToGroup(groupId, studentId);
    }
}
