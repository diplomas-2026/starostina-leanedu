package com.company.product.api.dto;

import com.company.product.api.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record LoginRequest(@Email @NotBlank String email, @NotBlank String password) {}
    public record LoginResponse(String token, UserResponse user) {}
    public record UpdateProfileRequest(@NotBlank String fullName, @Size(max = 1024) String avatarUrl) {}
    public record UserResponse(Long id, String email, String fullName, Role role, String avatarUrl) {}
}
