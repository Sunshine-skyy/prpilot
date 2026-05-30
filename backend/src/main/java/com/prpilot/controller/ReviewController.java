package com.prpilot.controller;

import com.prpilot.dto.AnalyzeDiffRequest;
import com.prpilot.dto.FetchPullRequestRequest;
import com.prpilot.dto.GitHubPullRequestFetchResponse;
import com.prpilot.dto.ReviewAnalysisResponse;
import com.prpilot.service.DemoReviewService;
import com.prpilot.service.GitHubPullRequestService;
import com.prpilot.service.ReviewAnalysisService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
public class ReviewController {

    private final DemoReviewService demoReviewService;
    private final GitHubPullRequestService gitHubPullRequestService;
    private final ReviewAnalysisService reviewAnalysisService;

    public ReviewController(
            DemoReviewService demoReviewService,
            GitHubPullRequestService gitHubPullRequestService,
            ReviewAnalysisService reviewAnalysisService
    ) {
        this.demoReviewService = demoReviewService;
        this.gitHubPullRequestService = gitHubPullRequestService;
        this.reviewAnalysisService = reviewAnalysisService;
    }

    @GetMapping("/demo")
    public ReviewAnalysisResponse getDemoReview() {
        return demoReviewService.getDemoAnalysis();
    }

    @PostMapping("/fetch-pr")
    public GitHubPullRequestFetchResponse fetchPullRequest(@Valid @RequestBody FetchPullRequestRequest request) {
        return gitHubPullRequestService.fetchPullRequest(request.prUrl(), request.githubToken());
    }

    @PostMapping("/analyze-diff")
    public ReviewAnalysisResponse analyzeDiff(@Valid @RequestBody AnalyzeDiffRequest request) {
        return reviewAnalysisService.analyzeDiff(request);
    }
}
