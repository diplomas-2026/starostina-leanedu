package com.company.product.api.repository;

import com.company.product.api.entity.LearningTest;
import com.company.product.api.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionRepository extends JpaRepository<Question, Long> {
    List<Question> findByTestOrderBySortOrderAsc(LearningTest test);
}
