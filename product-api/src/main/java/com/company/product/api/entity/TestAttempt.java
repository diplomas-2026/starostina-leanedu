package com.company.product.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "test_attempts")
@Getter
@Setter
public class TestAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "test_id")
    private LearningTest test;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id")
    private AppUser student;

    @Column(nullable = false)
    private OffsetDateTime startedAt;

    private OffsetDateTime submittedAt;

    @Column(nullable = false)
    private Integer score = 0;

    @Column(nullable = false)
    private Integer maxScore = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AttemptStatus status;
}
