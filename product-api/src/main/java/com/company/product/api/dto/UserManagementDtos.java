package com.company.product.api.dto;

import com.company.product.api.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public class UserManagementDtos {
    public record CreateTeacherRequest(@Email @NotBlank String email, @NotBlank String fullName, @NotBlank String password) {}
    public record CreateStudentRequest(@Email @NotBlank String email, @NotBlank String fullName, @NotBlank String password) {}
    public record CreateSubjectRequest(@NotBlank String code, @NotBlank String name) {}
    public record CreateTeachingAssignmentRequest(@NotNull Long teacherId, @NotNull Long subjectId, @NotNull Long groupId) {}
    public record UserItem(Long id, String email, String fullName, Role role, String avatarUrl) {}
    public record GroupItem(Long id, String code, String name, int courseYear) {}
    public record SubjectItem(Long id, String code, String name) {}
    public record TeachingAssignmentItem(Long id, Long teacherId, String teacherName, Long subjectId, String subjectName, Long groupId, String groupCode, String groupName) {}
    public record StudentGroupItem(Long groupId, String groupCode, String groupName, int courseYear) {}
    public record StudentAttemptItem(Long attemptId, Long testId, String testTitle, String subjectName, String status, Integer score, Integer maxScore, Integer grade, String submittedAt) {}
    public record StudentSummary(
        Long studentId,
        String fullName,
        String email,
        String avatarUrl,
        int groupsCount,
        int submittedAttemptsCount,
        int averageGrade,
        List<StudentGroupItem> groups,
        List<StudentAttemptItem> recentAttempts
    ) {}
    public record StudentDisciplineItem(
        Long subjectId,
        String subjectCode,
        String subjectName,
        Long teacherId,
        String teacherName,
        Long groupId,
        String groupCode,
        String groupName,
        Integer disciplineGrade
    ) {}
    public record StudentLectureTestItem(
        Long testId,
        String testTitle,
        String status,
        Integer score,
        Integer maxScore,
        Integer grade
    ) {}
    public record StudentLectureProgressItem(
        Long lectureId,
        String lectureTitle,
        String lectureSummary,
        Integer averageGrade,
        List<StudentLectureTestItem> tests
    ) {}
    public record StudentDisciplineDetails(
        Long subjectId,
        String subjectCode,
        String subjectName,
        Long teacherId,
        String teacherName,
        Long groupId,
        String groupCode,
        String groupName,
        Integer disciplineGrade,
        List<StudentLectureProgressItem> lectures
    ) {}
    public record StudentGradebookColumn(Long assignmentId, Long testId, String testTitle, String subjectCode, String subjectName, String dueAt) {}
    public record StudentGradebookCell(String status, Integer score, Integer maxScore, Integer grade) {}
    public record StudentGradebookRow(Long subjectId, String subjectCode, String subjectName, Integer disciplineGrade, List<StudentGradebookCell> cells) {}
    public record StudentGradebookMatrix(
        Long studentId,
        String studentName,
        Long groupId,
        String groupCode,
        String groupName,
        List<StudentGradebookColumn> columns,
        List<StudentGradebookRow> rows
    ) {}
    public record GroupDisciplineItem(Long subjectId, String subjectCode, String subjectName, Long teacherId, String teacherName) {}
    public record GroupSummary(
        Long groupId,
        String groupCode,
        String groupName,
        int courseYear,
        int studentsCount,
        int disciplinesCount,
        List<GroupDisciplineItem> disciplines,
        List<UserItem> students
    ) {}
    public record TeacherGroupDashboardItem(Long groupId, String groupCode, String groupName, int studentsCount, int testsAssignedCount) {}
    public record TeacherDashboardSummary(
        int lecturesCount,
        int testsCount,
        int groupsCount,
        int disciplinesCount,
        int studentsCount,
        int submittedAttemptsCount,
        int passRatePercent,
        List<TeacherGroupDashboardItem> groups
    ) {}
}
