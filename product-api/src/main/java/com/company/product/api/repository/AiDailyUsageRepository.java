package com.company.product.api.repository;

import com.company.product.api.entity.AiDailyUsage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface AiDailyUsageRepository extends JpaRepository<AiDailyUsage, Long> {
    Optional<AiDailyUsage> findByUsageDate(LocalDate usageDate);
}
