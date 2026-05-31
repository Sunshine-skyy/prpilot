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

    private final MarkdownReportGenerator markdownReportGenerator;

    public DemoReviewService(MarkdownReportGenerator markdownReportGenerator) {
        this.markdownReportGenerator = markdownReportGenerator;
    }

    public ReviewAnalysisResponse getDemoAnalysis() {
        PullRequestInfo pullRequest = new PullRequestInfo(
                "Add token-based auth middleware",
                "https://github.com/Sunshine-skyy/prpilot/pull/19",
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
                        "避免记录 Bearer Token",
                        "认证中间件会记录传入的 token，可能导致凭证暴露在应用日志中。",
                        "移除 token 日志，只记录请求 ID、认证结果等非敏感请求元数据。",
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
                        "权限校验路径中遗留 TODO",
                        "支付权限流程中仍有 TODO，导致预期的授权行为不够明确。",
                        "用明确的权限检查替换 TODO，并为拒绝和允许支付的场景补充测试。",
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
                        "缺少无效和过期 token 的测试",
                        "该 PR 修改了认证行为，但没有覆盖缺失、无效或过期 token 的测试。",
                        "补充测试，验证缺失、格式错误和过期 token 的请求会被拒绝。",
                        0.78
                )
        );

        return new ReviewAnalysisResponse(
                pullRequest,
                changeSummary,
                riskAssessment,
                files,
                findings,
                markdownReportGenerator.generate(pullRequest, changeSummary, riskAssessment, files, findings, "zh")
        );
    }
}
