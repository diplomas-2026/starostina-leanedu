package com.company.product.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "test_assignments")
@Getter
@Setter
public class TestAssignment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "test_id")
    private LearningTest test;

    @ManyToOne(optional = false)
    @JoinColumn(name = "group_id")
    private GroupEntity group;

    @Column(nullable = false)
    private OffsetDateTime dueAt;

    @Column(nullable = false)
    private boolean active;
}
