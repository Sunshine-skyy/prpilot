package com.prpilot.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.prpilot.config.LlmProperties;
import com.prpilot.dto.ReviewFinding;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

@Component
public class OpenAiCompatibleLlmClient implements LlmClient {

    private final LlmProperties properties;
    private final ObjectMapper objectMapper;
    private final WebClient.Builder webClientBuilder;

    public OpenAiCompatibleLlmClient(
            LlmProperties properties,
            ObjectMapper objectMapper,
            WebClient.Builder webClientBuilder
    ) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.webClientBuilder = webClientBuilder;
    }

    @Override
    public List<ReviewFinding> generateReviewFindings(String systemPrompt, String userPrompt) {
        if (!isAvailable()) {
            return List.of();
        }

        ChatCompletionRequest request = new ChatCompletionRequest(
                properties.model(),
                List.of(
                        new ChatMessage("system", systemPrompt),
                        new ChatMessage("user", userPrompt)
                ),
                properties.temperature(),
                properties.maxTokens()
        );

        ChatCompletionResponse response = webClientBuilder.build()
                .post()
                .uri(normalizeBaseUrl(properties.baseUrl()) + "/chat/completions")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey().trim())
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON)
                .bodyValue(request)
                .retrieve()
                .bodyToMono(ChatCompletionResponse.class)
                .block();

        if (response == null || response.choices() == null || response.choices().isEmpty()) {
            return List.of();
        }

        String content = response.choices().get(0).message() == null
                ? ""
                : response.choices().get(0).message().content();
        return parseFindings(content);
    }

    @Override
    public boolean isAvailable() {
        return properties != null
                && properties.isConfigured()
                && StringUtils.hasText(properties.baseUrl())
                && StringUtils.hasText(properties.model());
    }

    List<ReviewFinding> parseFindings(String content) {
        if (!StringUtils.hasText(content)) {
            return List.of();
        }

        String json = extractJson(content);
        try {
            ReviewFindingList findingList = objectMapper.readValue(json, ReviewFindingList.class);
            return findingList.findings() == null ? List.of() : findingList.findings();
        } catch (JsonProcessingException ignored) {
            return List.of();
        }
    }

    private String extractJson(String content) {
        String trimmed = content.trim();
        if (trimmed.startsWith("```")) {
            int firstNewLine = trimmed.indexOf('\n');
            int lastFence = trimmed.lastIndexOf("```");
            if (firstNewLine >= 0 && lastFence > firstNewLine) {
                return trimmed.substring(firstNewLine + 1, lastFence).trim();
            }
        }
        return trimmed;
    }

    private String normalizeBaseUrl(String baseUrl) {
        return baseUrl.endsWith("/") ? baseUrl.substring(0, baseUrl.length() - 1) : baseUrl;
    }

    private record ChatCompletionRequest(
            String model,
            List<ChatMessage> messages,
            double temperature,
            @JsonProperty("max_tokens") int maxTokens
    ) {
    }

    private record ChatMessage(String role, String content) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ChatCompletionResponse(List<ChatChoice> choices) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ChatChoice(ChatMessage message) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ReviewFindingList(List<ReviewFinding> findings) {
    }
}
