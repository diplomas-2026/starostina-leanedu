package com.company.product.api.config;

import com.company.product.api.llm.GigachatProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(GigachatProperties.class)
public class AiConfig {
}
