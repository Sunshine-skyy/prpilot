package com.prpilot.client;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.prpilot.config.LlmProperties;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

class OpenAiCompatibleLlmClientTest {

    private final OpenAiCompatibleLlmClient client = new OpenAiCompatibleLlmClient(
            new LlmProperties(
                    "openai-compatible",
                    "https://example.com/v1",
                    "test-api-key",
                    "test-model",
                    0.2,
                    1000
            ),
            new ObjectMapper(),
            WebClient.builder()
    );

    @Test
    void shouldParsePlainJsonFindings() {
        String content = """
                {
                  "findings": [
                    {
                      "severity": "High",
                      "category": "Security",
                      "file": "src/authMiddleware.ts",
                      "line": null,
                      "title": "Avoid logging tokens",
                      "description": "The diff logs a bearer token.",
                      "suggestion": "Remove token logging.",
                      "confidence": 0.9
                    }
                  ]
                }
                """;

        assertThat(client.parseFindings(content))
                .hasSize(1)
                .first()
                .satisfies(finding -> {
                    assertThat(finding.severity()).isEqualTo("High");
                    assertThat(finding.category()).isEqualTo("Security");
                    assertThat(finding.file()).isEqualTo("src/authMiddleware.ts");
                });
    }

    @Test
    void shouldParseJsonWrappedInMarkdownFence() {
        String content = """
                ```json
                {
                  "findings": []
                }
                ```
                """;

        assertThat(client.parseFindings(content)).isEmpty();
    }

    @Test
    void shouldReturnEmptyListForInvalidJson() {
        assertThat(client.parseFindings("not json")).isEmpty();
    }
}
