package com.company.product.api.service;

import com.company.product.api.dto.UserManagementDtos;
import com.company.product.api.entity.AppUser;
import com.company.product.api.entity.LearningTest;
import com.company.product.api.entity.Lecture;
import com.company.product.api.entity.GroupEntity;
import com.company.product.api.entity.GroupStudent;
import com.company.product.api.entity.Role;
import com.company.product.api.entity.Subject;
import com.company.product.api.entity.TeachingAssignment;
import com.company.product.api.entity.TestAssignment;
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

import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

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

    public UserManagementDtos.UserItem updateUser(Long userId, UserManagementDtos.UpdateUserRequest request) {
        AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        appUserRepository.findByEmailIgnoreCase(request.email())
            .filter(existing -> !existing.getId().equals(user.getId()))
            .ifPresent(existing -> {
                throw new ApiException(HttpStatus.CONFLICT, "Пользователь с таким email уже существует");
            });
        user.setEmail(request.email().toLowerCase().trim());
        user.setFullName(request.fullName().trim());
        if (request.password() != null && !request.password().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(request.password()));
        }
        return toItem(appUserRepository.save(user));
    }

    public void deactivateUser(Long userId) {
        AppUser user = appUserRepository.findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Пользователь не найден"));
        if (user.getRole() == Role.ADMIN) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Удаление администратора запрещено");
        }
        if (user.getRole() == Role.TEACHER) {
            teachingAssignmentRepository.deleteByTeacher(user);
        }
        if (user.getRole() == Role.STUDENT) {
            groupStudentRepository.deleteByStudent(user);
        }
        user.setActive(false);
        appUserRepository.save(user);
    }

    public void addStudentToGroup(Long groupId, Long studentId) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
        AppUser student = appUserRepository.findById(studentId)
            .filter(u -> u.getRole() == Role.STUDENT)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Студент не найден"));

        List<GroupStudent> memberships = groupStudentRepository.findByStudent(student);
        boolean alreadyInThisGroup = memberships.stream()
            .anyMatch(membership -> membership.getGroup().getId().equals(group.getId()));
        if (!alreadyInThisGroup && !memberships.isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "Студент уже состоит в другой группе");
        }

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

    public UserManagementDtos.GroupItem createGroup(UserManagementDtos.CreateGroupRequest request) {
        groupRepository.findByCodeIgnoreCase(request.code().trim())
            .ifPresent(existing -> {
                throw new ApiException(HttpStatus.CONFLICT, "Группа с таким кодом уже существует");
            });
        GroupEntity group = new GroupEntity();
        group.setCode(request.code().trim());
        group.setName(request.name().trim());
        group.setCourseYear(request.courseYear());
        group = groupRepository.save(group);
        return new UserManagementDtos.GroupItem(group.getId(), group.getCode(), group.getName(), group.getCourseYear());
    }

    public UserManagementDtos.GroupItem updateGroup(Long groupId, UserManagementDtos.UpdateGroupRequest request) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
        groupRepository.findByCodeIgnoreCase(request.code().trim())
            .filter(existing -> !existing.getId().equals(group.getId()))
            .ifPresent(existing -> {
                throw new ApiException(HttpStatus.CONFLICT, "Группа с таким кодом уже существует");
            });
        group.setCode(request.code().trim());
        group.setName(request.name().trim());
        group.setCourseYear(request.courseYear());
        group = groupRepository.save(group);
        return new UserManagementDtos.GroupItem(group.getId(), group.getCode(), group.getName(), group.getCourseYear());
    }

    public void deleteGroup(Long groupId) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
        long students = groupStudentRepository.findByGroup(group).size();
        long teachingAssignments = teachingAssignmentRepository.countByGroup(group);
        long testAssignments = testAssignmentRepository.countByGroup(group);
        if (students > 0 || teachingAssignments > 0 || testAssignments > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Нельзя удалить группу, потому что в ней есть студенты или назначения");
        }
        teachingAssignmentRepository.deleteByGroup(group);
        groupRepository.delete(group);
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

    public UserManagementDtos.SubjectItem updateSubject(Long subjectId, UserManagementDtos.UpdateSubjectRequest request) {
        Subject subject = subjectRepository.findById(subjectId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Дисциплина не найдена"));
        subjectRepository.findByCodeIgnoreCase(request.code())
            .filter(existing -> !existing.getId().equals(subject.getId()))
            .ifPresent(existing -> {
                throw new ApiException(HttpStatus.CONFLICT, "Дисциплина с таким кодом уже существует");
            });
        subject.setCode(request.code().trim());
        subject.setName(request.name().trim());
        return toSubjectItem(subjectRepository.save(subject));
    }

    public void deleteSubject(Long subjectId) {
        Subject subject = subjectRepository.findById(subjectId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Дисциплина не найдена"));
        long usedInLectures = lectureRepository.countBySubject(subject);
        long usedInTests = learningTestRepository.countBySubject(subject);
        long usedInAssignments = testAssignmentRepository.countByTestSubject(subject);
        if (usedInLectures > 0 || usedInTests > 0 || usedInAssignments > 0) {
            throw new ApiException(HttpStatus.CONFLICT, "Нельзя удалить дисциплину, потому что она уже используется в лекциях или тестах");
        }
        teachingAssignmentRepository.deleteBySubject(subject);
        subjectRepository.delete(subject);
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

    public UserManagementDtos.StudentSummary getStudentSummary(AppUser actor, Long studentId) {
        AppUser student = appUserRepository.findById(studentId)
            .filter(u -> u.getRole() == Role.STUDENT)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Студент не найден"));

        List<GroupStudent> memberships = groupStudentRepository.findByStudent(student);
        if (actor.getRole() == Role.STUDENT && !actor.getId().equals(student.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Недостаточно прав");
        }
        if (actor.getRole() == Role.TEACHER) {
            boolean allowed = memberships.stream()
                .map(GroupStudent::getGroup)
                .anyMatch(group -> teachingAssignmentRepository.existsByTeacherAndGroup(actor, group));
            if (!allowed) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Преподаватель не назначен на группы этого студента");
            }
        }

        List<UserManagementDtos.StudentGroupItem> groups = memberships.stream()
            .map(GroupStudent::getGroup)
            .distinct()
            .sorted(Comparator.comparing(GroupEntity::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(group -> new UserManagementDtos.StudentGroupItem(group.getId(), group.getCode(), group.getName(), group.getCourseYear()))
            .toList();

        List<TestAttempt> attempts = testAttemptRepository.findByStudentOrderByStartedAtDesc(student);
        List<TestAttempt> submitted = attempts.stream()
            .filter(attempt -> attempt.getStatus() == AttemptStatus.SUBMITTED)
            .toList();

        int avgGrade = submitted.isEmpty()
            ? 0
            : (int) Math.round(submitted.stream()
                .mapToInt(attempt -> resolveGrade(attempt.getTest().getMinScore3(), attempt.getTest().getMinScore4(), attempt.getTest().getMinScore5(), attempt.getScore()))
                .average()
                .orElse(0));

        List<UserManagementDtos.StudentAttemptItem> recentAttempts = attempts.stream()
            .limit(10)
            .map(attempt -> new UserManagementDtos.StudentAttemptItem(
                attempt.getId(),
                attempt.getTest().getId(),
                attempt.getTest().getTitle(),
                attempt.getTest().getSubject() != null ? attempt.getTest().getSubject().getName() : null,
                attempt.getStatus().name(),
                attempt.getScore(),
                attempt.getMaxScore(),
                attempt.getStatus() == AttemptStatus.SUBMITTED
                    ? resolveGrade(attempt.getTest().getMinScore3(), attempt.getTest().getMinScore4(), attempt.getTest().getMinScore5(), attempt.getScore())
                    : null,
                attempt.getSubmittedAt() != null ? attempt.getSubmittedAt().toString() : null
            ))
            .toList();

        return new UserManagementDtos.StudentSummary(
            student.getId(),
            student.getFullName(),
            student.getEmail(),
            student.getAvatarUrl(),
            groups.size(),
            submitted.size(),
            avgGrade,
            groups,
            recentAttempts
        );
    }

    public List<UserManagementDtos.StudentDisciplineItem> listStudentDisciplines(AppUser student) {
        GroupEntity group = requireStudentGroup(student);
        return teachingAssignmentRepository.findByGroup(group).stream()
            .sorted(Comparator
                .comparing((TeachingAssignment ta) -> ta.getSubject().getCode(), Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(ta -> ta.getTeacher().getFullName(), String::compareToIgnoreCase))
            .map(assignment -> new UserManagementDtos.StudentDisciplineItem(
                assignment.getSubject().getId(),
                assignment.getSubject().getCode(),
                assignment.getSubject().getName(),
                assignment.getTeacher().getId(),
                assignment.getTeacher().getFullName(),
                group.getId(),
                group.getCode(),
                group.getName(),
                calculateDisciplineGrade(student, group, assignment.getSubject())
            ))
            .toList();
    }

    public UserManagementDtos.StudentDisciplineDetails getStudentDisciplineDetails(AppUser student, Long subjectId) {
        GroupEntity group = requireStudentGroup(student);
        TeachingAssignment assignment = teachingAssignmentRepository.findByGroup(group).stream()
            .filter(item -> item.getSubject().getId().equals(subjectId))
            .findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Дисциплина не найдена в вашей группе"));

        Subject subject = assignment.getSubject();
        List<Lecture> lectures = lectureRepository.findByPublishedTrueAndSubject(subject);

        List<UserManagementDtos.StudentLectureProgressItem> lectureItems = lectures.stream()
            .sorted(Comparator.comparing(Lecture::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
            .map(lecture -> {
                List<LearningTest> lectureTests = learningTestRepository.findByLectureId(lecture.getId()).stream()
                    .filter(LearningTest::isPublished)
                    .toList();

                Map<Long, UserManagementDtos.StudentLectureTestItem> testMap = new LinkedHashMap<>();
                for (LearningTest lectureTest : lectureTests) {
                    boolean assigned = testAssignmentRepository.findByGroupAndActiveTrue(group).stream()
                        .anyMatch(testAssignment -> testAssignment.getTest().getId().equals(lectureTest.getId()));
                    if (!assigned) {
                        continue;
                    }
                    TestAttempt latestAttempt = testAttemptRepository.findByStudentAndTestOrderByStartedAtDesc(student, lectureTest).stream()
                        .findFirst()
                        .orElse(null);

                    if (latestAttempt == null) {
                        testMap.put(lectureTest.getId(), new UserManagementDtos.StudentLectureTestItem(
                            lectureTest.getId(),
                            lectureTest.getTitle(),
                            "NOT_STARTED",
                            null,
                            null,
                            null
                        ));
                        continue;
                    }

                    Integer grade = latestAttempt.getStatus() == AttemptStatus.SUBMITTED
                        ? resolveGrade(lectureTest.getMinScore3(), lectureTest.getMinScore4(), lectureTest.getMinScore5(), latestAttempt.getScore())
                        : null;
                    testMap.put(lectureTest.getId(), new UserManagementDtos.StudentLectureTestItem(
                        lectureTest.getId(),
                        lectureTest.getTitle(),
                        latestAttempt.getStatus().name(),
                        latestAttempt.getScore(),
                        latestAttempt.getMaxScore(),
                        grade
                    ));
                }

                List<UserManagementDtos.StudentLectureTestItem> tests = List.copyOf(testMap.values());
                List<Integer> grades = tests.stream()
                    .map(UserManagementDtos.StudentLectureTestItem::grade)
                    .filter(Objects::nonNull)
                    .toList();
                Integer averageGrade = grades.isEmpty()
                    ? null
                    : (int) Math.round(grades.stream().mapToInt(Integer::intValue).average().orElse(0));

                return new UserManagementDtos.StudentLectureProgressItem(
                    lecture.getId(),
                    lecture.getTitle(),
                    lecture.getSummary(),
                    averageGrade,
                    tests
                );
            })
            .toList();

        Integer disciplineGrade = averageRounded(
            lectureItems.stream()
                .map(UserManagementDtos.StudentLectureProgressItem::averageGrade)
                .filter(Objects::nonNull)
                .toList()
        );

        return new UserManagementDtos.StudentDisciplineDetails(
            subject.getId(),
            subject.getCode(),
            subject.getName(),
            assignment.getTeacher().getId(),
            assignment.getTeacher().getFullName(),
            group.getId(),
            group.getCode(),
            group.getName(),
            disciplineGrade,
            lectureItems
        );
    }

    public UserManagementDtos.StudentGradebookMatrix getStudentGradebook(AppUser student) {
        GroupEntity group = requireStudentGroup(student);

        List<TeachingAssignment> groupAssignments = teachingAssignmentRepository.findByGroup(group);
        List<Subject> subjects = groupAssignments.stream()
            .map(TeachingAssignment::getSubject)
            .distinct()
            .sorted(Comparator.comparing(Subject::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .toList();

        List<TestAssignment> testAssignments = testAssignmentRepository.findByGroupAndActiveTrueOrderByDueAtAsc(group).stream()
            .filter(assignment -> assignment.getTest() != null && assignment.getTest().isPublished())
            .toList();

        List<UserManagementDtos.StudentGradebookColumn> columns = testAssignments.stream()
            .map(assignment -> new UserManagementDtos.StudentGradebookColumn(
                assignment.getId(),
                assignment.getTest().getId(),
                assignment.getTest().getTitle(),
                assignment.getTest().getSubject() != null ? assignment.getTest().getSubject().getCode() : null,
                assignment.getTest().getSubject() != null ? assignment.getTest().getSubject().getName() : null,
                assignment.getDueAt() != null ? assignment.getDueAt().toString() : null
            ))
            .toList();

        List<UserManagementDtos.StudentGradebookRow> rows = subjects.stream()
            .map(subject -> new UserManagementDtos.StudentGradebookRow(
                subject.getId(),
                subject.getCode(),
                subject.getName(),
                calculateDisciplineGrade(student, group, subject),
                testAssignments.stream().map(assignment -> {
                    if (assignment.getTest().getSubject() == null || !assignment.getTest().getSubject().getId().equals(subject.getId())) {
                        return new UserManagementDtos.StudentGradebookCell("—", null, null, null);
                    }

                    TestAttempt latestAttempt = testAttemptRepository.findByStudentAndTestOrderByStartedAtDesc(student, assignment.getTest()).stream()
                        .findFirst()
                        .orElse(null);
                    if (latestAttempt == null) {
                        if (assignment.getDueAt() != null && OffsetDateTime.now().isAfter(assignment.getDueAt())) {
                            return new UserManagementDtos.StudentGradebookCell("Не выполнен", null, null, null);
                        }
                        return new UserManagementDtos.StudentGradebookCell("Не приступал", null, null, null);
                    }
                    if (latestAttempt.getStatus() == AttemptStatus.IN_PROGRESS) {
                        return new UserManagementDtos.StudentGradebookCell("В процессе", null, null, null);
                    }
                    int grade = resolveGrade(
                        assignment.getTest().getMinScore3(),
                        assignment.getTest().getMinScore4(),
                        assignment.getTest().getMinScore5(),
                        latestAttempt.getScore()
                    );
                    return new UserManagementDtos.StudentGradebookCell(
                        "Оценено",
                        latestAttempt.getScore(),
                        latestAttempt.getMaxScore(),
                        grade
                    );
                }).toList()
            ))
            .toList();

        return new UserManagementDtos.StudentGradebookMatrix(
            student.getId(),
            student.getFullName(),
            group.getId(),
            group.getCode(),
            group.getName(),
            columns,
            rows
        );
    }

    private Integer calculateDisciplineGrade(AppUser student, GroupEntity group, Subject subject) {
        List<Lecture> subjectLectures = lectureRepository.findByPublishedTrueAndSubject(subject);
        List<Integer> lectureGrades = subjectLectures.stream()
            .map(lecture -> {
                List<Integer> testGrades = learningTestRepository.findByLectureId(lecture.getId()).stream()
                    .filter(LearningTest::isPublished)
                    .filter(test -> testAssignmentRepository.findByGroupAndActiveTrue(group).stream()
                        .anyMatch(assignment -> assignment.getTest().getId().equals(test.getId())))
                    .map(test -> latestSubmittedGrade(student, test))
                    .filter(Objects::nonNull)
                    .toList();
                return averageRounded(testGrades);
            })
            .filter(Objects::nonNull)
            .toList();
        return averageRounded(lectureGrades);
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

    public UserManagementDtos.GroupSummary getGroupSummary(AppUser actor, Long groupId) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));

        if (actor.getRole() == Role.TEACHER && !teachingAssignmentRepository.existsByTeacherAndGroup(actor, group)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Преподаватель не назначен на эту группу");
        }
        if (actor.getRole() == Role.STUDENT) {
            boolean inGroup = groupStudentRepository.existsByGroupAndStudent(group, actor);
            if (!inGroup) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Студент не состоит в этой группе");
            }
        }

        List<UserManagementDtos.UserItem> students = groupStudentRepository.findByGroup(group).stream()
            .map(GroupStudent::getStudent)
            .distinct()
            .sorted((a, b) -> a.getFullName().compareToIgnoreCase(b.getFullName()))
            .map(this::toItem)
            .toList();

        List<UserManagementDtos.GroupDisciplineItem> disciplines = teachingAssignmentRepository.findByGroup(group).stream()
            .sorted(Comparator
                .comparing((TeachingAssignment ta) -> ta.getSubject().getCode(), Comparator.nullsLast(String::compareToIgnoreCase))
                .thenComparing(ta -> ta.getTeacher().getFullName(), String::compareToIgnoreCase))
            .map(assignment -> new UserManagementDtos.GroupDisciplineItem(
                assignment.getSubject().getId(),
                assignment.getSubject().getCode(),
                assignment.getSubject().getName(),
                assignment.getTeacher().getId(),
                assignment.getTeacher().getFullName()
            ))
            .toList();

        int distinctDisciplines = (int) disciplines.stream()
            .map(UserManagementDtos.GroupDisciplineItem::subjectId)
            .filter(Objects::nonNull)
            .distinct()
            .count();

        return new UserManagementDtos.GroupSummary(
            group.getId(),
            group.getCode(),
            group.getName(),
            group.getCourseYear(),
            students.size(),
            distinctDisciplines,
            disciplines,
            students
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

    public void deleteTeachingAssignment(Long assignmentId) {
        TeachingAssignment assignment = teachingAssignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Назначение не найдено"));
        teachingAssignmentRepository.delete(assignment);
    }

    public void removeStudentFromGroup(Long groupId, Long studentId) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
        AppUser student = appUserRepository.findById(studentId)
            .filter(user -> user.getRole() == Role.STUDENT)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Студент не найден"));
        groupStudentRepository.deleteByGroupAndStudent(group, student);
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
        return new UserManagementDtos.UserItem(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getAvatarUrl(), user.isActive());
    }

    private UserManagementDtos.SubjectItem toSubjectItem(Subject subject) {
        return new UserManagementDtos.SubjectItem(subject.getId(), subject.getCode(), subject.getName());
    }

    private GroupEntity requireStudentGroup(AppUser student) {
        if (student.getRole() != Role.STUDENT) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Доступно только студенту");
        }
        return groupStudentRepository.findByStudent(student).stream()
            .map(GroupStudent::getGroup)
            .findFirst()
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Студент не привязан к группе"));
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

    private int resolveGrade(int minScore3, int minScore4, int minScore5, int score) {
        if (score >= minScore5) return 5;
        if (score >= minScore4) return 4;
        if (score >= minScore3) return 3;
        return 2;
    }

    private Integer latestSubmittedGrade(AppUser student, LearningTest test) {
        TestAttempt attempt = testAttemptRepository.findByStudentAndTestOrderByStartedAtDesc(student, test).stream()
            .filter(item -> item.getStatus() == AttemptStatus.SUBMITTED)
            .findFirst()
            .orElse(null);
        if (attempt == null) {
            return null;
        }
        return resolveGrade(test.getMinScore3(), test.getMinScore4(), test.getMinScore5(), attempt.getScore());
    }

    private Integer averageRounded(List<Integer> values) {
        if (values == null || values.isEmpty()) {
            return null;
        }
        return (int) Math.round(values.stream().mapToInt(Integer::intValue).average().orElse(0));
    }
}
