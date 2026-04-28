package com.company.product.api.controller;

import com.company.product.api.dto.UserManagementDtos;
import com.company.product.api.service.CurrentUserService;
import com.company.product.api.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/teacher")
@RequiredArgsConstructor
@PreAuthorize("hasRole('TEACHER')")
public class TeacherController {
    private final UserManagementService userManagementService;
    private final CurrentUserService currentUserService;

    @GetMapping("/groups")
    public List<UserManagementDtos.GroupItem> listGroups(@RequestParam(required = false) Long subjectId) {
        if (subjectId == null) {
            return userManagementService.listGroupsForTeacher(currentUserService.requireCurrentUser());
        }
        return userManagementService.listGroupsForTeacherBySubject(currentUserService.requireCurrentUser(), subjectId);
    }

    @GetMapping("/groups/{groupId}/students")
    public List<UserManagementDtos.UserItem> listGroupStudents(@PathVariable Long groupId) {
        return userManagementService.listStudentsInTeacherGroup(currentUserService.requireCurrentUser(), groupId);
    }

    @GetMapping("/subjects")
    public List<UserManagementDtos.SubjectItem> listSubjects(@RequestParam(required = false) Long groupId) {
        return userManagementService.listSubjectsForTeacher(currentUserService.requireCurrentUser(), groupId);
    }

    @GetMapping("/disciplines")
    public List<UserManagementDtos.SubjectItem> listDisciplines(@RequestParam(required = false) Long groupId) {
        return userManagementService.listSubjectsForTeacher(currentUserService.requireCurrentUser(), groupId);
    }

    @GetMapping("/dashboard-summary")
    public UserManagementDtos.TeacherDashboardSummary dashboardSummary() {
        return userManagementService.getTeacherDashboardSummary(currentUserService.requireCurrentUser());
    }
}
