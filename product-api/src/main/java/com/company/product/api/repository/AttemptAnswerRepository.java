package com.company.product.api.repository;

import com.company.product.api.entity.AttemptAnswer;
import com.company.product.api.entity.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AttemptAnswerRepository extends JpaRepository<AttemptAnswer, Long> {
    List<AttemptAnswer> findByAttempt(TestAttempt attempt);
}
