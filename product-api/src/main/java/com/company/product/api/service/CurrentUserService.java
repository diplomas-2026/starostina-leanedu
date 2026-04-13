package com.company.product.api.service;

import com.company.product.api.entity.AppUser;
import com.company.product.api.repository.AppUserRepository;
import com.company.product.api.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CurrentUserService {
    private final AppUserRepository appUserRepository;

    public AppUser requireCurrentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (!(principal instanceof UserPrincipal userPrincipal)) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Пользователь не авторизован");
        }
        return appUserRepository.findById(userPrincipal.getUser().getId())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Пользователь не найден"));
    }
}
