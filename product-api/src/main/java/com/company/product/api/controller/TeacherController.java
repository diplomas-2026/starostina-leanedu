package com.company.product.api.controller;

import com.company.product.api.dto.UserManagementDtos;
import com.company.product.api.service.CurrentUserService;
import com.company.product.api.service.UserManagementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {
    private final UserManagementService userManagementService;
    private final CurrentUserService currentUserService;

    @PostMapping("/students")
    public UserManagementDtos.UserItem createStudent(@Valid @RequestBody UserManagementDtos.CreateStudentRequest request) {
        return userManagementService.createStudent(request);
    }

    @GetMapping("/students")
    public List<UserManagementDtos.UserItem> listStudents() {
        return userManagementService.listStudents();
    }

    @GetMapping("/groups")
    public List<UserManagementDtos.GroupItem> listGroups(@RequestParam(required = false) Long subjectId) {
        if (subjectId == null) {
            return userManagementService.listGroups();
        }
        return userManagementService.listGroupsForTeacherBySubject(currentUserService.requireCurrentUser(), subjectId);
    }

    @GetMapping("/subjects")
    public List<UserManagementDtos.SubjectItem> listSubjects(@RequestParam(required = false) Long groupId) {
        return userManagementService.listSubjectsForTeacher(currentUserService.requireCurrentUser(), groupId);
    }

    @GetMapping("/disciplines")
    public List<UserManagementDtos.SubjectItem> listDisciplines(@RequestParam(required = false) Long groupId) {
        return userManagementService.listSubjectsForTeacher(currentUserService.requireCurrentUser(), groupId);
    }

    @PostMapping("/groups/{groupId}/students/{studentId}")
    public void addStudentToGroup(@PathVariable Long groupId, @PathVariable Long studentId) {
        userManagementService.addStudentToGroup(groupId, studentId);
    }
}
