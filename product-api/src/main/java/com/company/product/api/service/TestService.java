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
    private final QuestionRepository questionRepository;
    private final QuestionOptionRepository questionOptionRepository;
    private final GroupRepository groupRepository;
    private final TestAssignmentRepository testAssignmentRepository;
    private final GroupStudentRepository groupStudentRepository;
    private final TestAttemptRepository testAttemptRepository;
    private final AttemptAnswerRepository attemptAnswerRepository;

    public TestDtos.TestItem createTest(TestDtos.CreateTestRequest request, AppUser teacher) {
        LearningTest test = new LearningTest();
        test.setTitle(request.title());
        test.setDescription(request.description());
        test.setPublished(false);
        test.setTimeLimitMin(request.timeLimitMin());
        test.setAttemptsLimit(request.attemptsLimit());
        test.setCreatedBy(teacher);
        if (request.lectureId() != null) {
            test.setLecture(lectureRepository.findById(request.lectureId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Лекция не найдена")));
        }
        return toTestItem(learningTestRepository.save(test));
    }

    public List<TestDtos.TestItem> listTests(AppUser user) {
        List<LearningTest> tests = user.getRole() == Role.STUDENT ? learningTestRepository.findByPublishedTrue() : learningTestRepository.findAll();
        return tests.stream().map(this::toTestItem).toList();
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

    public void assignTest(Long testId, TestDtos.AssignTestRequest request) {
        LearningTest test = getTestOrThrow(testId);
        GroupEntity group = groupRepository.findById(request.groupId())
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));

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

        return new TestDtos.AttemptItem(attempt.getId(), test.getId(), test.getTitle(), 0, 0, attempt.getStatus().name());
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

        return new TestDtos.AttemptItem(
            attempt.getId(),
            attempt.getTest().getId(),
            attempt.getTest().getTitle(),
            attempt.getScore(),
            attempt.getMaxScore(),
            attempt.getStatus().name()
        );
    }

    public List<TestDtos.AttemptItem> listMyAttempts(AppUser student) {
        return testAttemptRepository.findByStudentOrderByStartedAtDesc(student).stream()
            .map(a -> new TestDtos.AttemptItem(a.getId(), a.getTest().getId(), a.getTest().getTitle(), a.getScore(), a.getMaxScore(), a.getStatus().name()))
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

    public List<TestDtos.GradebookGroupOption> listGradebookGroups() {
        return groupRepository.findAll().stream()
            .sorted(Comparator.comparing(GroupEntity::getCode, Comparator.nullsLast(String::compareToIgnoreCase)))
            .map(group -> new TestDtos.GradebookGroupOption(group.getId(), group.getCode(), group.getName()))
            .toList();
    }

    public TestDtos.GradebookMatrix getGradebookMatrix(Long groupId) {
        GroupEntity group = groupRepository.findById(groupId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Группа не найдена"));

        List<GroupStudent> memberships = groupStudentRepository.findByGroup(group);
        List<AppUser> students = memberships.stream()
            .map(GroupStudent::getStudent)
            .distinct()
            .sorted(Comparator.comparing(AppUser::getFullName, String::compareToIgnoreCase))
            .toList();

        List<TestAssignment> assignments = testAssignmentRepository.findByGroupAndActiveTrueOrderByDueAtAsc(group);
        List<LearningTest> tests = assignments.stream()
            .map(TestAssignment::getTest)
            .distinct()
            .toList();

        Map<String, TestAttempt> latestSubmittedByStudentAndTest = new HashMap<>();
        if (!students.isEmpty() && !tests.isEmpty()) {
            List<TestAttempt> submittedAttempts = testAttemptRepository
                .findByStudentInAndTestInAndStatusOrderBySubmittedAtDesc(students, tests, AttemptStatus.SUBMITTED);
            for (TestAttempt attempt : submittedAttempts) {
                String key = buildStudentTestKey(attempt.getStudent().getId(), attempt.getTest().getId());
                latestSubmittedByStudentAndTest.putIfAbsent(key, attempt);
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
                    TestAttempt attempt = latestSubmittedByStudentAndTest.get(buildStudentTestKey(student.getId(), assignment.getTest().getId()));
                    if (attempt != null) {
                        return new TestDtos.GradebookCell("Оценено", attempt.getScore(), attempt.getMaxScore());
                    }
                    if (assignment.getDueAt() != null && OffsetDateTime.now().isAfter(assignment.getDueAt())) {
                        return new TestDtos.GradebookCell("Просрочено", null, null);
                    }
                    return new TestDtos.GradebookCell("Не сдано", null, null);
                }).toList()
            ))
            .toList();

        return new TestDtos.GradebookMatrix(group.getId(), group.getCode(), group.getName(), columns, rows);
    }

    private String buildStudentTestKey(Long studentId, Long testId) {
        return studentId + ":" + testId;
    }

    private LearningTest getTestOrThrow(Long testId) {
        return learningTestRepository.findById(testId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Тест не найден"));
    }

    private TestDtos.TestItem toTestItem(LearningTest test) {
        return new TestDtos.TestItem(test.getId(), test.getTitle(), test.getDescription(), test.isPublished());
    }
}
