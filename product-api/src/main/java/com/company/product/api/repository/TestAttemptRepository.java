package com.company.product.api.repository;

import com.company.product.api.entity.AppUser;
import com.company.product.api.entity.AttemptStatus;
import com.company.product.api.entity.LearningTest;
import com.company.product.api.entity.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    List<TestAttempt> findByStudentOrderByStartedAtDesc(AppUser student);
    List<TestAttempt> findByStudentAndTestOrderByStartedAtDesc(AppUser student, LearningTest test);
    long countByStudentAndTestAndStatus(AppUser student, LearningTest test, AttemptStatus status);
    List<TestAttempt> findByStudentInAndTestInAndStatusOrderBySubmittedAtDesc(List<AppUser> students, List<LearningTest> tests, AttemptStatus status);
    List<TestAttempt> findByStudentInAndTestInAndStatusOrderByStartedAtDesc(List<AppUser> students, List<LearningTest> tests, AttemptStatus status);
}
