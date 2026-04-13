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
}
