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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Base64;

@Service
@RequiredArgsConstructor
public class AuthService {
    private static final long MAX_AVATAR_SIZE_BYTES = 2L * 1024L * 1024L;
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
        return toUser(appUserRepository.save(persistentUser));
    }

    public AuthDtos.UserResponse uploadAvatar(AppUser user, MultipartFile file) {
        AppUser persistentUser = appUserRepository.findById(user.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        if (file == null || file.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Файл не передан");
        }
        if (file.getSize() > MAX_AVATAR_SIZE_BYTES) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Размер фото не должен превышать 2 МБ");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Можно загрузить только изображение");
        }
        try {
            String base64 = Base64.getEncoder().encodeToString(file.getBytes());
            persistentUser.setAvatarUrl("data:" + contentType + ";base64," + base64);
            return toUser(appUserRepository.save(persistentUser));
        } catch (IOException e) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Не удалось прочитать файл");
        }
    }

    public AuthDtos.UserResponse removeAvatar(AppUser user) {
        AppUser persistentUser = appUserRepository.findById(user.getId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        persistentUser.setAvatarUrl(null);
        return toUser(appUserRepository.save(persistentUser));
    }

    private AuthDtos.UserResponse toUser(AppUser user) {
        return new AuthDtos.UserResponse(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getAvatarUrl());
    }
}
