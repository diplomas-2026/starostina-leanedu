package com.company.product.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "attempt_answers")
@Getter
@Setter
public class AttemptAnswer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "attempt_id")
    private TestAttempt attempt;

    @ManyToOne(optional = false)
    @JoinColumn(name = "question_id")
    private Question question;

    @ManyToOne(optional = false)
    @JoinColumn(name = "selected_option_id")
    private QuestionOption selectedOption;

    @Column(nullable = false)
    private boolean correct;

    @Column(nullable = false)
    private Integer awardedPoints;
}
