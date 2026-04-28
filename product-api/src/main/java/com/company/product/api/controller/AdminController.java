package com.company.product.api.controller;

import com.company.product.api.dto.UserManagementDtos;
import com.company.product.api.entity.Role;
import com.company.product.api.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {
    private final UserManagementService userManagementService;

    @PostMapping("/teachers")
    public UserManagementDtos.UserItem createTeacher(@Valid @RequestBody UserManagementDtos.CreateTeacherRequest request) {
        return userManagementService.createTeacher(request);
    }

    @GetMapping("/users")
    public List<UserManagementDtos.UserItem> listUsers(@RequestParam(required = false) Role role) {
        return userManagementService.listUsers(role);
    }

    @PostMapping("/students")
    public UserManagementDtos.UserItem createStudent(@Valid @RequestBody UserManagementDtos.CreateStudentRequest request) {
        return userManagementService.createStudent(request);
    }

    @GetMapping("/groups")
    public List<UserManagementDtos.GroupItem> listGroups() {
        return userManagementService.listGroups();
    }

    @PostMapping("/subjects")
    public UserManagementDtos.SubjectItem createSubject(@Valid @RequestBody UserManagementDtos.CreateSubjectRequest request) {
        return userManagementService.createSubject(request);
    }

    @GetMapping("/subjects")
    public List<UserManagementDtos.SubjectItem> listSubjects() {
        return userManagementService.listSubjects();
    }

    @PostMapping("/teaching-assignments")
    public UserManagementDtos.TeachingAssignmentItem createTeachingAssignment(@Valid @RequestBody UserManagementDtos.CreateTeachingAssignmentRequest request) {
        return userManagementService.createTeachingAssignment(request);
    }

    @GetMapping("/teaching-assignments")
    public List<UserManagementDtos.TeachingAssignmentItem> listTeachingAssignments() {
        return userManagementService.listTeachingAssignments();
    }

    @PostMapping("/groups/{groupId}/students/{studentId}")
    public void addStudentToGroup(@PathVariable Long groupId, @PathVariable Long studentId) {
        userManagementService.addStudentToGroup(groupId, studentId);
    }

    @GetMapping("/groups/{groupId}/students")
    public List<UserManagementDtos.UserItem> listGroupStudents(@PathVariable Long groupId) {
        return userManagementService.listStudentsInGroup(groupId);
    }
}
