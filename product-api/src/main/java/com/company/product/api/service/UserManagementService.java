package com.company.product.api.service;

import com.company.product.api.dto.UserManagementDtos;
import com.company.product.api.entity.AppUser;
import com.company.product.api.entity.GroupEntity;
import com.company.product.api.entity.GroupStudent;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.Subject;
import com.company.product.api.entity.TeachingAssignment;
import com.company.product.api.repository.AppUserRepository;
import com.company.product.api.repository.GroupRepository;
import com.company.product.api.repository.GroupStudentRepository;
import com.company.product.api.repository.TeachingAssignmentRepository;
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
    private final TeachingAssignmentRepository teachingAssignmentRepository;
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

    public List<UserManagementDtos.UserItem> listStudents() {
        return appUserRepository.findByRole(Role.STUDENT).stream()
            .map(this::toItem)
            .toList();
    }

    public List<UserManagementDtos.GroupItem> listGroups() {
        return groupRepository.findAll().stream()
            .map(group -> new UserManagementDtos.GroupItem(
                group.getId(),
                group.getCode(),
                group.getName(),
                group.getCourseYear()
            ))
            .toList();
    }

    public List<UserManagementDtos.SubjectItem> listSubjectsForTeacher(AppUser teacher, Long groupId) {
        List<TeachingAssignment> assignments;
        if (groupId == null) {
            assignments = teachingAssignmentRepository.findByTeacher(teacher);
        } else {
            GroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
            assignments = teachingAssignmentRepository.findByTeacherAndGroup(teacher, group);
        }

        return assignments.stream()
            .map(TeachingAssignment::getSubject)
            .distinct()
            .sorted((a, b) -> {
                String left = a.getCode() == null ? "" : a.getCode().toLowerCase();
                String right = b.getCode() == null ? "" : b.getCode().toLowerCase();
                return left.compareTo(right);
            })
            .map(this::toSubjectItem)
            .toList();
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

    private UserManagementDtos.SubjectItem toSubjectItem(Subject subject) {
        return new UserManagementDtos.SubjectItem(subject.getId(), subject.getCode(), subject.getName());
    }
}
