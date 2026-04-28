package com.company.product.api.controller;

import com.company.product.api.dto.AuthDtos;
import com.company.product.api.service.AuthService;
import com.company.product.api.service.CurrentUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService authService;
    private final CurrentUserService currentUserService;

    @PostMapping("/login")
    public AuthDtos.LoginResponse login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public AuthDtos.UserResponse me() {
        return authService.me(currentUserService.requireCurrentUser());
    }

    @PutMapping("/me/profile")
    public AuthDtos.UserResponse updateProfile(@Valid @RequestBody AuthDtos.UpdateProfileRequest request) {
        return authService.updateProfile(currentUserService.requireCurrentUser(), request);
    }

    @PostMapping("/me/avatar")
    public AuthDtos.UserResponse uploadAvatar(@RequestParam("file") MultipartFile file) {
        return authService.uploadAvatar(currentUserService.requireCurrentUser(), file);
    }

    @DeleteMapping("/me/avatar")
    public AuthDtos.UserResponse removeAvatar() {
        return authService.removeAvatar(currentUserService.requireCurrentUser());
    }
}
