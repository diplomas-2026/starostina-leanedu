package com.company.product.api.repository;

import com.company.product.api.entity.Question;
import com.company.product.api.entity.QuestionOption;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface QuestionOptionRepository extends JpaRepository<QuestionOption, Long> {
    List<QuestionOption> findByQuestion(Question question);
    List<QuestionOption> findByQuestionOrderByIdAsc(Question question);
}
