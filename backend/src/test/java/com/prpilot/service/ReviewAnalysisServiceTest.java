package com.prpilot.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.prpilot.client.LlmClient;
import com.prpilot.dto.AnalyzeDiffRequest;
import com.prpilot.dto.AnalyzePullRequestRequest;
import com.prpilot.dto.FileChange;
import com.prpilot.dto.GitHubPullRequestFetchResponse;
import com.prpilot.dto.GitHubPullRequestRef;
import com.prpilot.dto.PullRequestInfo;
import com.prpilot.dto.ReviewAnalysisResponse;
import com.prpilot.dto.ReviewFinding;
import com.prpilot.rule.RiskRuleEngine;
import com.prpilot.util.DiffParser;
import java.util.List;
import org.junit.jupiter.api.Test;

class ReviewAnalysisServiceTest {

    @Test
    void shouldAnalyzeRawDiffWithRuleEngineAndMarkdownReportWhenLlmUnavailable() {
        ReviewAnalysisService reviewAnalysisService = newReviewAnalysisService(
                new StubLlmClient(false, List.of()),
                new FakeGitHubPullRequestService(null)
        );
        AnalyzeDiffRequest request = buildRawDiffRequest();

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
        ReviewAnalysisService reviewAnalysisService = newReviewAnalysisService(
                new StubLlmClient(true, List.of(finding)),
                new FakeGitHubPullRequestService(null)
        );

        ReviewAnalysisResponse response = reviewAnalysisService.analyzeDiff(buildRawDiffRequest());

        assertThat(response.findings()).containsExactly(finding);
        assertThat(response.markdownReport()).contains("Avoid logging tokens");
    }

    @Test
    void shouldAnalyzeGitHubPullRequestWithFetchedFiles() {
        AnalyzePullRequestRequest request = new AnalyzePullRequestRequest(
                "https://github.com/example/repo/pull/12",
                "",
                List.of("security", "testing")
        );
        PullRequestInfo pullRequest = new PullRequestInfo(
                "Update auth middleware",
                "https://github.com/example/repo/pull/12",
                "developer",
                "open",
                "main",
                "feature/auth-change",
                1,
                2,
                1
        );
        List<FileChange> files = List.of(new FileChange(
                "src/authMiddleware.ts",
                "modified",
                2,
                1,
                "@@\n- validatePermission(user)\n+ console.log(token)\n+ // TODO: tighten validation\n",
                List.of()
        ));
        GitHubPullRequestFetchResponse fetchResponse = new GitHubPullRequestFetchResponse(
                new GitHubPullRequestRef("example", "repo", 12, request.prUrl()),
                pullRequest,
                files
        );
        ReviewAnalysisService reviewAnalysisService = newReviewAnalysisService(
                new StubLlmClient(false, List.of()),
                new FakeGitHubPullRequestService(fetchResponse)
        );

        ReviewAnalysisResponse response = reviewAnalysisService.analyzePullRequest(request);

        assertThat(response.pullRequest().url()).isEqualTo("https://github.com/example/repo/pull/12");
        assertThat(response.files()).hasSize(1);
        assertThat(response.files().get(0).riskTags())
                .contains("auth-permission", "debug-logging", "todo-fixme", "validation-removed");
        assertThat(response.riskAssessment().score()).isGreaterThan(0);
        assertThat(response.markdownReport()).contains("PRPilot Review Report");
    }

    private AnalyzeDiffRequest buildRawDiffRequest() {
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

    private ReviewAnalysisService newReviewAnalysisService(LlmClient llmClient, GitHubPullRequestService gitHubPullRequestService) {
        return new ReviewAnalysisService(
                new DiffParser(),
                new RiskRuleEngine(),
                new MarkdownReportGenerator(),
                new ContextBuilder(),
                new ReviewPromptBuilder(),
                llmClient,
                gitHubPullRequestService
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

    private static class FakeGitHubPullRequestService extends GitHubPullRequestService {

        private final GitHubPullRequestFetchResponse response;

        private FakeGitHubPullRequestService(GitHubPullRequestFetchResponse response) {
            super(null, null);
            this.response = response;
        }

        @Override
        public GitHubPullRequestFetchResponse fetchPullRequest(String prUrl, String githubToken) {
            return response;
        }
    }
}
