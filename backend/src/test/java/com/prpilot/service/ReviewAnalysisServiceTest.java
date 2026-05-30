package com.prpilot.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.prpilot.client.LlmClient;
import com.prpilot.dto.AnalyzeDiffRequest;
import com.prpilot.dto.ReviewAnalysisResponse;
import com.prpilot.dto.ReviewFinding;
import com.prpilot.rule.RiskRuleEngine;
import com.prpilot.util.DiffParser;
import java.util.List;
import org.junit.jupiter.api.Test;

class ReviewAnalysisServiceTest {

    @Test
    void shouldAnalyzeRawDiffWithRuleEngineAndMarkdownReportWhenLlmUnavailable() {
        ReviewAnalysisService reviewAnalysisService = newReviewAnalysisService(new StubLlmClient(false, List.of()));
        AnalyzeDiffRequest request = buildRequest();

        ReviewAnalysisResponse response = reviewAnalysisService.analyzeDiff(request);

        assertThat(response.pullRequest().title()).isEqualTo("Update auth middleware");
        assertThat(response.pullRequest().changedFiles()).isEqualTo(1);
        assertThat(response.files()).hasSize(1);
        assertThat(response.files().get(0).riskTags())
                .contains("auth-permission", "debug-logging", "todo-fixme", "validation-removed");
        assertThat(response.riskAssessment().score()).isGreaterThan(0);
        assertThat(response.changeSummary().overview()).contains("auth behavior");
        assertThat(response.markdownReport()).contains("PRPilot Review Report");
        assertThat(response.findings()).isEmpty();
    }

    @Test
    void shouldIncludeLlmFindingsWhenLlmIsAvailable() {
        ReviewFinding finding = new ReviewFinding(
                "High",
                "Security",
                "src/authMiddleware.ts",
                null,
                "Avoid logging tokens",
                "The diff logs a bearer token.",
                "Remove token logging.",
                0.9
        );
        ReviewAnalysisService reviewAnalysisService = newReviewAnalysisService(new StubLlmClient(true, List.of(finding)));

        ReviewAnalysisResponse response = reviewAnalysisService.analyzeDiff(buildRequest());

        assertThat(response.findings()).containsExactly(finding);
        assertThat(response.markdownReport()).contains("Avoid logging tokens");
    }

    private AnalyzeDiffRequest buildRequest() {
        return new AnalyzeDiffRequest(
                "Update auth middleware",
                "This patch updates auth behavior from raw diff input.",
                """
                        diff --git a/src/authMiddleware.ts b/src/authMiddleware.ts
                        index 1111111..2222222 100644
                        --- a/src/authMiddleware.ts
                        +++ b/src/authMiddleware.ts
                        @@ -1,4 +1,5 @@
                        - validatePermission(user)
                        + console.log(token)
                        + // TODO: tighten validation
                          return user
                        """,
                List.of("security", "testing")
        );
    }

    private ReviewAnalysisService newReviewAnalysisService(LlmClient llmClient) {
        return new ReviewAnalysisService(
                new DiffParser(),
                new RiskRuleEngine(),
                new MarkdownReportGenerator(),
                new ContextBuilder(),
                new ReviewPromptBuilder(),
                llmClient
        );
    }

    private record StubLlmClient(boolean available, List<ReviewFinding> findings) implements LlmClient {

        @Override
        public List<ReviewFinding> generateReviewFindings(String systemPrompt, String userPrompt) {
            return findings;
        }

        @Override
        public boolean isAvailable() {
            return available;
        }
    }
}
