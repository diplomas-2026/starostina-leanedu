package com.company.product.api.service;

import com.company.product.api.dto.AuthDtos;
import com.company.product.api.entity.AppUser;
import com.company.product.api.repository.AppUserRepository;
import com.company.product.api.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final AppUserRepository appUserRepository;
    private final JwtService jwtService;

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.email(), request.password())
        );

        AppUser user = appUserRepository.findByEmailIgnoreCase(request.email())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Неверный логин или пароль"));

        String token = jwtService.generateToken(user.getId(), user.getEmail(), user.getRole());
        return new AuthDtos.LoginResponse(token, toUser(user));
    }

    public AuthDtos.UserResponse me(AppUser user) {
        return toUser(user);
    }

    public AuthDtos.UserResponse updateProfile(AppUser user, AuthDtos.UpdateProfileRequest request) {
        AppUser persistentUser = appUserRepository.findById(user.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        persistentUser.setFullName(request.fullName().trim());
        String avatar = request.avatarUrl() == null ? null : request.avatarUrl().trim();
        persistentUser.setAvatarUrl(avatar == null || avatar.isEmpty() ? null : avatar);
        return toUser(appUserRepository.save(persistentUser));
    }

    private AuthDtos.UserResponse toUser(AppUser user) {
        return new AuthDtos.UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getAvatarUrl());
    }
}
