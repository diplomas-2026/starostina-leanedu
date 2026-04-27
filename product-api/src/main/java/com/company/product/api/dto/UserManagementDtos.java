package com.company.product.api.dto;

import com.company.product.api.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class UserManagementDtos {
    public record CreateTeacherRequest(@Email @NotBlank String email, @NotBlank String fullName, @NotBlank String password) {}
    public record CreateStudentRequest(@Email @NotBlank String email, @NotBlank String fullName, @NotBlank String password) {}
    public record UserItem(Long id, String email, String fullName, Role role, boolean active) {}
    public record GroupItem(Long id, String code, String name, int courseYear) {}
}
