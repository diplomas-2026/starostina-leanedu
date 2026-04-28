package com.company.product.api.service;

import com.company.product.api.dto.TestDtos;
import com.company.product.api.entity.*;
import com.company.product.api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TestService {
    private final LearningTestRepository learningTestRepository;
    private final LectureRepository lectureRepository;
    private final SubjectRepository subjectRepository;
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final GroupRepository groupRepository;
    private final TestAssignmentRepository testAssignmentRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;
    private final TeachingAssignmentRepository teachingAssignmentRepository;

    public TestDtos.TestItem createTest(TestDtos.CreateTestRequest request, AppUser teacher) {
        validateThresholds(request.minScore3(), request.minScore4(), request.minScore5());
        Subject subject = subjectRepository.findById(request.subjectId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Дисциплина не найдена"));
        boolean hasSubject = teachingAssignmentRepository.findByTeacher(teacher).stream()
            .anyMatch(ta -> ta.getSubject().getId().equals(subject.getId()));
        if (!hasSubject) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Преподаватель не назначен на выбранную дисциплину");
        }

        LearningTest test = new LearningTest();
        test.setTitle(request.title());
        test.setDescription(request.description());
        test.setPublished(false);
        test.setSubject(subject);
        test.setTimeLimitMin(request.timeLimitMin());
        test.setAttemptsLimit(request.attemptsLimit());
        test.setMinScore3(request.minScore3());
        test.setMinScore4(request.minScore4());
        test.setMinScore5(request.minScore5());
        test.setCreatedBy(teacher);
        if (request.lectureId() != null) {
            test.setLecture(lectureRepository.findById(request.lectureId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Лекция не найдена")));
        }
        test = learningTestRepository.save(test);

        for (Long groupId : request.groupIds()) {
            GroupEntity group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
            if (!teachingAssignmentRepository.existsByTeacherAndGroupAndSubject(teacher, group, subject)) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Преподаватель не назначен на эту дисциплину в выбранной группе");
            }
            TestAssignment assignment = new TestAssignment();
            assignment.setTest(test);
            assignment.setGroup(group);
            assignment.setDueAt(request.dueAt());
            assignment.setActive(true);
            testAssignmentRepository.save(assignment);
        }

        return toTestItem(test);
    }

    public List<TestDtos.TestItem> listTests(AppUser user) {
        List<LearningTest> tests;
        if (user.getRole() == Role.STUDENT) {
            tests = learningTestRepository.findByPublishedTrue();
        } else if (user.getRole() == Role.TEACHER) {
            List<Long> teacherSubjectIds = teachingAssignmentRepository.findByTeacher(user).stream()
                .map(ta -> ta.getSubject().getId())
                .distinct()
                .toList();
            tests = learningTestRepository.findAll().stream()
                .filter(test -> test.getCreatedBy() != null && test.getCreatedBy().getId().equals(user.getId())
                    || (test.getSubject() != null && teacherSubjectIds.contains(test.getSubject().getId())))
                .toList();
        } else {
            tests = learningTestRepository.findAll();
        }
        return tests.stream().map(this::toTestItem).toList();
    }

    public TestDtos.TestDetailsItem getTestDetails(Long testId, AppUser user) {
        LearningTest test = getTestOrThrow(testId);
        if (user.getRole() == Role.TEACHER) {
            boolean allowed = test.getCreatedBy() != null && test.getCreatedBy().getId().equals(user.getId());
            if (!allowed && test.getSubject() != null) {
                allowed = teachingAssignmentRepository.findByTeacher(user).stream()
                    .anyMatch(ta -> ta.getSubject().getId().equals(test.getSubject().getId()));
            }
            if (!allowed) {
                throw new ApiException(HttpStatus.FORBIDDEN, "Недостаточно прав для просмотра теста");
            }
        }
        List<Question> questions = questionRepository.findByTestOrderBySortOrderAsc(test);

        List<TestDtos.TestQuestionItem> questionItems = questions.stream()
            .map(question -> new TestDtos.TestQuestionItem(
                question.getId(),
                question.getText(),
                question.getPoints(),
                question.getSortOrder(),
                questionOptionRepository.findByQuestionOrderByIdAsc(question).stream()
                    .map(option -> new TestDtos.TestOptionItem(option.getId(), option.getText(), option.isCorrect()))
                    .toList()
            ))
            .toList();

        return new TestDtos.TestDetailsItem(
            test.getId(),
            test.getTitle(),
            test.getDescription(),
            test.isPublished(),
            test.getSubject() != null ? test.getSubject().getId() : null,
            test.getSubject() != null ? test.getSubject().getName() : null,
            test.getTimeLimitMin(),
            test.getAttemptsLimit(),
            test.getMinScore3(),
            test.getMinScore4(),
            test.getMinScore5(),
            testAssignmentRepository.findByTestOrderByDueAtAsc(test).stream()
                .map(a -> new TestDtos.TestAssignmentItem(
                    a.getId(),
                    a.getGroup().getId(),
                    a.getGroup().getCode(),
                    a.getGroup().getName(),
                    a.getDueAt()
                ))
                .toList(),
            questionItems
        );
    }

    public void publishTest(Long testId) {
        LearningTest test = getTestOrThrow(testId);
        test.setPublished(true);
        learningTestRepository.save(test);
    }

    public void addQuestion(Long testId, TestDtos.AddQuestionRequest request) {
        LearningTest test = getTestOrThrow(testId);
        Question question = new Question();
        question.setTest(test);
        question.setText(request.text());
        question.setPoints(request.points());
        question.setSortOrder(questionRepository.findByTestOrderBySortOrderAsc(test).size() + 1);
        question = questionRepository.save(question);

        for (TestDtos.QuestionOptionRequest optionRequest : request.options()) {
            QuestionOption option = new QuestionOption();
            option.setQuestion(question);
            option.setText(optionRequest.text());
            option.setCorrect(optionRequest.correct());
            questionOptionRepository.save(option);
        }
    }

    public void assignTest(Long testId, TestDtos.AssignTestRequest request, AppUser teacher) {
        LearningTest test = getTestOrThrow(testId);
        GroupEntity group = groupRepository.findById(request.groupId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
        if (test.getSubject() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "У теста не указана дисциплина");
        }
        if (!teachingAssignmentRepository.existsByTeacherAndGroupAndSubject(teacher, group, test.getSubject())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Преподаватель не назначен на эту дисциплину в выбранной группе");
        }

        TestAssignment assignment = new TestAssignment();
        assignment.setTest(test);
        assignment.setGroup(group);
        assignment.setDueAt(request.dueAt());
        assignment.setActive(true);
        testAssignmentRepository.save(assignment);
    }

    public TestDtos.AttemptItem startAttempt(Long testId, AppUser student) {
        LearningTest test = getTestOrThrow(testId);
        if (!test.isPublished()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Тест не опубликован");
        }

        List<GroupStudent> memberships = groupStudentRepository.findByStudent(student);
        boolean assigned = memberships.stream()
            .flatMap(gs -> testAssignmentRepository.findByGroupAndActiveTrue(gs.getGroup()).stream())
            .anyMatch(a -> a.getTest().getId().equals(testId));

        if (!assigned) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Тест не назначен студенту");
        }

        TestAttempt attempt = new TestAttempt();
        attempt.setTest(test);
        attempt.setStudent(student);
        attempt.setStartedAt(OffsetDateTime.now());
        attempt.setStatus(AttemptStatus.IN_PROGRESS);
        attempt.setScore(0);
        attempt.setMaxScore(0);
        attempt = testAttemptRepository.save(attempt);

        return new TestDtos.AttemptItem(attempt.getId(), test.getId(), test.getTitle(), 0, 0, null, attempt.getStatus().name());
    }

    public TestDtos.AttemptItem submitAttempt(Long attemptId, TestDtos.SubmitAttemptRequest request, AppUser student) {
        TestAttempt attempt = testAttemptRepository.findById(attemptId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Попытка не найдена"));
        if (!attempt.getStudent().getId().equals(student.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "Недостаточно прав");
        }
        if (attempt.getStatus() == AttemptStatus.SUBMITTED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Попытка уже отправлена");
        }

        List<Question> questions = questionRepository.findByTestOrderBySortOrderAsc(attempt.getTest());
        int maxScore = questions.stream().mapToInt(Question::getPoints).sum();

        List<AttemptAnswer> answers = new ArrayList<>();
        int score = 0;
        for (TestDtos.SubmitAnswerRequest answerRequest : request.answers()) {
            Question question = questions.stream().filter(q -> q.getId().equals(answerRequest.questionId())).findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Вопрос не относится к тесту"));
            QuestionOption option = questionOptionRepository.findById(answerRequest.selectedOptionId())
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Вариант не найден"));
            if (!option.getQuestion().getId().equals(question.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Вариант не относится к вопросу");
            }

            AttemptAnswer answer = new AttemptAnswer();
            answer.setAttempt(attempt);
            answer.setQuestion(question);
            answer.setSelectedOption(option);
            answer.setCorrect(option.isCorrect());
            answer.setAwardedPoints(option.isCorrect() ? question.getPoints() : 0);
            score += answer.getAwardedPoints();
            answers.add(answer);
        }

        attemptAnswerRepository.saveAll(answers);
        attempt.setScore(score);
        attempt.setMaxScore(maxScore);
        attempt.setStatus(AttemptStatus.SUBMITTED);
        attempt.setSubmittedAt(OffsetDateTime.now());
        attempt = testAttemptRepository.save(attempt);
        int grade = resolveGrade(attempt.getTest(), attempt.getScore());

        return new TestDtos.AttemptItem(
            attempt.getId(),
            attempt.getTest().getId(),
            attempt.getTest().getTitle(),
            attempt.getScore(),
            attempt.getMaxScore(),
            grade,
            attempt.getStatus().name()
        );
    }

    public List<TestDtos.AttemptItem> listMyAttempts(AppUser student) {
        return testAttemptRepository.findByStudentOrderByStartedAtDesc(student).stream()
            .map(a -> new TestDtos.AttemptItem(
                a.getId(),
                a.getTest().getId(),
                a.getTest().getTitle(),
                a.getScore(),
                a.getMaxScore(),
                a.getStatus() == AttemptStatus.SUBMITTED ? resolveGrade(a.getTest(), a.getScore()) : null,
                a.getStatus().name()
            ))
            .toList();
    }

    public List<TestDtos.GradebookItem> listGradebook() {
        return testAttemptRepository.findAll().stream()
            .filter(a -> a.getStatus() == AttemptStatus.SUBMITTED)
            .map(a -> new TestDtos.GradebookItem(
                a.getId(),
                a.getStudent().getFullName(),
                a.getTest().getTitle(),
                a.getScore(),
                a.getMaxScore()
            ))
            .toList();
    }

    public List<TestDtos.GradebookGroupOption> listGradebookGroups(AppUser user) {
        if (user.getRole() == Role.ADMIN) {
            return groupRepository.findAll().stream()
                .sorted(Comparator.comparing(GroupEntity::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(group -> new TestDtos.GradebookGroupOption(group.getId(), group.getCode(), group.getName()))
                .toList();
        }

        return teachingAssignmentRepository.findByTeacher(user).stream()
            .map(TeachingAssignment::getGroup)
            .distinct()
            .sorted(Comparator.comparing(GroupEntity::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(group -> new TestDtos.GradebookGroupOption(group.getId(), group.getCode(), group.getName()))
            .toList();
    }

    public List<TestDtos.GradebookSubjectOption> listGradebookSubjects(Long groupId, AppUser user) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));

        if (user.getRole() == Role.ADMIN) {
            return teachingAssignmentRepository.findAll().stream()
                .filter(ta -> ta.getGroup().getId().equals(group.getId()))
                .map(TeachingAssignment::getSubject)
                .distinct()
                .sorted(Comparator.comparing(Subject::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
                .map(subject -> new TestDtos.GradebookSubjectOption(subject.getId(), subject.getCode(), subject.getName()))
                .toList();
        }

        return teachingAssignmentRepository.findByTeacherAndGroup(user, group).stream()
            .map(TeachingAssignment::getSubject)
            .distinct()
            .sorted(Comparator.comparing(Subject::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(subject -> new TestDtos.GradebookSubjectOption(subject.getId(), subject.getCode(), subject.getName()))
            .toList();
    }

    public TestDtos.GradebookMatrix getGradebookMatrix(Long groupId, Long subjectId, AppUser user) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));
        Subject subject = subjectRepository.findById(subjectId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Дисциплина не найдена"));

        if (user.getRole() == Role.TEACHER && !teachingAssignmentRepository.existsByTeacherAndGroupAndSubject(user, group, subject)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "У преподавателя нет назначения на эту группу и предмет");
        }

        List<GroupStudent> memberships = groupStudentRepository.findByGroup(group);
        List<AppUser> students = memberships.stream()
            .map(GroupStudent::getStudent)
            .distinct()
            .sorted(Comparator.comparing(AppUser::getFullName, String::compareToIgnoreCase))
            .toList();

        List<TestAssignment> assignments = testAssignmentRepository.findByGroupAndTestSubjectAndActiveTrueOrderByDueAtAsc(group, subject);
        List<LearningTest> tests = assignments.stream()
            .map(TestAssignment::getTest)
            .distinct()
            .toList();

        Map<String, TestAttempt> latestSubmittedByStudentAndTest = new HashMap<>();
        Map<String, TestAttempt> latestInProgressByStudentAndTest = new HashMap<>();
        if (!students.isEmpty() && !tests.isEmpty()) {
            List<TestAttempt> submittedAttempts = testAttemptRepository
                .findByStudentInAndTestInAndStatusOrderBySubmittedAtDesc(students, tests, AttemptStatus.SUBMITTED);
            for (TestAttempt attempt : submittedAttempts) {
                String key = buildStudentTestKey(attempt.getStudent().getId(), attempt.getTest().getId());
                latestSubmittedByStudentAndTest.putIfAbsent(key, attempt);
            }

            List<TestAttempt> inProgressAttempts = testAttemptRepository
                .findByStudentInAndTestInAndStatusOrderByStartedAtDesc(students, tests, AttemptStatus.IN_PROGRESS);
            for (TestAttempt attempt : inProgressAttempts) {
                String key = buildStudentTestKey(attempt.getStudent().getId(), attempt.getTest().getId());
                latestInProgressByStudentAndTest.putIfAbsent(key, attempt);
            }
        }

        List<TestDtos.GradebookColumn> columns = assignments.stream()
            .map(a -> new TestDtos.GradebookColumn(a.getId(), a.getTest().getTitle(), a.getDueAt()))
            .toList();

        List<TestDtos.GradebookRow> rows = students.stream()
            .map(student -> new TestDtos.GradebookRow(
                student.getId(),
                student.getFullName(),
                assignments.stream().map(assignment -> {
                    String key = buildStudentTestKey(student.getId(), assignment.getTest().getId());
                    TestAttempt submittedAttempt = latestSubmittedByStudentAndTest.get(key);
                    if (submittedAttempt != null) {
                        return new TestDtos.GradebookCell(
                            "Оценено",
                            submittedAttempt.getScore(),
                            submittedAttempt.getMaxScore(),
                            resolveGrade(submittedAttempt.getTest(), submittedAttempt.getScore())
                        );
                    }

                    if (latestInProgressByStudentAndTest.containsKey(key)) {
                        return new TestDtos.GradebookCell("В процессе", null, null, null);
                    }
                    if (assignment.getDueAt() != null && OffsetDateTime.now().isAfter(assignment.getDueAt())) {
                        return new TestDtos.GradebookCell("Не выполнен", null, null, null);
                    }
                    return new TestDtos.GradebookCell("Не приступал", null, null, null);
                }).toList()
            ))
            .toList();

        return new TestDtos.GradebookMatrix(
            group.getId(),
            group.getCode(),
            group.getName(),
            subject.getId(),
            subject.getCode(),
            subject.getName(),
            columns,
            rows
        );
    }

    private String buildStudentTestKey(Long studentId, Long testId) {
        return studentId + ":" + testId;
    }

    private int resolveGrade(LearningTest test, int score) {
        if (score >= test.getMinScore5()) {
            return 5;
        }
        if (score >= test.getMinScore4()) {
            return 4;
        }
        if (score >= test.getMinScore3()) {
            return 3;
        }
        return 2;
    }

    private void validateThresholds(int minScore3, int minScore4, int minScore5) {
        if (!(minScore3 <= minScore4 && minScore4 <= minScore5)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Пороги должны удовлетворять условию: 3 <= 4 <= 5");
        }
    }

    private LearningTest getTestOrThrow(Long testId) {
        return learningTestRepository.findById(testId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Тест не найден"));
    }

    private TestDtos.TestItem toTestItem(LearningTest test) {
        return new TestDtos.TestItem(
            test.getId(),
            test.getTitle(),
            test.getDescription(),
            test.isPublished(),
            test.getSubject() != null ? test.getSubject().getId() : null,
            test.getSubject() != null ? test.getSubject().getName() : null,
            test.getMinScore3(),
            test.getMinScore4(),
            test.getMinScore5()
        );
    }
}
