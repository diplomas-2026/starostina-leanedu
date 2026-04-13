package com.company.product.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "learning_tests")
@Getter
@Setter
public class LearningTest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 800)
    private String description;

    @ManyToOne
    @JoinColumn(name = "lecture_id")
    private Lecture lecture;

    @Column(nullable = false)
    private boolean published;

    @Column(nullable = false)
    private Integer timeLimitMin;

    @Column(nullable = false)
    private Integer attemptsLimit;

    @ManyToOne(optional = false)
    @JoinColumn(name = "created_by")
    private AppUser createdBy;
}
