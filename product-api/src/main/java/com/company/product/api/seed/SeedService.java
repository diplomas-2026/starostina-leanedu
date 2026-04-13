package com.company.product.api.seed;

import com.company.product.api.entity.*;
import com.company.product.api.repository.*;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Profile("!prod")
@RequiredArgsConstructor
public class SeedService {
    private final AppUserRepository appUserRepository;
    private final GroupRepository groupRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final LectureRepository lectureRepository;
    private final LearningTestRepository learningTestRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final TestAssignmentRepository testAssignmentRepository;
    private final ObjectMapper objectMapper;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void seedAll() {
        AppUser admin = upsertUser("admin@lean.local", "Администратор системы", "admin123", Role.ADMIN);
        AppUser teacher = upsertUser("teacher@lean.local", "Преподаватель Смирнова", "teacher123", Role.TEACHER);
        AppUser student1 = upsertUser("student1@lean.local", "Иван Петров", "student123", Role.STUDENT);
        AppUser student2 = upsertUser("student2@lean.local", "Мария Соколова", "student123", Role.STUDENT);

        List<SeedModels.SeedGroup> groups = readJsonList("seed-data/groups.json", new TypeReference<>() {});
        List<GroupEntity> persistedGroups = new ArrayList<>();
        for (SeedModels.SeedGroup g : groups) {
            GroupEntity group = groupRepository.findAll().stream()
                .filter(existing -> existing.getCode().equalsIgnoreCase(g.code()))
                .findFirst()
                .orElseGet(GroupEntity::new);
            group.setCode(g.code());
            group.setName(g.name());
            group.setCourseYear(g.courseYear());
            persistedGroups.add(groupRepository.save(group));
        }

        GroupEntity firstGroup = persistedGroups.getFirst();
        addStudentToGroup(firstGroup, student1);
        addStudentToGroup(firstGroup, student2);

        List<SeedModels.SeedLecture> lectures = readJsonList("seed-data/lectures.json", new TypeReference<>() {});
        for (SeedModels.SeedLecture l : lectures) {
            if (lectureRepository.findAll().stream().noneMatch(existing -> existing.getTitle().equalsIgnoreCase(l.title()))) {
                Lecture lecture = new Lecture();
                lecture.setTitle(l.title());
                lecture.setSummary(l.summary());
                lecture.setContent(l.content());
                lecture.setPublished(true);
                lecture.setCreatedBy(teacher);
                lecture.setCreatedAt(OffsetDateTime.now().minusDays(2));
                lecture.setUpdatedAt(OffsetDateTime.now().minusDays(1));
                lectureRepository.save(lecture);
            }
        }

        if (learningTestRepository.count() == 0) {
            Lecture lecture = lectureRepository.findAll().getFirst();
            LearningTest test = new LearningTest();
            test.setTitle("Базовый тест по бережливому производству");
            test.setDescription("Проверка базовых знаний по потерям и инструментам");
            test.setLecture(lecture);
            test.setPublished(true);
            test.setTimeLimitMin(20);
            test.setAttemptsLimit(3);
            test.setCreatedBy(teacher);
            test = learningTestRepository.save(test);

            Question q1 = new Question();
            q1.setTest(test);
            q1.setText("Какой из вариантов относится к потерям в Lean?");
            q1.setPoints(2);
            q1.setSortOrder(1);
            q1 = questionRepository.save(q1);

            saveOptions(q1,
                new String[]{"Ожидание", "Клиентская ценность", "Стандартизация", "Кайдзен"},
                new boolean[]{true, false, false, false}
            );

            Question q2 = new Question();
            q2.setTest(test);
            q2.setText("Сколько шагов включает методология 5S?");
            q2.setPoints(2);
            q2.setSortOrder(2);
            q2 = questionRepository.save(q2);

            saveOptions(q2,
                new String[]{"3", "5", "7", "10"},
                new boolean[]{false, true, false, false}
            );

            TestAssignment assignment = new TestAssignment();
            assignment.setTest(test);
            assignment.setGroup(firstGroup);
            assignment.setDueAt(OffsetDateTime.now().plusDays(14));
            assignment.setActive(true);
            testAssignmentRepository.save(assignment);
        }

        writeUsersFile(List.of(admin, teacher, student1, student2));
    }

    private AppUser upsertUser(String email, String fullName, String password, Role role) {
        AppUser user = appUserRepository.findByEmailIgnoreCase(email).orElseGet(AppUser::new);
        user.setEmail(email);
        user.setFullName(fullName);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(role);
        user.setActive(true);
        return appUserRepository.save(user);
    }

    private void addStudentToGroup(GroupEntity group, AppUser student) {
        if (!groupStudentRepository.existsByGroupAndStudent(group, student)) {
            GroupStudent gs = new GroupStudent();
            gs.setGroup(group);
            gs.setStudent(student);
            groupStudentRepository.save(gs);
        }
    }

    private void saveOptions(Question question, String[] texts, boolean[] correct) {
        for (int i = 0; i < texts.length; i++) {
            QuestionOption option = new QuestionOption();
            option.setQuestion(question);
            option.setText(texts[i]);
            option.setCorrect(correct[i]);
            questionOptionRepository.save(option);
        }
    }

    private <T> List<T> readJsonList(String path, TypeReference<List<T>> typeRef) {
        try {
            return objectMapper.readValue(new ClassPathResource(path).getInputStream(), typeRef);
        } catch (IOException e) {
            throw new IllegalStateException("Ошибка чтения seed-файла " + path, e);
        }
    }

    private void writeUsersFile(List<AppUser> users) {
        List<String> lines = users.stream()
            .map(u -> {
                String pass = switch (u.getRole()) {
                    case ADMIN -> "admin123";
                    case TEACHER -> "teacher123";
                    case STUDENT -> "student123";
                };
                return "email=" + u.getEmail() + "; password=" + pass + "; role=" + u.getRole().name();
            })
            .toList();
        try {
            Files.write(Path.of("users.txt"), lines);
        } catch (IOException e) {
            throw new IllegalStateException("Не удалось записать users.txt", e);
        }
    }
}
