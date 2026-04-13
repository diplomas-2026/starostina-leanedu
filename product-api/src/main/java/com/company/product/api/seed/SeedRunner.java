package com.company.product.api.seed;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

@Configuration
@RequiredArgsConstructor
@Profile("!prod")
public class SeedRunner {
    private final SeedService seedService;

    @Bean
    public CommandLineRunner seedCommandLineRunner() {
        return args -> seedService.seedAll();
    }
}
