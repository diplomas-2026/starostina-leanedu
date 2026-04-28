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

    @PutMapping("/users/{userId}")
    public UserManagementDtos.UserItem updateUser(@PathVariable Long userId, @Valid @RequestBody UserManagementDtos.UpdateUserRequest request) {
        return userManagementService.updateUser(userId, request);
    }

    @DeleteMapping("/users/{userId}")
    public void deactivateUser(@PathVariable Long userId) {
        userManagementService.deactivateUser(userId);
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

    @PutMapping("/subjects/{subjectId}")
    public UserManagementDtos.SubjectItem updateSubject(@PathVariable Long subjectId, @Valid @RequestBody UserManagementDtos.UpdateSubjectRequest request) {
        return userManagementService.updateSubject(subjectId, request);
    }

    @DeleteMapping("/subjects/{subjectId}")
    public void deleteSubject(@PathVariable Long subjectId) {
        userManagementService.deleteSubject(subjectId);
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

    @DeleteMapping("/teaching-assignments/{assignmentId}")
    public void deleteTeachingAssignment(@PathVariable Long assignmentId) {
        userManagementService.deleteTeachingAssignment(assignmentId);
    }

    @PostMapping("/groups/{groupId}/students/{studentId}")
    public void addStudentToGroup(@PathVariable Long groupId, @PathVariable Long studentId) {
        userManagementService.addStudentToGroup(groupId, studentId);
    }

    @DeleteMapping("/groups/{groupId}/students/{studentId}")
    public void removeStudentFromGroup(@PathVariable Long groupId, @PathVariable Long studentId) {
        userManagementService.removeStudentFromGroup(groupId, studentId);
    }

    @GetMapping("/groups/{groupId}/students")
    public List<UserManagementDtos.UserItem> listGroupStudents(@PathVariable Long groupId) {
        return userManagementService.listStudentsInGroup(groupId);
    }
}
