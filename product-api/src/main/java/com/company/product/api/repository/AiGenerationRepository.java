package com.company.product.api.repository;

import com.company.product.api.entity.AiGeneration;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AiGenerationRepository extends JpaRepository<AiGeneration, Long> {
}
