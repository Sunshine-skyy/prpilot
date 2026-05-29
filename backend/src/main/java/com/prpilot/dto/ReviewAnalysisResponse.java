package com.prpilot.dto;

import java.util.List;

public record ReviewAnalysisResponse(
        PullRequestInfo pullRequest,
        ChangeSummary changeSummary,
        RiskAssessment riskAssessment,
        List<FileChange> files,
        List<ReviewFinding> findings,
        String markdownReport
) {
}
