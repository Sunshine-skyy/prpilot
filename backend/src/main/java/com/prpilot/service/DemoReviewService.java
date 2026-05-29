package com.prpilot.service;

import com.prpilot.dto.ChangeSummary;
import com.prpilot.dto.FileChange;
import com.prpilot.dto.PullRequestInfo;
import com.prpilot.dto.ReviewAnalysisResponse;
import com.prpilot.dto.ReviewFinding;
import com.prpilot.dto.RiskAssessment;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class DemoReviewService {

    public ReviewAnalysisResponse getDemoAnalysis() {
        PullRequestInfo pullRequest = new PullRequestInfo(
                "Add token-based auth middleware",
                "https://github.com/Sunshine-skyy/prpilot/pull/demo-risky-auth-change",
                "demo-developer",
                "open",
                "main",
                "demo/risky-auth-change",
                3,
                94,
                18
        );

        ChangeSummary changeSummary = new ChangeSummary(
                "This pull request introduces token-based authentication middleware, updates runtime configuration, and adds payment permission checks.",
                List.of(
                        "Adds auth middleware for validating bearer tokens.",
                        "Updates configuration values used by authentication and payment flows.",
                        "Changes payment service authorization checks before processing a charge."
                ),
                List.of("Authentication", "Configuration", "Payments", "Testing")
        );

        RiskAssessment riskAssessment = new RiskAssessment(
                86,
                "High",
                List.of(
                        "Authentication-related files changed.",
                        "Token value is logged in the middleware path.",
                        "Configuration contains a fake secret-like value that should be environment-driven.",
                        "TODO found in the payment permission flow.",
                        "No new tests cover the updated risky behavior."
                )
        );

        List<FileChange> files = List.of(
                new FileChange(
                        "examples/demo-app/src/authMiddleware.ts",
                        "modified",
                        42,
                        8,
                        "Adds token parsing and basic user attachment logic.",
                        List.of("auth", "token", "console-log", "missing-tests")
                ),
                new FileChange(
                        "examples/demo-app/src/config.ts",
                        "modified",
                        18,
                        4,
                        "Updates auth and payment configuration values.",
                        List.of("config", "secret-keyword")
                ),
                new FileChange(
                        "examples/demo-app/src/paymentService.ts",
                        "modified",
                        34,
                        6,
                        "Changes authorization checks before payment processing.",
                        List.of("permission", "todo", "bug-risk")
                )
        );

        List<ReviewFinding> findings = List.of(
                new ReviewFinding(
                        "High",
                        "Security",
                        "examples/demo-app/src/authMiddleware.ts",
                        42,
                        "Avoid logging bearer tokens",
                        "The authentication middleware logs the incoming token, which can expose credentials in application logs.",
                        "Remove token logging and only log non-sensitive request metadata such as request id or auth result.",
                        0.91
                ),
                new ReviewFinding(
                        "Medium",
                        "Maintainability",
                        "examples/demo-app/src/paymentService.ts",
                        27,
                        "TODO left in permission enforcement path",
                        "A TODO remains in the payment permission flow, making the expected authorization behavior unclear.",
                        "Replace the TODO with explicit permission checks and add tests for denied and allowed payment scenarios.",
                        0.84
                ),
                new ReviewFinding(
                        "Medium",
                        "Testing",
                        "examples/demo-app/tests/authMiddleware.test.ts",
                        null,
                        "Missing tests for invalid and expired tokens",
                        "The PR updates authentication behavior but does not add coverage for missing, invalid, or expired tokens.",
                        "Add tests that verify rejected requests for missing, malformed, and expired tokens.",
                        0.78
                )
        );

        return new ReviewAnalysisResponse(
                pullRequest,
                changeSummary,
                riskAssessment,
                files,
                findings,
                buildMarkdownReport(pullRequest, changeSummary, riskAssessment, findings)
        );
    }

    private String buildMarkdownReport(
            PullRequestInfo pullRequest,
            ChangeSummary changeSummary,
            RiskAssessment riskAssessment,
            List<ReviewFinding> findings
    ) {
        StringBuilder report = new StringBuilder();
        report.append("## PRPilot Review Report\n\n");
        report.append("### PR Summary\n");
        report.append("- Title: ").append(pullRequest.title()).append("\n");
        report.append("- Author: ").append(pullRequest.author()).append("\n");
        report.append("- Changed files: ").append(pullRequest.changedFiles()).append("\n");
        report.append("- Additions/Deletions: +").append(pullRequest.additions())
                .append(" / -").append(pullRequest.deletions()).append("\n\n");

        report.append("### Change Summary\n");
        report.append(changeSummary.overview()).append("\n\n");

        report.append("### Risk Assessment\n");
        report.append("- Score: ").append(riskAssessment.score()).append(" / 100\n");
        report.append("- Level: ").append(riskAssessment.level()).append("\n");
        for (String reason : riskAssessment.reasons()) {
            report.append("- ").append(reason).append("\n");
        }
        report.append("\n");

        report.append("### Review Findings\n");
        for (ReviewFinding finding : findings) {
            report.append("- [").append(finding.severity()).append("] ")
                    .append(finding.title()).append(" (`")
                    .append(finding.file()).append("`)\n");
        }

        report.append("\n### Suggested Next Steps\n");
        report.append("- Remove sensitive logging from auth code.\n");
        report.append("- Move secret-like configuration to environment variables.\n");
        report.append("- Add focused tests for authentication and payment permission paths.\n");
        return report.toString();
    }
}
