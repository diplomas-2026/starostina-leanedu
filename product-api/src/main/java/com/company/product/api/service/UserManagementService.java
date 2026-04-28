package com.company.product.api.service;

import com.company.product.api.dto.UserManagementDtos;
import com.company.product.api.entity.AppUser;
import com.company.product.api.entity.GroupEntity;
import com.company.product.api.entity.GroupStudent;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.Subject;
import com.company.product.api.entity.TeachingAssignment;
import com.company.product.api.entity.AttemptStatus;
import com.company.product.api.entity.TestAttempt;
import com.company.product.api.repository.AppUserRepository;
import com.company.product.api.repository.GroupRepository;
import com.company.product.api.repository.GroupStudentRepository;
import com.company.product.api.repository.LectureRepository;
import com.company.product.api.repository.LearningTestRepository;
import com.company.product.api.repository.SubjectRepository;
import com.company.product.api.repository.TeachingAssignmentRepository;
import com.company.product.api.repository.TestAssignmentRepository;
import com.company.product.api.repository.TestAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserManagementService {
    private final AppUserRepository appUserRepository;
    private final GroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final LectureRepository lectureRepository;
    private final LearningTestRepository learningTestRepository;
    private final SubjectRepository subjectRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;
    private final TestAssignmentRepository testAssignmentRepository;
    private final TestAttemptRepository testAttemptRepository;
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
            .sorted(Comparator.comparing(GroupEntity::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(group -> new UserManagementDtos.GroupItem(
                group.getId(),
                group.getCode(),
                group.getName(),
                group.getCourseYear()
            ))
            .toList();
    }

    public UserManagementDtos.SubjectItem createSubject(UserManagementDtos.CreateSubjectRequest request) {
        if (subjectRepository.findByCodeIgnoreCase(request.code()).isPresent()) {
            throw new ApiException(HttpStatus.CONFLICT, "Дисциплина с таким кодом уже существует");
        }
        Subject subject = new Subject();
        subject.setCode(request.code().trim());
        subject.setName(request.name().trim());
        return toSubjectItem(subjectRepository.save(subject));
    }

    public List<UserManagementDtos.SubjectItem> listSubjects() {
        return subjectRepository.findAll().stream()
            .sorted(Comparator.comparing(Subject::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(this::toSubjectItem)
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

    public List<UserManagementDtos.GroupItem> listGroupsForTeacherBySubject(AppUser teacher, Long subjectId) {
        Subject subject = subjectRepository.findById(subjectId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Дисциплина не найдена"));
        return teachingAssignmentRepository.findByTeacherAndSubject(teacher, subject).stream()
            .map(TeachingAssignment::getGroup)
            .distinct()
            .sorted(Comparator.comparing(GroupEntity::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(group -> new UserManagementDtos.GroupItem(group.getId(), group.getCode(), group.getName(), group.getCourseYear()))
            .toList();
    }

    public List<UserManagementDtos.GroupItem> listGroupsForTeacher(AppUser teacher) {
        return teachingAssignmentRepository.findByTeacher(teacher).stream()
            .map(TeachingAssignment::getGroup)
            .distinct()
            .sorted(Comparator.comparing(GroupEntity::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(group -> new UserManagementDtos.GroupItem(group.getId(), group.getCode(), group.getName(), group.getCourseYear()))
            .toList();
    }

    public List<UserManagementDtos.UserItem> listStudentsInTeacherGroup(AppUser teacher, Long groupId) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
        if (!teachingAssignmentRepository.existsByTeacherAndGroup(teacher, group)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Преподаватель не назначен на выбранную группу");
        }
        return groupStudentRepository.findByGroup(group).stream()
            .map(GroupStudent::getStudent)
            .distinct()
            .sorted((a, b) -> a.getFullName().compareToIgnoreCase(b.getFullName()))
            .map(this::toItem)
            .toList();
    }

    public List<UserManagementDtos.UserItem> listStudentsInGroup(Long groupId) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
        return groupStudentRepository.findByGroup(group).stream()
            .map(GroupStudent::getStudent)
            .distinct()
            .sorted((a, b) -> a.getFullName().compareToIgnoreCase(b.getFullName()))
            .map(this::toItem)
            .toList();
    }

    public UserManagementDtos.TeacherDashboardSummary getTeacherDashboardSummary(AppUser teacher) {
        List<TeachingAssignment> assignments = teachingAssignmentRepository.findByTeacher(teacher);
        List<GroupEntity> groups = assignments.stream()
            .map(TeachingAssignment::getGroup)
            .distinct()
            .toList();
        List<Subject> subjects = assignments.stream()
            .map(TeachingAssignment::getSubject)
            .distinct()
            .toList();

        int studentsCount = groups.stream()
            .flatMap(group -> groupStudentRepository.findByGroup(group).stream())
            .map(GroupStudent::getStudent)
            .map(AppUser::getId)
            .distinct()
            .toList()
            .size();

        int testsCount = (int) learningTestRepository.findAll().stream()
            .filter(test -> test.getCreatedBy() != null && test.getCreatedBy().getId().equals(teacher.getId()))
            .count();

        int lecturesCount = lectureRepository.findByCreatedBy(teacher).size();

        List<TestAttempt> submittedAttempts = testAttemptRepository.findAll().stream()
            .filter(attempt -> attempt.getStatus() == AttemptStatus.SUBMITTED)
            .filter(attempt -> attempt.getTest().getCreatedBy() != null && attempt.getTest().getCreatedBy().getId().equals(teacher.getId()))
            .toList();

        int passed = (int) submittedAttempts.stream()
            .filter(attempt -> attempt.getScore() >= attempt.getTest().getMinScore3())
            .count();
        int passRate = submittedAttempts.isEmpty() ? 0 : (int) Math.round((passed * 100.0) / submittedAttempts.size());

        List<UserManagementDtos.TeacherGroupDashboardItem> groupItems = groups.stream()
            .sorted(Comparator.comparing(GroupEntity::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(group -> {
                int groupStudents = (int) groupStudentRepository.findByGroup(group).stream()
                    .map(GroupStudent::getStudent)
                    .map(AppUser::getId)
                    .distinct()
                    .count();

                int assignedTests = (int) testAssignmentRepository.findByGroupAndActiveTrue(group).stream()
                    .filter(assignment -> assignment.getTest().getCreatedBy() != null
                        && assignment.getTest().getCreatedBy().getId().equals(teacher.getId()))
                    .map(assignment -> assignment.getTest().getId())
                    .distinct()
                    .count();

                return new UserManagementDtos.TeacherGroupDashboardItem(
                    group.getId(),
                    group.getCode(),
                    group.getName(),
                    groupStudents,
                    assignedTests
                );
            })
            .toList();

        return new UserManagementDtos.TeacherDashboardSummary(
            lecturesCount,
            testsCount,
            groups.size(),
            subjects.size(),
            studentsCount,
            submittedAttempts.size(),
            passRate,
            groupItems
        );
    }

    public UserManagementDtos.TeachingAssignmentItem createTeachingAssignment(UserManagementDtos.CreateTeachingAssignmentRequest request) {
        AppUser teacher = appUserRepository.findById(request.teacherId())
            .filter(user -> user.getRole() == Role.TEACHER)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Преподаватель не найден"));
        Subject subject = subjectRepository.findById(request.subjectId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Дисциплина не найдена"));
        GroupEntity group = groupRepository.findById(request.groupId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));

        if (teachingAssignmentRepository.existsByTeacherAndGroupAndSubject(teacher, group, subject)) {
            throw new ApiException(HttpStatus.CONFLICT, "Такое назначение уже существует");
        }

        TeachingAssignment assignment = new TeachingAssignment();
        assignment.setTeacher(teacher);
        assignment.setSubject(subject);
        assignment.setGroup(group);
        return toTeachingAssignmentItem(teachingAssignmentRepository.save(assignment));
    }

    public List<UserManagementDtos.TeachingAssignmentItem> listTeachingAssignments() {
        return teachingAssignmentRepository.findAll().stream()
            .sorted(Comparator
                .comparing((TeachingAssignment ta) -> ta.getTeacher().getFullName(), String::compareToIgnoreCase)
                .thenComparing(ta -> ta.getSubject().getCode(), Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(ta -> ta.getGroup().getCode(), Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(this::toTeachingAssignmentItem)
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
        return new UserManagementDtos.UserItem(user.getId(), user.getEmail(), user.getFullName(), user.getRole());
    }

    private UserManagementDtos.SubjectItem toSubjectItem(Subject subject) {
        return new UserManagementDtos.SubjectItem(subject.getId(), subject.getCode(), subject.getName());
    }

    private UserManagementDtos.TeachingAssignmentItem toTeachingAssignmentItem(TeachingAssignment assignment) {
        return new UserManagementDtos.TeachingAssignmentItem(
            assignment.getId(),
            assignment.getTeacher().getId(),
            assignment.getTeacher().getFullName(),
            assignment.getSubject().getId(),
            assignment.getSubject().getName(),
            assignment.getGroup().getId(),
            assignment.getGroup().getCode(),
            assignment.getGroup().getName()
        );
    }
}
