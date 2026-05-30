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
            report.append("- Use the upcoming LLM analysis flow for detailed code review findings.\n");
        }

        return report.toString();
    }
}
