package com.prpilot.service;

import com.prpilot.dto.AnalyzeDiffRequest;
import com.prpilot.dto.ChangeSummary;
import com.prpilot.dto.FileChange;
import com.prpilot.dto.PullRequestInfo;
import com.prpilot.dto.ReviewAnalysisResponse;
import com.prpilot.dto.ReviewFinding;
import com.prpilot.rule.RiskRuleEngine;
import com.prpilot.rule.RiskRuleResult;
import com.prpilot.util.DiffParser;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ReviewAnalysisService {

    private final DiffParser diffParser;
    private final RiskRuleEngine riskRuleEngine;
    private final MarkdownReportGenerator markdownReportGenerator;

    public ReviewAnalysisService(
            DiffParser diffParser,
            RiskRuleEngine riskRuleEngine,
            MarkdownReportGenerator markdownReportGenerator
    ) {
        this.diffParser = diffParser;
        this.riskRuleEngine = riskRuleEngine;
        this.markdownReportGenerator = markdownReportGenerator;
    }

    public ReviewAnalysisResponse analyzeDiff(AnalyzeDiffRequest request) {
        List<FileChange> parsedFiles = diffParser.parse(request.diff());
        PullRequestInfo pullRequest = buildRawDiffPullRequestInfo(request, parsedFiles);
        RiskRuleResult riskRuleResult = riskRuleEngine.analyze(pullRequest, parsedFiles);
        ChangeSummary changeSummary = buildChangeSummary(request, riskRuleResult.files());
        List<ReviewFinding> findings = List.of();
        String markdownReport = markdownReportGenerator.generate(
                pullRequest,
                changeSummary,
                riskRuleResult.riskAssessment(),
                riskRuleResult.files(),
                findings
        );

        return new ReviewAnalysisResponse(
                pullRequest,
                changeSummary,
                riskRuleResult.riskAssessment(),
                riskRuleResult.files(),
                findings,
                markdownReport
        );
    }

    private PullRequestInfo buildRawDiffPullRequestInfo(AnalyzeDiffRequest request, List<FileChange> files) {
        return new PullRequestInfo(
                StringUtils.hasText(request.title()) ? request.title() : "Raw Diff Analysis",
                "raw-diff://manual-input",
                "manual-input",
                "draft",
                "unknown",
                "raw-diff",
                files.size(),
                files.stream().mapToInt(FileChange::additions).sum(),
                files.stream().mapToInt(FileChange::deletions).sum()
        );
    }

    private ChangeSummary buildChangeSummary(AnalyzeDiffRequest request, List<FileChange> files) {
        String overview = buildOverview(request, files);
        List<String> keyChanges = files.stream()
                .map(file -> "%s changed with +%d / -%d lines".formatted(
                        file.filename(),
                        file.additions(),
                        file.deletions()
                ))
                .toList();
        List<String> impactedAreas = files.stream()
                .flatMap(file -> file.riskTags().stream())
                .distinct()
                .toList();

        return new ChangeSummary(overview, keyChanges, impactedAreas);
    }

    private String buildOverview(AnalyzeDiffRequest request, List<FileChange> files) {
        if (StringUtils.hasText(request.description())) {
            return request.description();
        }
        if (files.isEmpty()) {
            return "Raw diff input did not contain any parseable file changes.";
        }
        return "Raw diff analysis parsed %d changed file%s with %d additions and %d deletions."
                .formatted(
                        files.size(),
                        files.size() == 1 ? "" : "s",
                        files.stream().mapToInt(FileChange::additions).sum(),
                        files.stream().mapToInt(FileChange::deletions).sum()
                );
    }
}
