package com.company.product.api.dto;

import com.company.product.api.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class UserManagementDtos {
    public record CreateTeacherRequest(@Email @NotBlank String email, @NotBlank String fullName, @NotBlank String password) {}
    public record CreateStudentRequest(@Email @NotBlank String email, @NotBlank String fullName, @NotBlank String password) {}
    public record CreateSubjectRequest(@NotBlank String code, @NotBlank String name) {}
    public record CreateTeachingAssignmentRequest(@NotNull Long teacherId, @NotNull Long subjectId, @NotNull Long groupId) {}
    public record UserItem(Long id, String email, String fullName, Role role, boolean active) {}
    public record GroupItem(Long id, String code, String name, int courseYear) {}
    public record SubjectItem(Long id, String code, String name) {}
    public record TeachingAssignmentItem(Long id, Long teacherId, String teacherName, Long subjectId, String subjectName, Long groupId, String groupCode, String groupName) {}
}
