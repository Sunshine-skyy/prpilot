package com.prpilot.rule;

import static org.assertj.core.api.Assertions.assertThat;

import com.prpilot.dto.FileChange;
import com.prpilot.dto.PullRequestInfo;
import java.util.List;
import org.junit.jupiter.api.Test;

class RiskRuleEngineTest {

    private final RiskRuleEngine riskRuleEngine = new RiskRuleEngine();

    @Test
    void shouldDetectAuthLoggingConfigTodoAndMissingTests() {
        PullRequestInfo pullRequest = new PullRequestInfo(
                "Update auth middleware",
                "https://github.com/example/repo/pull/1",
                "developer",
                "open",
                "main",
                "feature/auth-change",
                2,
                80,
                20
        );

        List<FileChange> files = List.of(
                new FileChange(
                        "src/authMiddleware.ts",
                        "modified",
                        60,
                        12,
                        "@@\n+ console.log(token)\n- validatePermission(user)\n+ // TODO: add strict permission check later\n",
                        List.of()
                ),
                new FileChange(
                        "src/config.ts",
                        "modified",
                        20,
                        8,
                        "@@\n+ const apiKey = 'FAKE_DEMO_SECRET_DO_NOT_USE'\n",
                        List.of()
                )
        );

        RiskRuleResult result = riskRuleEngine.analyze(pullRequest, files);

        assertThat(result.riskAssessment().score()).isGreaterThanOrEqualTo(60);
        assertThat(result.riskAssessment().level()).isIn("High", "Critical");
        assertThat(result.files().get(0).riskTags())
                .contains("auth-permission", "debug-logging", "todo-fixme", "validation-removed");
        assertThat(result.files().get(1).riskTags())
                .contains("config-secret", "sensitive-file");
        assertThat(result.signals())
                .extracting(RiskSignal::tag)
                .contains("missing-tests", "auth-without-tests");
    }

    @Test
    void shouldReduceRiskWhenTestFileIsIncluded() {
        PullRequestInfo pullRequest = new PullRequestInfo(
                "Update auth middleware with tests",
                "https://github.com/example/repo/pull/2",
                "developer",
                "open",
                "main",
                "feature/auth-change",
                2,
                40,
                10
        );

        List<FileChange> files = List.of(
                new FileChange(
                        "src/authMiddleware.ts",
                        "modified",
                        30,
                        8,
                        "@@\n+ validateToken(token)\n",
                        List.of()
                ),
                new FileChange(
                        "tests/authMiddleware.test.ts",
                        "modified",
                        10,
                        2,
                        "@@\n+ expect(validateToken('invalid')).toBe(false)\n",
                        List.of()
                )
        );

        RiskRuleResult result = riskRuleEngine.analyze(pullRequest, files);

        assertThat(result.files().get(1).riskTags()).contains("test-file");
        assertThat(result.signals())
                .extracting(RiskSignal::tag)
                .doesNotContain("missing-tests", "auth-without-tests");
    }
}
