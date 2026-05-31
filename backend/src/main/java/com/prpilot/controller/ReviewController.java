package com.prpilot.controller;

import com.prpilot.dto.AnalyzeDiffRequest;
import com.prpilot.dto.AnalyzePullRequestRequest;
import com.prpilot.dto.FetchPullRequestRequest;
import com.prpilot.dto.GitHubPullRequestFetchResponse;
import com.prpilot.dto.ReviewAnalysisResponse;
import com.prpilot.dto.ReviewAnalysisStreamEvent;
import com.prpilot.service.DemoReviewService;
import com.prpilot.service.GitHubPullRequestService;
import com.prpilot.service.ReviewAnalysisService;
import jakarta.validation.Valid;
import java.io.IOException;
import java.util.concurrent.CompletableFuture;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

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

    @PostMapping("/analyze-pr")
    public ReviewAnalysisResponse analyzePullRequest(@Valid @RequestBody AnalyzePullRequestRequest request) {
        return reviewAnalysisService.analyzePullRequest(request);
    }

    @PostMapping(path = "/analyze-diff-stream", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter analyzeDiffStream(@Valid @RequestBody AnalyzeDiffRequest request) {
        SseEmitter emitter = new SseEmitter(180_000L);
        CompletableFuture.runAsync(() -> {
            try {
                ReviewAnalysisResponse result = reviewAnalysisService.analyzeDiff(request, (stage, message) -> sendEvent(emitter, ReviewAnalysisStreamEvent.progress(stage, message)));
                sendEvent(emitter, ReviewAnalysisStreamEvent.completed(result));
                emitter.complete();
            } catch (Exception exception) {
                completeWithError(emitter, exception);
            }
        });
        return emitter;
    }

    @PostMapping(path = "/analyze-pr-stream", produces = "text/event-stream;charset=UTF-8")
    public SseEmitter analyzePullRequestStream(@Valid @RequestBody AnalyzePullRequestRequest request) {
        SseEmitter emitter = new SseEmitter(180_000L);
        CompletableFuture.runAsync(() -> {
            try {
                ReviewAnalysisResponse result = reviewAnalysisService.analyzePullRequest(request, (stage, message) -> sendEvent(emitter, ReviewAnalysisStreamEvent.progress(stage, message)));
                sendEvent(emitter, ReviewAnalysisStreamEvent.completed(result));
                emitter.complete();
            } catch (Exception exception) {
                completeWithError(emitter, exception);
            }
        });
        return emitter;
    }

    private void sendEvent(SseEmitter emitter, ReviewAnalysisStreamEvent event) {
        try {
            emitter.send(SseEmitter.event()
                    .name(event.status())
                    .data(event, MediaType.APPLICATION_JSON));
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to send analysis stream event.", exception);
        }
    }

    private void completeWithError(SseEmitter emitter, Exception exception) {
        try {
            sendEvent(emitter, ReviewAnalysisStreamEvent.error(exception.getMessage() == null ? "Analysis failed." : exception.getMessage()));
            emitter.complete();
        } catch (Exception ignored) {
            emitter.completeWithError(exception);
        }
    }
}
