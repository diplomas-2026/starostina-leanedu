package com.company.product.api.controller;

import com.company.product.api.dto.UserManagementDtos;
import com.company.product.api.service.CurrentUserService;
import com.company.product.api.service.UserManagementService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/groups")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('TEACHER','ADMIN','STUDENT')")
public class GroupController {
    private final UserManagementService userManagementService;
    private final CurrentUserService currentUserService;

    @GetMapping("/{groupId}/summary")
    public UserManagementDtos.GroupSummary summary(@PathVariable Long groupId) {
        return userManagementService.getGroupSummary(currentUserService.requireCurrentUser(), groupId);
    }
}
