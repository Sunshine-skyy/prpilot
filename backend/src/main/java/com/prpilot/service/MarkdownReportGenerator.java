package com.prpilot.service;

import com.prpilot.dto.ChangeSummary;
import com.prpilot.dto.FileChange;
import com.prpilot.dto.PullRequestInfo;
import com.prpilot.dto.ReviewFinding;
import com.prpilot.dto.RiskAssessment;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MarkdownReportGenerator {

    public String generate(
            PullRequestInfo pullRequest,
            ChangeSummary changeSummary,
            RiskAssessment riskAssessment,
            List<FileChange> files,
            List<ReviewFinding> findings,
            String language
    ) {
        return isChinese(language)
                ? generateChinese(pullRequest, changeSummary, riskAssessment, files, findings)
                : generateEnglish(pullRequest, changeSummary, riskAssessment, files, findings);
    }

    private String generateEnglish(
            PullRequestInfo pullRequest,
            ChangeSummary changeSummary,
            RiskAssessment riskAssessment,
            List<FileChange> files,
            List<ReviewFinding> findings
    ) {
        StringBuilder report = new StringBuilder();
        report.append("## PRPilot Review Report\n\n");

        report.append("### PR Summary\n");
        report.append("- Title: ").append(pullRequest.title()).append("\n");
        report.append("- Source: ").append(pullRequest.url()).append("\n");
        report.append("- Changed files: ").append(pullRequest.changedFiles()).append("\n");
        report.append("- Additions/Deletions: +").append(pullRequest.additions())
                .append(" / -").append(pullRequest.deletions()).append("\n\n");

        report.append("### Risk Assessment\n");
        report.append("- Score: ").append(riskAssessment.score()).append(" / 100\n");
        report.append("- Level: ").append(riskAssessment.level()).append("\n");
        for (String reason : riskAssessment.reasons()) {
            report.append("- ").append(reason).append("\n");
        }
        report.append("\n");

        report.append("### Key Changes\n");
        report.append(changeSummary.overview()).append("\n");
        for (String keyChange : changeSummary.keyChanges()) {
            report.append("- ").append(keyChange).append("\n");
        }
        report.append("\n");

        report.append("### Changed Files\n");
        for (FileChange file : files) {
            report.append("- `").append(file.filename()).append("` ")
                    .append("(+").append(file.additions()).append(" / -")
                    .append(file.deletions()).append(")");
            if (file.riskTags() != null && !file.riskTags().isEmpty()) {
                report.append(" — risk tags: ").append(String.join(", ", file.riskTags()));
            }
            report.append("\n");
        }
        report.append("\n");

        report.append("### Review Findings\n");
        if (findings.isEmpty()) {
            report.append("- No AI review findings were generated in Raw Diff rule-only mode.\n");
        } else {
            for (ReviewFinding finding : findings) {
                report.append("- [").append(finding.severity()).append("] ")
                        .append(finding.title()).append(" (`")
                        .append(finding.file()).append("`)\n");
            }
        }
        report.append("\n");

        report.append("### Suggested Next Steps\n");
        if (riskAssessment.reasons().isEmpty()) {
            report.append("- Continue with normal human review.\n");
        } else {
            report.append("- Review files marked with risk tags before merging.\n");
            report.append("- Add or update focused tests for risky behavior.\n");
            report.append("- Use the LLM analysis flow for detailed code review findings.\n");
        }

        return report.toString();
    }

    private String generateChinese(
            PullRequestInfo pullRequest,
            ChangeSummary changeSummary,
            RiskAssessment riskAssessment,
            List<FileChange> files,
            List<ReviewFinding> findings
    ) {
        StringBuilder report = new StringBuilder();
        report.append("## PRPilot 评审报告\n\n");

        report.append("### PR 概览\n");
        report.append("- 标题：").append(pullRequest.title()).append("\n");
        report.append("- 来源：").append(pullRequest.url()).append("\n");
        report.append("- 变更文件数：").append(pullRequest.changedFiles()).append("\n");
        report.append("- 新增/删除行数：+").append(pullRequest.additions())
                .append(" / -").append(pullRequest.deletions()).append("\n\n");

        report.append("### 风险评估\n");
        report.append("- 分数：").append(riskAssessment.score()).append(" / 100\n");
        report.append("- 等级：").append(labelRiskLevel(riskAssessment.level())).append("\n");
        for (String reason : riskAssessment.reasons()) {
            report.append("- ").append(labelRiskReason(reason)).append("\n");
        }
        report.append("\n");

        report.append("### 关键变更\n");
        report.append(changeSummary.overview()).append("\n");
        for (String keyChange : changeSummary.keyChanges()) {
            report.append("- ").append(keyChange).append("\n");
        }
        report.append("\n");

        report.append("### 变更文件\n");
        for (FileChange file : files) {
            report.append("- `").append(file.filename()).append("` ")
                    .append("(+").append(file.additions()).append(" / -")
                    .append(file.deletions()).append(")");
            if (file.riskTags() != null && !file.riskTags().isEmpty()) {
                report.append(" — 风险标签：").append(String.join("、", file.riskTags().stream().map(this::labelRiskTag).toList()));
            }
            report.append("\n");
        }
        report.append("\n");

        report.append("### Review 建议\n");
        if (findings.isEmpty()) {
            report.append("- 当前没有生成 AI Review 建议。\n");
        } else {
            for (ReviewFinding finding : findings) {
                report.append("- [").append(labelRiskLevel(finding.severity())).append("] ")
                        .append(localizedFindingTitle(finding)).append(" (`")
                        .append(finding.file()).append("`)\n");
            }
        }
        report.append("\n");

        report.append("### 建议下一步\n");
        if (riskAssessment.reasons().isEmpty()) {
            report.append("- 继续进行常规人工 Review。\n");
        } else {
            report.append("- 合并前优先检查带风险标签的文件。\n");
            report.append("- 针对高风险行为补充或更新测试。\n");
            report.append("- 结合 LLM 生成的 Review 建议做进一步代码审查。\n");
        }

        return report.toString();
    }

    private boolean isChinese(String language) {
        return "zh".equalsIgnoreCase(language);
    }

    private String localizedFindingTitle(ReviewFinding finding) {
        return hasText(finding.titleZh()) ? finding.titleZh() : finding.title();
    }

    private String labelRiskLevel(String level) {
        if (level == null) {
            return "未知风险";
        }
        return switch (level.toLowerCase()) {
            case "low" -> "低风险";
            case "medium" -> "中风险";
            case "high" -> "高风险";
            case "critical" -> "严重风险";
            default -> level;
        };
    }

    private String labelRiskReason(String reason) {
        if (reason == null) {
            return "";
        }
        return switch (reason) {
            case "Authentication or permission-related code changed." -> "认证或权限相关代码发生变更。";
            case "Database or schema-related code changed." -> "数据库或数据结构相关代码发生变更。";
            case "Configuration or secret-related keywords were changed." -> "配置或密钥相关关键词发生变更。";
            case "TODO or FIXME remains in the changed code." -> "变更代码中仍存在 TODO 或 FIXME。";
            case "Debug logging appears in the changed code." -> "变更代码中出现调试日志。";
            case "A catch block may swallow exceptions without handling them." -> "可能存在未处理异常的空 catch 代码块。";
            case "The diff appears to remove validation or guard logic." -> "本次变更可能删除了校验或保护逻辑。";
            case "A sensitive configuration, dependency, or security-related file changed." -> "敏感配置、依赖或安全相关文件发生变更。";
            case "Large pull request size increases review risk." -> "PR 规模较大，会增加 Review 风险。";
            case "Many files changed in a single pull request." -> "单个 PR 修改了较多文件。";
            case "No test files were changed in this pull request." -> "本次 PR 没有修改测试文件。";
            case "Authentication or permission changes do not include test updates." -> "认证或权限相关变更没有包含对应测试更新。";
            case "Database-related changes do not include test updates." -> "数据库相关变更没有包含对应测试更新。";
            case "Authentication-related files changed." -> "认证相关文件发生变更。";
            case "Token value is logged in the middleware path." -> "中间件路径中记录了 token 值。";
            case "Configuration contains a fake secret-like value that should be environment-driven." -> "配置中包含类似密钥的演示值，应改为通过环境变量配置。";
            case "TODO found in the payment permission flow." -> "支付权限流程中发现 TODO。";
            case "No new tests cover the updated risky behavior." -> "新增的高风险行为没有对应测试覆盖。";
            default -> reason;
        };
    }

    private String labelRiskTag(String tag) {
        if (tag == null) {
            return "";
        }
        return switch (tag) {
            case "auth-permission" -> "认证/权限";
            case "database" -> "数据库";
            case "config-secret" -> "配置/密钥";
            case "todo-fixme" -> "TODO/FIXME";
            case "debug-logging", "console-log" -> "调试日志";
            case "empty-catch" -> "空 catch";
            case "validation-removed" -> "删除校验";
            case "sensitive-file" -> "敏感文件";
            case "test-file" -> "测试文件";
            case "auth" -> "认证";
            case "missing-tests" -> "缺少测试";
            case "config" -> "配置";
            case "secret-keyword" -> "密钥关键词";
            case "permission" -> "权限";
            case "bug-risk" -> "缺陷风险";
            default -> tag;
        };
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }
}
