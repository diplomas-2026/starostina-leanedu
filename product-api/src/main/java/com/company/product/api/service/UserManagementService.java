package com.company.product.api.service;

import com.company.product.api.dto.UserManagementDtos;
import com.company.product.api.entity.AppUser;
import com.company.product.api.entity.GroupEntity;
import com.company.product.api.entity.GroupStudent;
import com.company.product.api.entity.Role;
import com.company.product.api.repository.AppUserRepository;
import com.company.product.api.repository.GroupRepository;
import com.company.product.api.repository.GroupStudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserManagementService {
    private final AppUserRepository appUserRepository;
    private final GroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementDtos.UserItem createTeacher(UserManagementDtos.CreateTeacherRequest request) {
        return createUser(request.email(), request.fullName(), request.password(), Role.TEACHER);
    }

    public UserManagementDtos.UserItem createStudent(UserManagementDtos.CreateStudentRequest request) {
        return createUser(request.email(), request.fullName(), request.password(), Role.STUDENT);
    }

    public void addStudentToGroup(Long groupId, Long studentId) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
        AppUser student = appUserRepository.findById(studentId)
            .filter(u -> u.getRole() == Role.STUDENT)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Студент не найден"));
        if (!groupStudentRepository.existsByGroupAndStudent(group, student)) {
            GroupStudent gs = new GroupStudent();
            gs.setGroup(group);
            gs.setStudent(student);
            groupStudentRepository.save(gs);
        }
    }

    public List<UserManagementDtos.UserItem> listUsers(Role role) {
        List<AppUser> users = role == null ? appUserRepository.findAll() : appUserRepository.findByRole(role);
        return users.stream().map(this::toItem).toList();
    }

    private UserManagementDtos.UserItem createUser(String email, String fullName, String password, Role role) {
        if (appUserRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Пользователь с таким email уже существует");
        }
        AppUser user = new AppUser();
        user.setEmail(email.toLowerCase());
        user.setFullName(fullName);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActive(true);
        return toItem(appUserRepository.save(user));
    }

    private UserManagementDtos.UserItem toItem(AppUser user) {
        return new UserManagementDtos.UserItem(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.isActive());
    }
}
