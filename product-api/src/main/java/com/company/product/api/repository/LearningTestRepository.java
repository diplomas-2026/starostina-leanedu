package com.company.product.api.repository;

import com.company.product.api.entity.LearningTest;
import com.company.product.api.entity.Subject;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LearningTestRepository extends JpaRepository<LearningTest, Long> {
    List<LearningTest> findByPublishedTrue();
    List<LearningTest> findByLectureId(Long lectureId);
    long countBySubject(Subject subject);
}
