package com.company.product.api.repository;

import com.company.product.api.entity.GroupEntity;
import com.company.product.api.entity.TestAssignment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TestAssignmentRepository extends JpaRepository<TestAssignment, Long> {
    List<TestAssignment> findByGroupAndActiveTrue(GroupEntity group);
    List<TestAssignment> findByGroupAndActiveTrueOrderByDueAtAsc(GroupEntity group);
}
