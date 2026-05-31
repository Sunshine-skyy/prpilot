package com.prpilot.service;

import com.prpilot.client.LlmClient;
import com.prpilot.dto.AnalyzeDiffRequest;
import com.prpilot.dto.AnalyzePullRequestRequest;
import com.prpilot.dto.ChangeSummary;
import com.prpilot.dto.FileChange;
import com.prpilot.dto.GitHubPullRequestFetchResponse;
import com.prpilot.dto.PullRequestInfo;
import com.prpilot.dto.ReviewAnalysisResponse;
import com.prpilot.dto.ReviewFinding;
import com.prpilot.rule.RiskRuleEngine;
import com.prpilot.rule.RiskRuleResult;
import com.prpilot.util.DiffParser;
import java.util.List;
import java.util.function.BiConsumer;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ReviewAnalysisService {

    private static final BiConsumer<String, String> NOOP_PROGRESS = (stage, message) -> {
    };

    private final DiffParser diffParser;
    private final RiskRuleEngine riskRuleEngine;
    private final MarkdownReportGenerator markdownReportGenerator;
    private final ContextBuilder contextBuilder;
    private final ReviewPromptBuilder reviewPromptBuilder;
    private final LlmClient llmClient;
    private final GitHubPullRequestService gitHubPullRequestService;

    public ReviewAnalysisService(
            DiffParser diffParser,
            RiskRuleEngine riskRuleEngine,
            MarkdownReportGenerator markdownReportGenerator,
            ContextBuilder contextBuilder,
            ReviewPromptBuilder reviewPromptBuilder,
            LlmClient llmClient,
            GitHubPullRequestService gitHubPullRequestService
    ) {
        this.diffParser = diffParser;
        this.riskRuleEngine = riskRuleEngine;
        this.markdownReportGenerator = markdownReportGenerator;
        this.contextBuilder = contextBuilder;
        this.reviewPromptBuilder = reviewPromptBuilder;
        this.llmClient = llmClient;
        this.gitHubPullRequestService = gitHubPullRequestService;
    }

    public ReviewAnalysisResponse analyzeDiff(AnalyzeDiffRequest request) {
        return analyzeDiff(request, NOOP_PROGRESS);
    }

    public ReviewAnalysisResponse analyzeDiff(AnalyzeDiffRequest request, BiConsumer<String, String> progressSink) {
        progressSink.accept("parsing_diff", "Parsing raw diff input.");
        List<FileChange> parsedFiles = diffParser.parse(request.diff());
        PullRequestInfo pullRequest = buildRawDiffPullRequestInfo(request, parsedFiles);
        return analyzeFiles(pullRequest, parsedFiles, request.description(), request.focusAreas(), request.language(), progressSink);
    }

    public ReviewAnalysisResponse analyzePullRequest(AnalyzePullRequestRequest request) {
        return analyzePullRequest(request, NOOP_PROGRESS);
    }

    public ReviewAnalysisResponse analyzePullRequest(AnalyzePullRequestRequest request, BiConsumer<String, String> progressSink) {
        progressSink.accept("fetching_pr", "Fetching pull request metadata and changed files from GitHub.");
        GitHubPullRequestFetchResponse fetchedPullRequest = gitHubPullRequestService.fetchPullRequest(
                request.prUrl(),
                request.githubToken()
        );
        progressSink.accept("parsing_diff", "Preparing changed files for analysis.");
        return analyzeFiles(
                fetchedPullRequest.pullRequest(),
                fetchedPullRequest.files(),
                null,
                request.focusAreas(),
                request.language(),
                progressSink
        );
    }

    private ReviewAnalysisResponse analyzeFiles(
            PullRequestInfo pullRequest,
            List<FileChange> files,
            String description,
            List<String> focusAreas,
            String language,
            BiConsumer<String, String> progressSink
    ) {
        String normalizedLanguage = normalizeLanguage(language);
        progressSink.accept("running_rules", "Running deterministic risk rules against changed files.");
        RiskRuleResult riskRuleResult = riskRuleEngine.analyze(pullRequest, files);
        ChangeSummary changeSummary = buildChangeSummary(description, riskRuleResult.files());
        progressSink.accept("calling_llm", llmClient.isAvailable()
                ? "Calling the configured LLM for review findings."
                : "LLM is not configured; skipping AI review findings.");
        List<ReviewFinding> findings = generateFindings(
                pullRequest,
                changeSummary,
                riskRuleResult,
                focusAreas,
                normalizedLanguage
        );
        progressSink.accept("generating_report", "Generating the Markdown review report.");
        String markdownReport = markdownReportGenerator.generate(
                pullRequest,
                changeSummary,
                riskRuleResult.riskAssessment(),
                riskRuleResult.files(),
                findings,
                normalizedLanguage
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

    private List<ReviewFinding> generateFindings(
            PullRequestInfo pullRequest,
            ChangeSummary changeSummary,
            RiskRuleResult riskRuleResult,
            List<String> focusAreas,
            String language
    ) {
        if (!llmClient.isAvailable()) {
            return List.of();
        }

        String context = contextBuilder.buildReviewContext(
                pullRequest,
                changeSummary,
                riskRuleResult.riskAssessment(),
                riskRuleResult.files(),
                focusAreas
        );
        return llmClient.generateReviewFindings(
                reviewPromptBuilder.buildSystemPrompt(language),
                reviewPromptBuilder.buildUserPrompt(context, language)
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

    private ChangeSummary buildChangeSummary(String description, List<FileChange> files) {
        String overview = buildOverview(description, files);
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

    private String buildOverview(String description, List<FileChange> files) {
        if (StringUtils.hasText(description)) {
            return description;
        }
        if (files.isEmpty()) {
            return "No parseable file changes were found for this analysis.";
        }
        return "PRPilot analyzed %d changed file%s with %d additions and %d deletions."
                .formatted(
                        files.size(),
                        files.size() == 1 ? "" : "s",
                        files.stream().mapToInt(FileChange::additions).sum(),
                        files.stream().mapToInt(FileChange::deletions).sum()
                );
    }

    private String normalizeLanguage(String language) {
        return "zh".equalsIgnoreCase(language) ? "zh" : "en";
    }
}
