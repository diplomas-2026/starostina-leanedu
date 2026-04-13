package com.company.product.api.repository;

import com.company.product.api.entity.AppUser;
import com.company.product.api.entity.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    List<TestAttempt> findByStudentOrderByStartedAtDesc(AppUser student);
}
