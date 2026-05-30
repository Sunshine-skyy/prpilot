package com.prpilot.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.prpilot.dto.AnalyzeDiffRequest;
import com.prpilot.dto.ReviewAnalysisResponse;
import com.prpilot.rule.RiskRuleEngine;
import com.prpilot.util.DiffParser;
import java.util.List;
import org.junit.jupiter.api.Test;

class ReviewAnalysisServiceTest {

    private final ReviewAnalysisService reviewAnalysisService = new ReviewAnalysisService(
            new DiffParser(),
            new RiskRuleEngine(),
            new MarkdownReportGenerator()
    );

    @Test
    void shouldAnalyzeRawDiffWithRuleEngineAndMarkdownReport() {
        AnalyzeDiffRequest request = new AnalyzeDiffRequest(
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
}
