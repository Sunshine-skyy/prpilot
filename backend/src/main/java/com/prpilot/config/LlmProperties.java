package com.prpilot.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "llm")
public record LlmProperties(
        String provider,
        String baseUrl,
        String apiKey,
        String model,
        double temperature,
        int maxTokens
) {
    public boolean isConfigured() {
        return apiKey != null && !apiKey.isBlank();
    }
}
