package com.company.product.api.service;

import com.company.product.api.dto.AiDtos;
import com.company.product.api.entity.AiDailyUsage;
import com.company.product.api.llm.GigachatProperties;
import com.company.product.api.repository.AiDailyUsageRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiServiceTest {

    @Mock
    private AiDailyUsageRepository aiDailyUsageRepository;

    @InjectMocks
    private AiService aiService;

    @Test
    void shouldCalculateLimits() {
        GigachatProperties properties = new GigachatProperties();
        properties.setDailyLimit(10000);
        properties.setTimezone("Europe/Samara");

        AiDailyUsage usage = new AiDailyUsage();
        usage.setUsageDate(LocalDate.now());
        usage.setUsedTokens(2500);

        when(aiDailyUsageRepository.findByUsageDate(LocalDate.now(java.time.ZoneId.of("Europe/Samara"))))
            .thenReturn(Optional.of(usage));

        AiService service = new AiService(properties, aiDailyUsageRepository, null, null, null, null, null, null, null);
        AiDtos.AiLimitsResponse limits = service.getLimits();

        assertEquals(10000, limits.dailyLimit());
        assertEquals(2500, limits.usedToday());
        assertEquals(7500, limits.remaining());
    }
}
