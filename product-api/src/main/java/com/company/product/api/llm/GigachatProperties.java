package com.company.product.api.llm;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai")
@Getter
@Setter
public class GigachatProperties {
    private int dailyLimit = 10000;
    private String timezone = "Europe/Samara";
    private String model = "GigaChat";
}
